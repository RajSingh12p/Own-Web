
// Owner panel functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is actually the owner
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.username.toLowerCase() !== 'raj') {
        alert('Access denied! This area is for the owner only.');
        window.location.href = 'index.html';
        return;
    }

    loadStatistics();
    setupUploadForms();
});

async function loadStatistics() {
    try {
        const [users, games, assignments] = await Promise.all([
            fetch('/api/users').then(r => r.json()),
            fetch('/api/games').then(r => r.json()),
            fetch('/api/schoolwork').then(r => r.json())
        ]);
        
        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-games').textContent = games.length;
        document.getElementById('total-assignments').textContent = assignments.length;
        
        // For messages, we need to get from all rooms
        const rooms = await fetch('/api/chat/rooms').then(r => r.json());
        let totalMessages = 0;
        for (const room of rooms) {
            const messages = await fetch(`/api/chat/messages/${room.id}`).then(r => r.json());
            totalMessages += messages.length;
        }
        document.getElementById('total-messages').textContent = totalMessages;
        
        // Load management lists
        loadGamesList();
        loadAssignmentsList();
        loadUsersList();
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

function setupUploadForms() {
    // User creation form
    document.getElementById('user-create-form').addEventListener('submit', function(e) {
        e.preventDefault();
        createUser();
    });

    // Game upload form
    document.getElementById('game-upload-form').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadGame();
    });

    // School work upload form
    document.getElementById('schoolwork-upload-form').addEventListener('submit', function(e) {
        e.preventDefault();
        uploadSchoolWork();
    });
}

async function uploadGame() {
    const title = document.getElementById('game-title').value;
    const description = document.getElementById('game-description').value;
    const gameUrl = document.getElementById('game-url').value;
    const rating = document.getElementById('game-rating').value;
    const downloads = document.getElementById('game-downloads').value;

    if (!gameUrl) {
        alert('Please enter a game download URL!');
        return;
    }

    try {
        // Extract filename from URL or use title
        const fileName = gameUrl.split('/').pop() || title + '.apk';
        
        const gameData = {
            title: title,
            description: description,
            downloadUrl: gameUrl,
            fileName: fileName,
            rating: rating,
            downloads: downloads,
            category: 'action'
        };

        const response = await fetch('/api/games', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        });

        if (!response.ok) {
            throw new Error('Failed to upload game');
        }

        // Add to upload history
        addToUploadHistory('game', title);
        
        // Reset form
        document.getElementById('game-upload-form').reset();
        
        showNotification('Game uploaded successfully! 🎮');
        
        // Update statistics
        loadStatistics();
    } catch (error) {
        console.error('Error uploading game:', error);
        showNotification('Failed to upload game. Please try again.', 'error');
    }
}

async function uploadSchoolWork() {
    const subject = document.getElementById('subject-select').value;
    const title = document.getElementById('assignment-title').value;
    const description = document.getElementById('assignment-description').value;
    const dueDate = document.getElementById('due-date').value;
    const difficulty = document.getElementById('difficulty-level').value;
    const file = document.getElementById('assignment-file').files[0];

    if (!file) {
        alert('Please select an assignment file!');
        return;
    }

    try {
        // Simulate file upload (in real app, upload to cloud storage)
        const fileName = file.name;
        
        const assignmentData = {
            subject: subject,
            title: title,
            description: description,
            dueDate: dueDate,
            difficulty: difficulty,
            fileName: fileName,
            fileUrl: null // In real app, this would be the uploaded file URL
        };

        const response = await fetch('/api/schoolwork', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });

        if (!response.ok) {
            throw new Error('Failed to upload assignment');
        }

        // Add to upload history
        addToUploadHistory('assignment', title);
        
        // Reset form
        document.getElementById('schoolwork-upload-form').reset();
        
        showNotification('Assignment uploaded successfully! 📚');
        
        // Update statistics
        loadStatistics();
    } catch (error) {
        console.error('Error uploading assignment:', error);
        showNotification('Failed to upload assignment. Please try again.', 'error');
    }
}

function addToUploadHistory(type, title) {
    const historyContainer = document.getElementById('upload-history');
    const icon = type === 'game' ? '🎮' : '📚';
    const typeText = type === 'game' ? 'Game' : 'Assignment';
    
    const uploadItem = document.createElement('div');
    uploadItem.className = 'upload-item';
    uploadItem.innerHTML = `
        <div class="upload-icon">${icon}</div>
        <div class="upload-details">
            <h4>${title}</h4>
            <p>${typeText} uploaded successfully</p>
            <span class="upload-time">Just now</span>
        </div>
    `;
    
    historyContainer.insertBefore(uploadItem, historyContainer.firstChild);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1DB954;
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadGamesList() {
    const games = JSON.parse(localStorage.getItem('uploadedGames')) || [];
    const gamesListContainer = document.getElementById('games-list');
    
    if (!gamesListContainer) return;
    
    gamesListContainer.innerHTML = '<h3>Uploaded Games</h3>';
    
    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.className = 'management-item';
        gameItem.innerHTML = `
            <div class="item-info">
                <h4>${game.title}</h4>
                <p>${game.description}</p>
                <span>Uploaded: ${new Date(game.uploadDate).toLocaleDateString()}</span>
            </div>
            <button class="remove-btn" onclick="removeGame(${game.id})">Remove</button>
        `;
        gamesListContainer.appendChild(gameItem);
    });
}

