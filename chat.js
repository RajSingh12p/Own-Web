class EnhancedChatSystem {
    constructor() {
        this.currentUser = null;
        this.currentRoom = 'general';
        this.chatRooms = {
            general: { name: 'General Discussion', description: 'Welcome to the general chat room', icon: '💬', messages: [] },
            gaming: { name: 'Gaming Zone', description: 'Talk about your favorite games', icon: '🎮', messages: [] },
            study: { name: 'Study Hall', description: 'Academic discussions and help', icon: '📚', messages: [] }
        };
        this.onlineUsers = new Set();
        this.messageUpdateInterval = null;
        this.typingTimeout = null;
        this.typingUsers = new Set();
        this.notificationsEnabled = true;
        this.isVoiceRecording = false;
        this.selectedRoomIcon = '💬';
        this.emojiCategories = {
            faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝'],
            objects: ['🎮', '🕹️', '🎯', '🎲', '🎵', '🎶', '🎤', '🎧', '📱', '💻', '⌨️', '🖱️', '🖥️', '📺', '📷', '📹', '🎬', '📚', '📖', '📝', '✏️', '🖊️', '🖍️'],
            symbols: ['❤️', '💕', '💖', '💗', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💨', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '🔥', '⭐', '✨', '💫']
        };
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        // Verify user authentication
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!this.currentUser) {
            this.redirectToLogin();
            return;
        }

        // Load stored data
        this.loadStoredData();
        this.addUserToOnlineList();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize UI
        this.initializeUI();
        this.updateOnlineUsersDisplay();
        this.renderMessages();

        // Start real-time updates
        this.startRealTimeUpdates();

        this.isInitialized = true;
        this.showNotification('Connected to chat', 'success');
    }

    redirectToLogin() {
        this.showNotification('Authentication required. Redirecting to login...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    loadStoredData() {
        try {
            // Load chat rooms
            const storedRooms = localStorage.getItem('foxKingChat_rooms');
            if (storedRooms) {
                const parsedRooms = JSON.parse(storedRooms);
                this.chatRooms = { ...this.chatRooms, ...parsedRooms };
            }

            // Load online users
            const storedUsers = localStorage.getItem('foxKingChat_onlineUsers');
            if (storedUsers) {
                this.onlineUsers = new Set(JSON.parse(storedUsers));
            }

            // Load notification settings
            const notifSetting = localStorage.getItem('foxKingChat_notifications');
            if (notifSetting !== null) {
                this.notificationsEnabled = JSON.parse(notifSetting);
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    saveRooms() {
        try {
            localStorage.setItem('foxKingChat_rooms', JSON.stringify(this.chatRooms));
        } catch (error) {
            console.error('Error saving rooms:', error);
        }
    }

    addUserToOnlineList() {
        if (!this.currentUser) return;
        this.onlineUsers.add(this.currentUser.username);
        this.saveOnlineUsers();
    }

    saveOnlineUsers() {
        try {
            const userArray = Array.from(this.onlineUsers);
            localStorage.setItem('foxKingChat_onlineUsers', JSON.stringify(userArray));
        } catch (error) {
            console.error('Error saving online users:', error);
        }
    }

    setupEventListeners() {
        // Message input
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                } else {
                    this.handleTyping();
                }
            });

            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        // Storage sync across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'foxKingChat_rooms') {
                this.loadStoredData();
                this.renderMessages();
            } else if (e.key === 'foxKingChat_onlineUsers') {
                this.loadStoredData();
                this.updateOnlineUsersDisplay();
            }
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Click outside to close emoji picker
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emoji-picker');
            const emojiBtn = document.querySelector('[onclick="toggleEmojis()"]');
            if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    initializeUI() {
        // Initialize emoji picker
        this.initializeEmojiPicker();

        // Update notification button
        this.updateNotificationButton();

        // Set current room info
        this.updateRoomInfo();
    }

    initializeEmojiPicker() {
        this.showEmojiCategory('faces');
    }

    showEmojiCategory(category) {
        const grid = document.getElementById('emoji-grid');
        const categories = document.querySelectorAll('.emoji-category');

        if (!grid) return;

        // Update active category button
        categories.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[onclick="showEmojiCategory('${category}')"]`)?.classList.add('active');

        // Show emojis for category
        grid.innerHTML = '';
        this.emojiCategories[category].forEach(emoji => {
            const emojiElement = document.createElement('span');
            emojiElement.className = 'emoji';
            emojiElement.textContent = emoji;
            emojiElement.onclick = () => this.insertEmoji(emoji);
            grid.appendChild(emojiElement);
        });
    }

    insertEmoji(emoji) {
        const input = document.getElementById('message-input');
        if (input) {
            const cursorPos = input.selectionStart;
            const textBefore = input.value.substring(0, cursorPos);
            const textAfter = input.value.substring(cursorPos);
            input.value = textBefore + emoji + textAfter;
            input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
            input.focus();
            this.toggleEmojis();
        }
    }

    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Show typing indicator for other users
        this.typingUsers.add(this.currentUser.username);
        this.updateTypingIndicator();

        this.typingTimeout = setTimeout(() => {
            this.typingUsers.delete(this.currentUser.username);
            this.updateTypingIndicator();
        }, 3000);
    }

    updateTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        const typingText = document.getElementById('typing-text');

        if (!indicator || !typingText) return;

        const otherTypingUsers = Array.from(this.typingUsers).filter(user => user !== this.currentUser.username);

        if (otherTypingUsers.length > 0) {
            let text = '';
            if (otherTypingUsers.length === 1) {
                text = `${otherTypingUsers[0]} is typing...`;
            } else if (otherTypingUsers.length === 2) {
                text = `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
            } else {
                text = `${otherTypingUsers.length} people are typing...`;
            }
            typingText.textContent = text;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }

    switchRoom(roomId) {
        if (roomId === this.currentRoom) return;

        // Remove active class from current room
        document.querySelectorAll('.room-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to new room
        const roomElement = document.querySelector(`[data-room="${roomId}"]`);
        if (roomElement) {
            roomElement.classList.add('active');
        }

        // Switch current room
        this.currentRoom = roomId;

        // Update UI
        this.updateRoomInfo();
        this.renderMessages();

        // Clear typing indicator
        this.typingUsers.clear();
        this.updateTypingIndicator();

        this.showNotification(`Switched to ${this.chatRooms[roomId]?.name || roomId}`, 'info');
    }

    updateRoomInfo() {
        const roomNameEl = document.getElementById('current-room-name');
        const roomDescEl = document.getElementById('room-description');

        if (roomNameEl && this.chatRooms[this.currentRoom]) {
            roomNameEl.textContent = this.chatRooms[this.currentRoom].name;
        }

        if (roomDescEl && this.chatRooms[this.currentRoom]) {
            roomDescEl.textContent = this.chatRooms[this.currentRoom].description;
        }
    }

    renderMessages() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const room = this.chatRooms[this.currentRoom];
        if (!room) return;

        container.innerHTML = '';

        if (room.messages.length === 0) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-message';
            welcomeDiv.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px; font-style: italic;">
                    <h3 style="color: #1DB954; margin-bottom: 10px;">Welcome to ${room.name}!</h3>
                    <p>${room.description}</p>
                    <p style="margin-top: 15px;">Start the conversation...</p>
                </div>
            `;
            container.appendChild(welcomeDiv);
            return;
        }

        room.messages.forEach((message, index) => {
            const messageEl = this.createMessageElement(message);
            messageEl.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(messageEl);
        });

        // Auto-scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    createMessageElement(message) {
        const messageEl = document.createElement('div');
        const isOwn = this.currentUser && message.author === this.currentUser.username;

        messageEl.className = `message ${isOwn ? 'sent' : 'received'}`;
        messageEl.setAttribute('data-message-id', message.id);

        let messageContent;
        if (message.type === 'file') {
            const fileSize = this.formatFileSize(message.fileSize || 0);
            messageContent = `
                <div class="file-message">
                    <span class="file-icon">${this.getFileIcon(message.fileName)}</span>
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(message.fileName)}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <button class="download-file-btn" onclick="downloadSharedFile('${message.fileData}', '${this.escapeHtml(message.fileName)}')">Download</button>
                </div>
            `;
        } else {
            messageContent = `<div class="message-text">${this.processMessageText(message.text)}</div>`;
        }

        const userAvatar = this.getUserAvatar(message.author);
        const messageTime = message.time || new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        if (isOwn) {
            messageEl.innerHTML = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${this.escapeHtml(message.author)}</span>
                        <span class="message-time">${messageTime}</span>
                    </div>
                    ${messageContent}
                </div>
                <div class="message-avatar">${userAvatar}</div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="message-avatar">${userAvatar}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-author">${this.escapeHtml(message.author)}</span>
                        <span class="message-time">${messageTime}</span>
                    </div>
                    ${messageContent}
                </div>
            `;
        }

        return messageEl;
    }

    getUserAvatar(username) {
        if (username === this.currentUser?.username && this.currentUser.profileIcon) {
            const icon = this.currentUser.profileIcon;
            return icon.startsWith('data:image/') ? 
                `<img src="${icon}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">` : 
                icon;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username);
        if (user && user.profileIcon) {
            const icon = user.profileIcon;
            return icon.startsWith('data:image/') ? 
                `<img src="${icon}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">` : 
                icon;
        }

        return username.charAt(0).toUpperCase();
    }

    processMessageText(text) {
        // Process URLs, mentions, and emojis
        let processedText = this.escapeHtml(text);

        // Make URLs clickable
        processedText = processedText.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" style="color: #1DB954; text-decoration: underline;">$1</a>'
        );

        // Highlight mentions
        processedText = processedText.replace(
            /@(\w+)/g, 
            '<span style="color: #667eea; font-weight: 600;">@$1</span>'
        );

        return processedText;
    }

    getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'txt': '📄',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
            'mp3': '🎵', 'wav': '🎵',
            'mp4': '🎬', 'avi': '🎬',
            'zip': '📦', 'rar': '📦'
        };
        return iconMap[extension] || '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async sendMessage(message, roomId = this.currentRoom) {
        if (!message.trim() || !this.currentUser) return;

        try {
            const messageData = {
                roomId: roomId,
                userId: this.currentUser.id,
                message: message.trim()
            };

            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const sentMessage = await response.json();

            // Add user info to message
            sentMessage.username = this.currentUser.username;
            sentMessage.display_name = this.currentUser.displayName || this.currentUser.username;

            // Add to local messages
            this.messages.push({
                id: sentMessage.id,
                user: sentMessage.username,
                displayName: sentMessage.display_name,
                message: sentMessage.message,
                timestamp: sentMessage.created_at,
                roomId: sentMessage.room_id
            });

            // Update UI
            this.renderMessages();
            this.scrollToBottom();

            // Clear input
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = '';
            }

            this.showTypingIndicator(false);

            return sentMessage;
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }

    sendFileMessage(fileName, fileData, fileSize) {
        if (!this.currentUser) return;

        const message = {
            id: Date.now() + Math.random(),
            author: this.currentUser.username,
            fileName: fileName,
            fileData: fileData,
            fileSize: fileSize,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
            timestamp: Date.now(),
            type: 'file'
        };

        if (!this.chatRooms[this.currentRoom]) {
            this.chatRooms[this.currentRoom] = { messages: [] };
        }

        this.chatRooms[this.currentRoom].messages.push(message);
        this.saveRooms();
        this.renderMessages();

        this.showMessageStatus('File shared');
    }

    updateOnlineUsersDisplay() {
        const userList = document.getElementById('online-users-list');
        const onlineCount = document.getElementById('online-count');

        if (!userList) return;

        userList.innerHTML = '';

        const onlineArray = Array.from(this.onlineUsers);
        if (onlineCount) {
            onlineCount.textContent = onlineArray.length;
        }

        onlineArray.forEach(username => {
            const userEl = document.createElement('div');
            userEl.className = 'user-item';

            const avatar = this.getUserAvatar(username);
            const isCurrentUser = username === this.currentUser?.username;

            userEl.innerHTML = `
                <div class="user-avatar">${avatar}</div>
                <span class="user-name">${this.escapeHtml(username)}${isCurrentUser ? ' (You)' : ''}</span>
                <div class="status-indicator online"></div>
            `;
            userList.appendChild(userEl);
        });
    }

    startRealTimeUpdates() {
        this.messageUpdateInterval = setInterval(() => {
            this.loadStoredData();

            // Check for new messages
            const currentRoom = this.chatRooms[this.currentRoom];
            const displayedMessages = document.querySelectorAll('.message[data-message-id]').length;

            if (currentRoom && currentRoom.messages.length !== displayedMessages) {
                this.renderMessages();
            }

            this.updateOnlineUsersDisplay();
        }, 2000);
    }

    // UI Action Methods
    toggleEmojis() {
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            const isVisible = picker.style.display !== 'none';
            picker.style.display = isVisible ? 'none' : 'block';
        }
    }

    toggleNotifications() {
        this.notificationsEnabled = !this.notificationsEnabled;
        localStorage.setItem('foxKingChat_notifications', JSON.stringify(this.notificationsEnabled));
        this.updateNotificationButton();

        const status = this.notificationsEnabled ? 'enabled' : 'disabled';
        this.showNotification(`Notifications ${status}`, 'info');
    }

    updateNotificationButton() {
        const btn = document.getElementById('notification-btn');
        if (btn) {
            btn.textContent = this.notificationsEnabled ? '🔔' : '🔕';
            btn.title = this.notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications';
        }
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear the chat history for this room?')) {
            if (this.chatRooms[this.currentRoom]) {
                this.chatRooms[this.currentRoom].messages = [];
                this.saveRooms();
                this.renderMessages();
                this.showNotification('Chat history cleared', 'info');
            }
        }
    }



    toggleVoiceRecording() {
        const btn = document.getElementById('voice-btn');
        if (!btn) return;

        if (this.isVoiceRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        // Simulated voice recording (would need actual implementation)
        this.isVoiceRecording = true;
        const btn = document.getElementById('voice-btn');
        btn.classList.add('recording');
        btn.textContent = '⏹️';
        btn.title = 'Stop Recording';

        this.showMessageStatus('Recording voice message...');

        // Auto-stop after 10 seconds (demo)
        setTimeout(() => {
            if (this.isVoiceRecording) {
                this.stopVoiceRecording();
            }
        }, 10000);
    }

    stopVoiceRecording() {
        // Simulated stop recording
        this.isVoiceRecording = false;
        const btn = document.getElementById('voice-btn');
        btn.classList.remove('recording');
        btn.textContent = '🎤';
        btn.title = 'Voice Message';

        this.showMessageStatus('Voice recording stopped');
        this.showNotification('Voice messages not yet implemented', 'info');
    }

    showMessageStatus(text) {
        const statusEl = document.getElementById('message-status');
        if (statusEl) {
            statusEl.textContent = text;
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

        const colors = {
            success: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
            error: 'linear-gradient(135deg, #FF5E5E 0%, #FF8A80 100%)',
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 4000);
    }

    playNotificationSound() {
        // Simple notification sound (could be replaced with actual audio)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio notification not available');
        }
    }

    cleanup() {
        if (this.messageUpdateInterval) {
            clearInterval(this.messageUpdateInterval);
        }

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        if (this.currentUser) {
            this.onlineUsers.delete(this.currentUser.username);
            this.saveOnlineUsers();
        }
    }
}

