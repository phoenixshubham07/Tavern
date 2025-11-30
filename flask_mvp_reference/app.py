from flask import Flask, render_template, request, redirect, url_for, flash, abort
from models import db, User, Note, Server, Channel
from flask_login import current_user, login_required, LoginManager, login_user, logout_user
from flask_socketio import SocketIO
from events import register_events

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inkflow.db'
app.config['SECRET_KEY'] = 'your-secret-key'

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

socketio = SocketIO(app, async_mode='eventlet')
register_events(socketio)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        user = User.query.filter_by(username=username).first()
        if not user:
            user = User(username=username)
            db.session.add(user)
            db.session.commit()
        login_user(user)
        return redirect(url_for('collab'))
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/view/<share_token>')
def view_shared(share_token):
    # Query the note by token and eagerly load the owner to access username
    # In SQLAlchemy, accessing note.owner will lazy load it by default, 
    # but joinedload is better for performance if needed. 
    # For this MVP, simple access is fine.
    
    note = Note.query.filter_by(share_token=share_token).first_or_404()
    
    if not note.is_public and (not current_user.is_authenticated or note.owner_id != current_user.id):
        abort(403) # Not public and not the owner
        
    return render_template('view_shared.html', note=note)

@app.route('/remix/<int:original_note_id>', methods=['POST'])
@login_required
def remix_note(original_note_id):
    original_note = Note.query.get_or_404(original_note_id)
    
    # Create a NEW note (Copy-on-Write)
    new_note = Note(
        content=original_note.content, # Copy content
        owner_id=current_user.id,      # Attribute to current user
        parent_id=original_note.id,    # Track attribution
        is_public=False                # Default to private
    )
    
    db.session.add(new_note)
    db.session.commit()
    
    flash(f"Remixed from @{original_note.owner.username}!")
    return redirect(url_for('editor', note_id=new_note.id))

@app.route('/editor/<int:note_id>')
@login_required
def editor(note_id):
    note = Note.query.get_or_404(note_id)
    
    if note.owner_id != current_user.id:
        abort(403)
        
    return render_template('editor.html', note=note)

@app.route('/collab')
@login_required
def collab():
    # Seed default server if it doesn't exist
    server = Server.query.filter_by(name='Tavern General').first()
    if not server:
        server = Server(name='Tavern General', invite_code='TAVERN01', owner_id=current_user.id)
        db.session.add(server)
        db.session.commit()
        
        channel = Channel(name='general', server_id=server.id)
        db.session.add(channel)
        db.session.commit()
    
    servers = Server.query.all()
    return render_template('collab.html', servers=servers, current_user=current_user)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)