function loadAssignmentsList() {
    const assignments = JSON.parse(localStorage.getItem('uploadedAssignments')) || [];
    const assignmentsListContainer = document.getElementById('assignments-list');
    
    if (!assignmentsListContainer) return;
    
    assignmentsListContainer.innerHTML = '<h3>Uploaded Assignments</h3>';
    
    assignments.forEach(assignment => {
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'management-item';
        assignmentItem.innerHTML = `
            <div class="item-info">
                <h4>${assignment.title}</h4>
                <p>${assignment.description} (${assignment.subject})</p>
                <span>Due: ${new Date(assignment.dueDate).toLocaleDateString()}</span>
            </div>
            <button class="remove-btn" onclick="removeAssignment(${assignment.id})">Remove</button>
        `;
        assignmentsListContainer.appendChild(assignmentItem);
    });
}

function removeGame(gameId) {
    if (confirm('Are you sure you want to remove this game?')) {
        let games = JSON.parse(localStorage.getItem('uploadedGames')) || [];
        games = games.filter(game => game.id !== gameId);
        localStorage.setItem('uploadedGames', JSON.stringify(games));
        
        loadGamesList();
        loadStatistics();
        showNotification('Game removed successfully! 🗑️');
    }
}

function removeAssignment(assignmentId) {
    if (confirm('Are you sure you want to remove this assignment?')) {
        let assignments = JSON.parse(localStorage.getItem('uploadedAssignments')) || [];
        assignments = assignments.filter(assignment => assignment.id !== assignmentId);
        localStorage.setItem('uploadedAssignments', JSON.stringify(assignments));
        
        loadAssignmentsList();
        loadStatistics();
        showNotification('Assignment removed successfully! 🗑️');
    }
}

async function createUser() {
    const username = document.getElementById('new-username').value;
    const displayName = document.getElementById('new-display-name').value;
    const password = document.getElementById('new-password').value;
    const bio = document.getElementById('new-bio').value;

    if (!username || !displayName || !password) {
        alert('Username, display name, and password are required!');
        return;
    }

    try {
        // First try to create via API
        const userData = {
            username: username,
            displayName: displayName,
            password: password,
            bio: bio || 'Welcome to my gaming profile!'
        };

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            showNotification('User account created successfully! 👤');
        } else {
            throw new Error('API creation failed');
        }
    } catch (error) {
        console.error('API user creation failed, using localStorage:', error);
        
        // Fallback to localStorage
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Check if username already exists
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            alert('Username already exists!');
            return;
        }

        const newUser = {
            id: Date.now(),
            username: username,
            displayName: displayName,
            password: password,
            bio: bio || 'Welcome to my gaming profile!',
            registrationDate: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        showNotification('User account created successfully! 👤');
    }

    // Add to upload history
    addToUploadHistory('user', displayName);
    
    // Reset form
    document.getElementById('user-create-form').reset();
    
    // Update statistics and user list
    loadStatistics();
    loadUsersList();
}

async function loadUsersList() {
    try {
        let users = [];
        
        // Try to load from API first
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                users = await response.json();
            }
        } catch (error) {
            // Fallback to localStorage
            users = JSON.parse(localStorage.getItem('users')) || [];
        }

        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) return;

        usersListContainer.innerHTML = '<h3>Registered Users</h3>';

        if (users.length === 0) {
            usersListContainer.innerHTML += '<p style="color: #666;">No users registered yet.</p>';
            return;
        }

        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'management-item';
            userItem.style.cssText = `
                background: #1A1A1A;
                border: 1px solid #2C2C2C;
                border-radius: 12px;
                padding: 15px;
                margin: 10px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            userItem.innerHTML = `
                <div class="item-info">
                    <h4 style="color: #1DB954; margin: 0 0 5px 0;">${user.display_name || user.displayName}</h4>
                    <p style="color: #EDEDED; margin: 0 0 5px 0;">@${user.username}</p>
                    <span style="color: #999; font-size: 12px;">Joined: ${new Date(user.created_at || user.registrationDate).toLocaleDateString()}</span>
                </div>
                ${user.username.toLowerCase() !== 'raj' ? `<button class="remove-btn" onclick="removeUser('${user.username}', ${user.id})" style="background: #ff4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">Remove</button>` : ''}
            `;
            usersListContainer.appendChild(userItem);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function removeUser(username, userId) {
    if (username.toLowerCase() === 'raj') {
        alert('Cannot remove the owner account!');
        return;
    }

    if (confirm(`Are you sure you want to remove user "${username}"?`)) {
        // Remove from localStorage
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users = users.filter(user => user.username !== username);
        localStorage.setItem('users', JSON.stringify(users));
        
        // TODO: Also remove from database via API when available
        
        loadUsersList();
        loadStatistics();
        showNotification('User removed successfully! 🗑️');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}
