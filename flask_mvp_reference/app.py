from flask import Flask, render_template, request, redirect, url_for, flash, abort
from models import db, User, Note
from flask_login import current_user, login_required, LoginManager

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inkflow.db'
app.config['SECRET_KEY'] = 'your-secret-key'

db.init_app(app)
login_manager = LoginManager(app)

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
