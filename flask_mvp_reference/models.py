from flask_sqlalchemy import SQLAlchemy
from uuid import uuid4

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    
    # Relationship defined in Note via backref, but can be explicit here if needed
    # notes = db.relationship('Note', backref='owner', lazy=True)

class Note(db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    
    # Ownership
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    owner = db.relationship('User', backref=db.backref('notes', lazy=True))
    
    # Remix / Copy-on-Write Logic
    # Self-referential relationship to track the original note
    parent_id = db.Column(db.Integer, db.ForeignKey('notes.id'), nullable=True)
    parent = db.relationship('Note', remote_side=[id], backref='remixes')
    
    # Sharing
    share_token = db.Column(db.String(36), unique=True, default=lambda: str(uuid4()))
    is_public = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    def __repr__(self):
        return f'<Note {self.id} Owner={self.owner.username}>'
