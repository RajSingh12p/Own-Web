// User data storage (in real app, this would be a database)
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// IP tracking for one registration per IP
let registeredIPs = JSON.parse(localStorage.getItem('registeredIPs')) || [];

// API configuration
const API_BASE_URL = window.location.origin;

// API helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Database functions
async function checkDatabaseHealth() {
    try {
        const health = await apiCall('/health');
        console.log('Database status:', health);
        return health.database.connected;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

async function loadUsersFromDB() {
    try {
        const users = await apiCall('/users');
        return users;
    } catch (error) {
        console.error('Failed to load users from database:', error);
        return [];
    }
}

async function saveUserToDB(userData) {
    try {
        const user = await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return user;
    } catch (error) {
        console.error('Failed to save user to database:', error);
        throw error;
    }
}

async function loadGamesFromDB() {
    try {
        const games = await apiCall('/games');
        return games;
    } catch (error) {
        console.error('Failed to load games from database:', error);
        return [];
    }
}

async function saveGameToDB(gameData) {
    try {
        const game = await apiCall('/games', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
        return game;
    } catch (error) {
        console.error('Failed to save game to database:', error);
        throw error;
    }
}

async function loadAssignmentsFromDB() {
    try {
        const assignments = await apiCall('/schoolwork');
        return assignments;
    } catch (error) {
        console.error('Failed to load assignments from database:', error);
        return [];
    }
}

async function saveAssignmentToDB(assignmentData) {
    try {
        const assignment = await apiCall('/schoolwork', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
        return assignment;
    } catch (error) {
        console.error('Failed to save assignment to database:', error);
        throw error;
    }
}

// Authentication functions
async function loginUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainSite();
        } else {
            alert('Login failed: ' + response.error);
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials.');
    }
}

function showMainSite() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-site').style.display = 'block';
    showSection('welcome-section');
    updateProfileInfo();
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Load section-specific data
    switch(sectionId) {
        case 'games-section':
            loadGames();
            break;
        case 'schoolwork-section':
            loadSchoolWork();
            break;
    }
}

function updateProfileInfo() {
    if (currentUser) {
        document.getElementById('profile-name').textContent = currentUser.displayName || currentUser.username;
        document.getElementById('profile-username').textContent = '@' + currentUser.username;
    }
}

async function loadGames() {
    try {
        const games = await loadGamesFromDB();
        const gamesList = document.getElementById('games-list');
        
        if (games.length === 0) {
            gamesList.innerHTML = `
                <div class="welcome-message">
                    <p style="color: #666; text-align: center; font-size: 18px;">
                        🎮 No games available yet. Games will appear here when uploaded by the owner.
                    </p>
                </div>
            `;
        } else {
            gamesList.innerHTML = games.map(game => `
                <div class="game-card">
                    <h3>${game.title}</h3>
                    <p>${game.description}</p>
                    <a href="${game.download_url}" download="${game.file_name}" class="download-btn">Download</a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

async function loadSchoolWork() {
    try {
        const assignments = await loadAssignmentsFromDB();
        const schoolworkList = document.getElementById('schoolwork-list');
        
        if (assignments.length === 0) {
            schoolworkList.innerHTML = `
                <div class="welcome-message">
                    <p style="color: #666; text-align: center; font-size: 18px;">
                        📚 No assignments available yet. School work will appear here when uploaded by the owner.
                    </p>
                </div>
            `;
        } else {
            schoolworkList.innerHTML = assignments.map(assignment => `
                <div class="assignment-card">
                    <h3>${assignment.title}</h3>
                    <p><strong>Subject:</strong> ${assignment.subject}</p>
                    <p>${assignment.description}</p>
                    ${assignment.due_date ? `<p><strong>Due:</strong> ${new Date(assignment.due_date).toLocaleDateString()}</p>` : ''}
                    ${assignment.file_url ? `<a href="${assignment.file_url}" download class="download-btn">Download</a>` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load school work:', error);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('main-site').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
}

function toggleMusic() {
    const music = document.getElementById('background-music');
    const button = document.getElementById('music-toggle');
    
    if (music.muted) {
        music.muted = false;
        button.textContent = '🔊';
        button.title = 'Mute Music';
    } else {
        music.muted = true;
        button.textContent = '🔇';
        button.title = 'Unmute Music';
    }
}

function editProfile() {
    document.getElementById('profile-edit').style.display = 'block';
    document.getElementById('edit-name').value = currentUser.displayName || currentUser.username;
    document.getElementById('edit-bio').value = currentUser.bio || '';
}

function cancelEdit() {
    document.getElementById('profile-edit').style.display = 'none';
}

function saveProfile() {
    const newName = document.getElementById('edit-name').value;
    const newBio = document.getElementById('edit-bio').value;
    
    // Update local user data
    currentUser.displayName = newName;
    currentUser.bio = newBio;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateProfileInfo();
    cancelEdit();
    alert('Profile updated successfully!');
}

function initializeApp() {
    // Check if user is already logged in
    if (currentUser) {
        showMainSite();
    }
    
    // Set up navigation
    document.addEventListener('click', function(e) {
        if (e.target.matches('.nav-link')) {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            
            if (href === 'index.html') {
                showSection('welcome-section');
            } else if (href === 'profile.html') {
                showSection('profile-section');
            } else if (href === 'games.html') {
                showSection('games-section');
            } else if (href === 'schoolwork.html') {
                showSection('schoolwork-section');
            } else if (href === 'chat.html') {
                showSection('chat-section');
            }
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    checkDatabaseHealth();
});

// User data storage (fallback for local development)
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
function getUserIP() {
    return 'user_' + Math.random().toString(36).substr(2, 9); // Simulated IP
}

// Authentication Functions
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm').value;

    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (username.length < 3) {
        alert('Username must be at least 3 characters!');
        return;
    }

    // Load existing users
    users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if username already exists
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert('Username already exists!');
        return;
    }

    // Check IP restriction (one account per IP)
    const userIP = getUserIP();
    registeredIPs = JSON.parse(localStorage.getItem('registeredIPs')) || [];
    if (registeredIPs.includes(userIP) && username.toLowerCase() !== 'raj') {
        alert('Only one account per device is allowed!');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        username: username,
        password: password, // In real app, this should be hashed
        displayName: username,
        registrationDate: new Date().toISOString(),
        ip: userIP,
        bio: 'Welcome to my gaming profile!'
    };

    users.push(newUser);
    if (!registeredIPs.includes(userIP)) {
        registeredIPs.push(userIP);
    }

    // Save to localStorage with error handling
    try {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('registeredIPs', JSON.stringify(registeredIPs));
        alert('Registration successful! You can now login.');
        showLogin();
    } catch (error) {
        console.error('Storage error:', error);
        alert('Registration failed. Please try again.');
    }
}

async function loginUser(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainSite();
            showNotification('Welcome back, ' + response.user.displayName + '!', 'success');
        }
    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Invalid username or password!', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthSection();
}

// Site Navigation
function showAuthSection() {
    const authSection = document.getElementById('auth-section');
    const mainSite = document.getElementById('main-site');

    if (authSection) authSection.style.display = 'flex';
    if (mainSite) mainSite.style.display = 'none';
}

function showMainSite() {
    const authSection = document.getElementById('auth-section');
    const mainSite = document.getElementById('main-site');
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');

    if (authSection) authSection.style.display = 'none';
    if (mainSite) mainSite.style.display = 'block';

    // Update profile display
    if (profileName) profileName.textContent = currentUser.displayName;
    if (profileUsername) profileUsername.textContent = '@' + currentUser.username;

    // Show welcome section by default
    showSection('welcome');

    // Add owner panel link if user is owner
    if (currentUser.username.toLowerCase() === 'raj') {
        addOwnerPanelToNav();
    }
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');

    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    // Find and activate the corresponding nav link
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Profile Management
function editProfile() {
    const profileEdit = document.getElementById('profile-edit');
    const editName = document.getElementById('edit-name');
    const editBio = document.getElementById('edit-bio');

    if (profileEdit) profileEdit.style.display = 'block';
    if (editName) editName.value = currentUser.displayName;
    if (editBio) editBio.value = currentUser.bio;
}

function saveProfile() {
    const newName = document.getElementById('edit-name').value;
    const newBio = document.getElementById('edit-bio').value;

    // Update current user
    currentUser.displayName = newName;
    currentUser.bio = newBio;

    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Update display
    document.getElementById('profile-name').textContent = currentUser.displayName;

    cancelEdit();
    alert('Profile updated successfully!');
}

function cancelEdit() {
    const profileEdit = document.getElementById('profile-edit');
    if (profileEdit) profileEdit.style.display = 'none';
}

// Games Download
function downloadGame(filename) {
    // In a real app, this would trigger actual file download
    alert('Downloading ' + filename + '...\nNote: This is a demo. In a real app, the file would download.');

    // Simulate download
    console.log('Download started for:', filename);
}

// School Work Download
function downloadWork(filename) {
    // In a real app, this would trigger actual file download
    alert('Downloading ' + filename + '...\nNote: This is a demo. In a real app, the file would download.');

    // Simulate download
    console.log('Download started for:', filename);
}

// Chat functionality is now handled in chat.js for the dedicated chat page

// Add owner panel link to navigation for owner
function addOwnerPanelToNav() {
    const navMenu = document.querySelector('.nav-menu');
    const logoutLink = navMenu.querySelector('.logout').parentElement;

    // Check if owner panel link already exists
    if (!navMenu.querySelector('.owner-panel-link')) {
        const ownerPanelItem = document.createElement('li');
        ownerPanelItem.innerHTML = `
            <a href="owner.html" class="nav-link owner-panel-link">
                <span class="nav-icon">👑</span>Owner Panel
            </a>
        `;
        navMenu.insertBefore(ownerPanelItem, logoutLink);
    }
}

// Music control functionality
let isMusicPlaying = false;

function toggleMusic() {
    const music = document.getElementById('background-music');
    const musicToggle = document.getElementById('music-toggle');

    if (!music) return;

    if (isMusicPlaying) {
        music.pause();
        music.muted = true;
        musicToggle.textContent = '🔇';
        musicToggle.title = 'Unmute Music';
        isMusicPlaying = false;
    } else {
        music.muted = false;
        music.play().catch(e => {
            console.log('Audio play failed:', e);
            // Create a simple tone using Web Audio API as fallback
            playTone();
        });
        musicToggle.textContent = '🔊';
        musicToggle.title = 'Mute Music';
        isMusicPlaying = true;
    }
}

// Fallback audio using Web Audio API
function playTone() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
    } catch (e) {
        console.log('Web Audio API not supported:', e);
    }
}

// Initialize media files and profile icons
document.addEventListener('DOMContentLoaded', function() {
    initializeMedia();
    initializeProfileIcons();
});

function initializeMedia() {
    // Add home page class to body if we're on index.html
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        document.body.classList.add('home-page');
    }

    const music = document.getElementById('background-music');
    const video = document.getElementById('background-video');
    const musicToggle = document.getElementById('music-toggle');

    if (music) {
        music.volume = 0.3;
        music.muted = true;
        music.loop = true;

        // Preload music
        music.preload = 'auto';
        music.load();
    }

    if (musicToggle) {
        musicToggle.textContent = '🔇';
        musicToggle.title = 'Unmute Music';
    }

    if (video) {
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.preload = 'auto';

        // Force video to load and play
        video.load();

        video.addEventListener('canplay', () => {
            video.play().catch(e => {
                console.log('Video autoplay failed:', e);
                // Try to play again after user interaction
                document.addEventListener('click', () => {
                    video.play().catch(e => console.log('Video play failed:', e));
                }, { once: true });
            });
        });

        // Handle video errors
        video.addEventListener('error', (e) => {
            console.log('Video error:', e);
        });
    }
}

function initializeProfileIcons() {
    // Load user's custom profile icon if exists
    if (currentUser && currentUser.profileIcon) {
        updateProfileIconDisplay(currentUser.profileIcon);
    }
}

// Add some demo game updates
function addGameUpdate(title, description) {
    const updatesList = document.getElementById('updates-list');
    const updateDiv = document.createElement('div');
    updateDiv.className = 'update-item';
    updateDiv.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
        <span class="update-date">Just now</span>
    `;
    updatesList.insertBefore(updateDiv, updatesList.firstChild);
}

// Demo function to add new game (you can call this from console)
function addNewGame(title, description, filename) {
    const gamesList = document.getElementById('games-list');
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-item';
    gameDiv.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
        <button onclick="downloadGame('${filename}')">Download APK</button>
    `;
    gamesList.appendChild(gameDiv);
}

// Demo function to add school work (you can call this from console)
function addSchoolWork(title, description, filename) {
    const workList = document.getElementById('schoolwork-list');
    const workDiv = document.createElement('div');
    workDiv.className = 'work-item';
    workDiv.innerHTML = `
        <h3>${title}</h3>
        <p>${description}</p>
        <button onclick="downloadWork('${filename}')">Download PDF</button>
    `;
    workList.appendChild(workDiv);
}

async function loadGames() {
    const gamesList = document.getElementById('games-list');
    if (!gamesList) return;

    try {
        const games = await loadGamesFromDB();

        if (games.length === 0) {
            gamesList.innerHTML = `
                <div class="welcome-message">
                    <p style="color: #666; text-align: center; font-size: 18px;">
                        🎮 No games available yet. Games will appear here when uploaded by the owner.
                    </p>
                </div>
            `;
            return;
        }

        gamesList.innerHTML = '';

        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-icon">🎮</div>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <div class="game-stats">
                    <span>⭐ ${game.rating}</span>
                    <span>📥 ${game.downloads}</span>
                </div>
                <button onclick="downloadGame('${game.download_url}', '${game.file_name}')" class="download-btn">
                    Download Game
                </button>
            `;
            gamesList.appendChild(gameCard);
        });
    } catch (error) {
        console.error('Failed to load games:', error);
        gamesList.innerHTML = `
            <div class="welcome-message">
                <p style="color: #ff6b6b; text-align: center; font-size: 18px;">
                    ❌ Failed to load games. Please try again later.
                </p>
            </div>
        `;
    }
}

async function loadSchoolWork() {
    const schoolworkList = document.getElementById('schoolwork-list');
    if (!schoolworkList) return;

    try {
        const assignments = await loadAssignmentsFromDB();

        if (assignments.length === 0) {
            schoolworkList.innerHTML = `
                <div class="welcome-message">
                    <p style="color: #666; text-align: center; font-size: 18px;">
                        📚 No assignments available yet. School work will appear here when uploaded by the owner.
                    </p>
                </div>
            `;
            return;
        }

        schoolworkList.innerHTML = '';

        assignments.forEach(assignment => {
            const workCard = document.createElement('div');
            workCard.className = 'work-card';
            workCard.innerHTML = `
                <div class="work-header">
                    <h3>${assignment.title}</h3>
                    <span class="subject-tag ${assignment.subject}">${assignment.subject.toUpperCase()}</span>
                </div>
                <p>${assignment.description}</p>
                <div class="work-meta">
                    <span class="due-date">📅 Due: ${new Date(assignment.due_date).toLocaleDateString()}</span>
                    <span class="difficulty ${assignment.difficulty}">📊 ${assignment.difficulty.toUpperCase()}</span>
                </div>
                <button onclick="downloadWork('${assignment.file_name}')" class="download-btn">
                    Download Assignment
                </button>
            `;
            schoolworkList.appendChild(workCard);
        });
    } catch (error) {
        console.error('Failed to load assignments:', error);
        schoolworkList.innerHTML = `
            <div class="welcome-message">
                <p style="color: #ff6b6b; text-align: center; font-size: 18px;">
                    ❌ Failed to load assignments. Please try again later.
                </p>
            </div>
        `;
    }
}
