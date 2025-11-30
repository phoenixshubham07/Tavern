from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from uuid import uuid4

db = SQLAlchemy()

class User(UserMixin, db.Model):
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

# --- Collaboration Layer Models ---

# Association table for Server Members
server_members = db.Table('server_members',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('server_id', db.Integer, db.ForeignKey('servers.id'), primary_key=True)
)

class Server(db.Model):
    __tablename__ = 'servers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    invite_code = db.Column(db.String(10), unique=True, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    channels = db.relationship('Channel', backref='server', lazy=True)
    members = db.relationship('User', secondary=server_members, lazy='subquery',
        backref=db.backref('servers', lazy=True))

class Channel(db.Model):
    __tablename__ = 'channels'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    server_id = db.Column(db.Integer, db.ForeignKey('servers.id'), nullable=False)
    messages = db.relationship('Message', backref='channel', lazy=True)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', backref='messages')
    
    channel_id = db.Column(db.Integer, db.ForeignKey('channels.id'), nullable=False)

class DirectMessage(db.Model):
    __tablename__ = 'direct_messages'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_dms')
    
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_dms')
