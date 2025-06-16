
// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login first!');
        window.location.href = 'index.html';
        return;
    }

    loadProfile();
    updateStats();
});

// Profile management functions
let currentUserProfile = JSON.parse(localStorage.getItem('currentUser')) || {
    displayName: 'Fox King',
    username: 'foxking',
    bio: 'Welcome to my gaming profile! Ready to dominate the battlefield! 🎮',
    profileIcon: '🦊'
};

function loadProfile() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        currentUserProfile = { ...currentUserProfile, ...user };
    }

    document.getElementById('profile-display-name').textContent = currentUserProfile.displayName;
    document.getElementById('profile-username').textContent = '@' + currentUserProfile.username;
    document.getElementById('profile-bio').textContent = currentUserProfile.bio;
    
    // Update profile icon
    if (currentUserProfile.profileIcon) {
        updateProfileIconDisplay(currentUserProfile.profileIcon);
    }
}

function updateStats() {
    // Get accurate game count
    const uploadedGames = JSON.parse(localStorage.getItem('uploadedGames')) || [];
    const totalGames = uploadedGames.length;
    document.getElementById('games-count').textContent = totalGames;

    // Get accurate assignment count
    const uploadedAssignments = JSON.parse(localStorage.getItem('uploadedAssignments')) || [];
    const totalAssignments = uploadedAssignments.length;
    document.getElementById('assignments-count').textContent = totalAssignments;
}

function updateProfileIconDisplay(icon) {
    const avatars = document.querySelectorAll('.profile-avatar, #main-profile-avatar');
    avatars.forEach(avatar => {
        if (icon.startsWith('data:image/')) {
            avatar.innerHTML = `<img src="${icon}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatar.textContent = icon;
        }
    });
}

function openAvatarSelector() {
    document.getElementById('avatar-selector').style.display = 'flex';
}

function closeAvatarSelector() {
    document.getElementById('avatar-selector').style.display = 'none';
}

function selectAvatar(icon) {
    // Update current user profile
    currentUserProfile.profileIcon = icon;
    
    // Update display
    updateProfileIconDisplay(icon);
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUserProfile));
    
    // Update users array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUserProfile.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUserProfile;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Close modal
    closeAvatarSelector();
    
    // Show success message
    showNotification('Avatar updated successfully! 🎨');
}

function handleCustomAvatar(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('custom-avatar-preview');
            preview.src = e.target.result;
            document.getElementById('custom-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function useCustomAvatar() {
    const preview = document.getElementById('custom-avatar-preview');
    if (preview.src) {
        selectAvatar(preview.src);
    }
}

function toggleEditMode() {
    const modal = document.getElementById('edit-modal');
    const displayNameInput = document.getElementById('edit-display-name');
    const bioInput = document.getElementById('edit-bio');

    // Pre-fill form with current values
    displayNameInput.value = currentUserProfile.displayName;
    bioInput.value = currentUserProfile.bio;

    modal.style.display = 'flex';
    displayNameInput.focus();
}

function saveProfile() {
    const displayName = document.getElementById('edit-display-name').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    if (!displayName) {
        alert('Display name is required!');
        return;
    }

    // Update profile
    currentUserProfile.displayName = displayName;
    currentUserProfile.bio = bio;

    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUserProfile));

    // Update users array
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === currentUserProfile.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUserProfile;
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Update display
    loadProfile();

    // Close modal
    cancelEdit();

    // Show success message
    showNotification('Profile updated successfully! ✅');
}

function cancelEdit() {
    document.getElementById('edit-modal').style.display = 'none';
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
        z-index: 2000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    const avatarModal = document.getElementById('avatar-selector');
    const editModal = document.getElementById('edit-modal');
    
    if (event.target === avatarModal) {
        closeAvatarSelector();
    }
    if (event.target === editModal) {
        cancelEdit();
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAvatarSelector();
        cancelEdit();
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
