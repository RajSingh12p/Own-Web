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

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    checkDatabaseHealth();
});

// Get user's IP (simplified - in real app use proper IP detection)
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

function loginUser(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Find user
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainSite();
    } else {
        alert('Invalid username or password!');
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