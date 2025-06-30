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

// Authentication functions
async function loginUser(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Check for owner credentials first
    if (username.toLowerCase() === 'raj' && password === 'RajPro123321') {
        currentUser = {
            id: 1,
            username: 'Raj',
            displayName: 'Owner Raj',
            bio: 'The owner of Fox King Place - Gaming Hub!',
            isOwner: true
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainSite();
        return;
    }

    try {
        // Try API login first
        const response = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success) {
            currentUser = response.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainSite();
        } else {
            alert('Login failed: Invalid username or password');
        }
    } catch (error) {
        console.error('API login failed, trying local storage:', error);

        // Fallback to local storage
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        const user = localUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

        if (user) {
            currentUser = {
                id: user.id,
                username: user.username,
                displayName: user.displayName || user.username,
                bio: user.bio || 'Welcome to my gaming profile!',
                isOwner: false
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainSite();
        } else {
            alert('Login failed. Please check your credentials.');
        }
    }
}

function showMainSite() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-site').style.display = 'block';
    showSection('welcome-section');
    updateProfileInfo();

    // Add owner panel link if user is owner
    if (currentUser && currentUser.isOwner) {
        addOwnerPanelToNav();
    }
}

function showAuthSection() {
    document.getElementById('auth-section').style.display = 'flex';
    document.getElementById('main-site').style.display = 'none';
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

    // Set active nav link
    const sectionToNavMap = {
        'welcome-section': 'index.html',
        'profile-section': 'profile.html',
        'games-section': 'games.html',
        'schoolwork-section': 'schoolwork.html',
        'chat-section': 'chat.html'
    };

    const targetHref = sectionToNavMap[sectionId];
    if (targetHref) {
        const activeNavLink = document.querySelector(`[href="${targetHref}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
    }

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
        const profileName = document.getElementById('profile-name');
        const profileUsername = document.getElementById('profile-username');

        if (profileName) profileName.textContent = currentUser.displayName || currentUser.username;
        if (profileUsername) profileUsername.textContent = '@' + currentUser.username;
    }
}

function addOwnerPanelToNav() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && !document.querySelector('.owner-panel-link')) {
        const ownerLi = document.createElement('li');
        ownerLi.innerHTML = `
            <a href="owner.html" class="nav-link owner-panel-link">
                <span class="nav-icon">👑</span>Owner Panel
            </a>
        `;
        // Insert before logout link
        const logoutLink = navMenu.querySelector('.logout').parentElement;
        navMenu.insertBefore(ownerLi, logoutLink);
    }
}

// Database functions
async function loadGamesFromDB() {
    try {
        const games = await apiCall('/games');
        return games;
    } catch (error) {
        console.error('Failed to load games from database:', error);
        return [];
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

        gamesList.innerHTML = games.map(game => `
            <div class="game-card">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <a href="${game.download_url}" download="${game.file_name}" class="download-btn">Download</a>
            </div>
        `).join('');
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

        schoolworkList.innerHTML = assignments.map(assignment => `
            <div class="assignment-card">
                <h3>${assignment.title}</h3>
                <p><strong>Subject:</strong> ${assignment.subject}</p>
                <p>${assignment.description}</p>
                ${assignment.due_date ? `<p><strong>Due:</strong> ${new Date(assignment.due_date).toLocaleDateString()}</p>` : ''}
                ${assignment.file_url ? `<a href="${assignment.file_url}" download class="download-btn">Download</a>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load school work:', error);
        schoolworkList.innerHTML = `
            <div class="welcome-message">
                <p style="color: #ff6b6b; text-align: center; font-size: 18px;">
                    ❌ Failed to load assignments. Please try again later.
                </p>
            </div>
        `;
    }
}

// Profile management
function editProfile() {
    const profileEdit = document.getElementById('profile-edit');
    const editName = document.getElementById('edit-name');
    const editBio = document.getElementById('edit-bio');

    if (profileEdit) profileEdit.style.display = 'block';
    if (editName) editName.value = currentUser.displayName || currentUser.username;
    if (editBio) editBio.value = currentUser.bio || '';
}

function saveProfile() {
    const newName = document.getElementById('edit-name').value;
    const newBio = document.getElementById('edit-bio').value;

    currentUser.displayName = newName;
    currentUser.bio = newBio;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    updateProfileInfo();
    cancelEdit();
    alert('Profile updated successfully!');
}

function cancelEdit() {
    const profileEdit = document.getElementById('profile-edit');
    if (profileEdit) profileEdit.style.display = 'none';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthSection();
}

// Music control
function toggleMusic() {
    const music = document.getElementById('background-music');
    const button = document.getElementById('music-toggle');

    if (!music || !button) return;

    if (music.muted) {
        music.muted = false;
        music.play().catch(e => console.log('Audio play failed:', e));
        button.textContent = '🔊';
        button.title = 'Mute Music';
    } else {
        music.muted = true;
        button.textContent = '🔇';
        button.title = 'Unmute Music';
    }
}

// Navigation setup
function setupNavigation() {
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
            } else if (href === 'owner.html') {
                window.location.href = 'owner.html';
            }
        }
    });
}

// Initialize the app
function initializeApp() {
    // Check if user is already logged in
    if (currentUser) {
        showMainSite();
    } else {
        showAuthSection();
    }

    setupNavigation();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// User data storage (fallback for local development) - Removed redundant declaration

function getUserIP() {
    return 'user_' + Math.random().toString(36).substr(2, 9); // Simulated IP
}

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

// API helper function - removed redundant definition

function checkDatabaseHealth() {
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            console.log('Server health:', data);
        })
        .catch(error => {
            console.error('Health check failed:', error);
        });
}

// Initialize the app - removed redundant definition

// Add owner panel link to navigation for owner - removed redundant definition

// Music control functionality
let isMusicPlaying = false;

// Fallback audio using Web Audio API - removed redundant definition

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

// Music control - re-inserting the function from original
function toggleMusic() {
    const music = document.getElementById('background-music');
    const button = document.getElementById('music-toggle');

    if (!music || !button) return;

    if (music.muted) {
        music.muted = false;
        music.play().catch(e => console.log('Audio play failed:', e));
        button.textContent = '🔊';
        button.title = 'Mute Music';
    } else {
        music.muted = true;
        button.textContent = '🔇';
        button.title = 'Unmute Music';
    }
}
