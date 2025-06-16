
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

function loadStatistics() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const messages = JSON.parse(localStorage.getItem('foxKingChat_messages')) || [];
    const games = JSON.parse(localStorage.getItem('uploadedGames')) || [];
    const assignments = JSON.parse(localStorage.getItem('uploadedAssignments')) || [];
    
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('total-games').textContent = games.length;
    document.getElementById('total-assignments').textContent = assignments.length;
    document.getElementById('total-messages').textContent = messages.length;
    
    // Load management lists
    loadGamesList();
    loadAssignmentsList();
}

function setupUploadForms() {
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

function uploadGame() {
    const title = document.getElementById('game-title').value;
    const description = document.getElementById('game-description').value;
    const gameUrl = document.getElementById('game-url').value;
    const rating = document.getElementById('game-rating').value;
    const downloads = document.getElementById('game-downloads').value;

    if (!gameUrl) {
        alert('Please enter a game download URL!');
        return;
    }

    // Extract filename from URL or use title
    const fileName = gameUrl.split('/').pop() || title + '.apk';
    
    // Get existing games from localStorage
    let games = JSON.parse(localStorage.getItem('uploadedGames')) || [];
    
    const newGame = {
        id: Date.now(),
        title: title,
        description: description,
        fileName: fileName,
        downloadUrl: gameUrl,
        rating: rating,
        downloads: downloads,
        uploadDate: new Date().toISOString()
    };
    
    games.push(newGame);
    localStorage.setItem('uploadedGames', JSON.stringify(games));
    
    // Add to upload history
    addToUploadHistory('game', title);
    
    // Reset form
    document.getElementById('game-upload-form').reset();
    
    showNotification('Game uploaded successfully! 🎮');
    
    // Update statistics
    const currentCount = parseInt(document.getElementById('total-games').textContent);
    document.getElementById('total-games').textContent = currentCount + 1;
}

function uploadSchoolWork() {
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

    // Simulate file upload
    const fileName = file.name;
    
    // Get existing assignments from localStorage
    let assignments = JSON.parse(localStorage.getItem('uploadedAssignments')) || [];
    
    const newAssignment = {
        id: Date.now(),
        subject: subject,
        title: title,
        description: description,
        dueDate: dueDate,
        difficulty: difficulty,
        fileName: fileName,
        uploadDate: new Date().toISOString()
    };
    
    assignments.push(newAssignment);
    localStorage.setItem('uploadedAssignments', JSON.stringify(assignments));
    
    // Add to upload history
    addToUploadHistory('assignment', title);
    
    // Reset form
    document.getElementById('schoolwork-upload-form').reset();
    
    showNotification('Assignment uploaded successfully! 📚');
    
    // Update statistics
    const currentCount = parseInt(document.getElementById('total-assignments').textContent);
    document.getElementById('total-assignments').textContent = currentCount + 1;
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

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}
