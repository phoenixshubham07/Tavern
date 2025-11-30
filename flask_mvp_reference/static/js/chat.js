document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const currentUserId = document.getElementById('current-user-id').value;
    const messagesArea = document.getElementById('messages-area');
    const messageInput = document.getElementById('message-input');
    const joinVoiceBtn = document.getElementById('join-voice-btn');

    // Default to first server/channel for MVP
    // In a real app, these would come from the URL or data attributes
    const currentServerId = 1;
    const currentChannelId = 1;

    // Join Server
    socket.emit('join_server', { server_id: currentServerId, user_id: currentUserId });
    socket.emit('join_channel', { channel_id: currentChannelId });

    // Socket Events
    socket.on('message', (data) => {
        addMessage(data.user_id, data.content, data.timestamp);
    });

    socket.on('status', (data) => {
        addSystemMessage(data.msg);
    });

    socket.on('user_joined_voice', (data) => {
        addSystemMessage(`User with Peer ID ${data.peer_id} joined voice.`);
        connectToPeer(data.peer_id);
    });

    // Send Message
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && messageInput.value.trim()) {
            socket.emit('send_message', {
                channel_id: currentChannelId,
                user_id: currentUserId,
                content: messageInput.value
            });
            messageInput.value = '';
        }
    });

    function addMessage(userId, content, timestamp) {
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = `<strong>User ${userId}</strong>: ${content}`;
        messagesArea.appendChild(div);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function addSystemMessage(msg) {
        const div = document.createElement('div');
        div.className = 'message system';
        div.innerText = msg;
        messagesArea.appendChild(div);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // --- PeerJS Video/Voice Logic ---
    let peer = null;

    joinVoiceBtn.addEventListener('click', () => {
        if (peer) return; // Already joined

        peer = new Peer(); // Auto-generate ID

        peer.on('open', (id) => {
            addSystemMessage(`Connected to voice with ID: ${id}`);
            socket.emit('join_voice', {
                peer_id: id,
                server_id: currentServerId
            });
            joinVoiceBtn.innerText = 'Voice Connected';
            joinVoiceBtn.disabled = true;
            joinVoiceBtn.style.backgroundColor = '#3ba55c';
        });

        peer.on('call', (call) => {
            // Answer incoming calls automatically for MVP
            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then((stream) => {
                    call.answer(stream);
                    call.on('stream', (remoteStream) => {
                        playStream(remoteStream);
                    });
                })
                .catch(err => console.error('Failed to get local stream', err));
        });
    });

    function connectToPeer(remotePeerId) {
        if (!peer) return;

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((stream) => {
                const call = peer.call(remotePeerId, stream);
                call.on('stream', (remoteStream) => {
                    playStream(remoteStream);
                });
            })
            .catch(err => console.error('Failed to get local stream', err));
    }

    function playStream(stream) {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.play();
    }
});
