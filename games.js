
// Auto-update gaming news
async function fetchGamingNews() {
    const newsContainer = document.getElementById('news-container');
    
    // Simulated gaming news (in real app, fetch from gaming news API)
    const gamingNews = [
        {
            title: "Revolutionary AI Game Engine Announced",
            description: "New AI-powered game engine promises to revolutionize game development with procedural generation...",
            date: "Today"
        },
        {
            title: "Mobile Gaming Revenue Surpasses Console",
            description: "Industry report shows mobile gaming has officially overtaken console gaming in total revenue...",
            date: "Yesterday"
        },
        {
            title: "Virtual Reality Gaming Gets Major Update",
            description: "Latest VR headsets now support 8K resolution and haptic feedback for ultimate immersion...",
            date: "2 days ago"
        },
        {
            title: "Esports Tournament Prize Pool Breaks Records",
            description: "The upcoming world championship features the largest prize pool in esports history...",
            date: "3 days ago"
        }
    ];

    newsContainer.innerHTML = '';
    
    gamingNews.forEach((news, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        newsItem.style.animationDelay = `${index * 0.1}s`;
        newsItem.innerHTML = `
            <div class="news-date">${news.date}</div>
            <h3>${news.title}</h3>
            <p>${news.description}</p>
        `;
        newsContainer.appendChild(newsItem);
    });
}

// Game download function
function downloadGame(gameId) {
    const button = event.target;
    const originalText = button.innerHTML;
    
    // Get game data from localStorage
    const games = JSON.parse(localStorage.getItem('uploadedGames')) || [];
    const game = games.find(g => g.id == gameId);
    
    if (!game || !game.downloadUrl) {
        alert('Download link not found!');
        return;
    }
    
    button.innerHTML = '<span class="download-icon">⏳</span>Downloading...';
    button.disabled = true;
    
    // Open external download link
    const a = document.createElement('a');
    a.href = game.downloadUrl;
    a.download = game.fileName;
    a.target = '_blank';
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
        button.innerHTML = '<span class="download-icon">✅</span>Download Started!';
        showDownloadNotification(game.fileName);
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }, 1000);
    
    console.log('Download started for:', game.fileName);
}

function showDownloadNotification(filename) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        font-weight: 600;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🎮</span>
            <div>
                <div style="font-weight: 600;">Download Complete!</div>
                <div style="font-size: 12px; opacity: 0.9;">${filename}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Auto-refresh news every 30 seconds
setInterval(fetchGamingNews, 30000);

// Load uploaded games from owner panel
function loadUploadedGames() {
    const uploadedGames = JSON.parse(localStorage.getItem('uploadedGames')) || [];
    const gamesGrid = document.getElementById('games-grid');
    
    uploadedGames.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <div class="game-image">🎮</div>
            <div class="game-info">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <div class="game-stats">
                    <span class="rating">⭐ ${game.rating}</span>
                    <span class="downloads">📥 ${game.downloads}</span>
                </div>
                <button class="download-btn" onclick="downloadGame(${game.id})">
                    Download APK
                </button>
            </div>
        `;
        gamesGrid.appendChild(gameCard);
    });
}

// Load news on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchGamingNews();
    loadUploadedGames();
});
