from flask import request
from flask_socketio import join_room, leave_room, emit
from models import db, Message

def register_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        print(f'Client connected: {request.sid}')

    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Client disconnected: {request.sid}')

    @socketio.on('join_server')
    def handle_join_server(data):
        server_id = data.get('server_id')
        user_id = data.get('user_id')
        room = f'server_{server_id}'
        join_room(room)
        emit('status', {'msg': f'User {user_id} has joined the server.'}, room=room)

    @socketio.on('join_channel')
    def handle_join_channel(data):
        channel_id = data.get('channel_id')
        room = f'channel_{channel_id}'
        join_room(room)
        print(f'User joined channel room: {room}')

    @socketio.on('send_message')
    def handle_send_message(data):
        channel_id = data.get('channel_id')
        user_id = data.get('user_id')
        content = data.get('content')
        
        # Save to DB
        new_msg = Message(content=content, user_id=user_id, channel_id=channel_id)
        db.session.add(new_msg)
        db.session.commit()
        
        room = f'channel_{channel_id}'
        emit('message', {
            'content': content,
            'user_id': user_id,
            'timestamp': str(new_msg.timestamp)
        }, room=room)

    @socketio.on('join_voice')
    def handle_join_voice(data):
        peer_id = data.get('peer_id')
        server_id = data.get('server_id')
        room = f'server_{server_id}'
        # Broadcast to everyone else in the server that a new peer has joined voice
        emit('user_joined_voice', {'peer_id': peer_id}, room=room, include_self=False)