// Global functions for HTML event handlers
function toggleEmojis() {
    if (window.chatSystem) {
        window.chatSystem.toggleEmojis();
    }
}

function showEmojiCategory(category) {
    if (window.chatSystem) {
        window.chatSystem.showEmojiCategory(category);
    }
}

function sendMessage() {
    if (window.chatSystem) {
        window.chatSystem.sendMessage();
    }
}

function switchRoom(roomId) {
    if (window.chatSystem) {
        window.chatSystem.switchRoom(roomId);
    }
}



function clearChatHistory() {
    if (window.chatSystem) {
        window.chatSystem.clearChatHistory();
    }
}

function toggleNotifications() {
    if (window.chatSystem) {
        window.chatSystem.toggleNotifications();
    }
}

function toggleVoiceRecording() {
    if (window.chatSystem) {
        window.chatSystem.toggleVoiceRecording();
    }
}

function handleFileShare(input) {
    const file = input.files[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
        if (window.chatSystem) {
            window.chatSystem.showNotification('File too large. Maximum size is 10MB.', 'error');
        }
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (window.chatSystem) {
            window.chatSystem.sendFileMessage(file.name, e.target.result, file.size);
        }
    };
    reader.readAsDataURL(file);
}

function downloadSharedFile(fileData, fileName) {
    try {
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.chatSystem) {
            window.chatSystem.showNotification(`Downloaded ${fileName}`, 'success');
        }
    } catch (error) {
        if (window.chatSystem) {
            window.chatSystem.showNotification('Download failed', 'error');
        }
    }
}

// Initialize enhanced chat system
document.addEventListener('DOMContentLoaded', function() {
    window.chatSystem = new EnhancedChatSystem();
    window.chatSystem.init();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
