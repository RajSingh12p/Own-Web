
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database configuration
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const DATABASE_URL_UNPOOLED = process.env.NETLIFY_DATABASE_URL_UNPOOLED;

const { Pool } = require('pg');

// Database connection class
class Database {
    constructor() {
        this.connectionString = DATABASE_URL;
        this.unpooledConnection = DATABASE_URL_UNPOOLED;
        this.pool = null;
    }

    async connect() {
        console.log('Connecting to database...');
        try {
            this.pool = new Pool({
                connectionString: this.connectionString,
                ssl: {
                    rejectUnauthorized: false
                }
            });
            
            // Test connection
            const client = await this.pool.connect();
            console.log('Database connected successfully');
            client.release();
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async query(sql, params = []) {
        console.log('Executing query:', sql, params);
        try {
            const result = await this.pool.query(sql, params);
            return result;
        } catch (error) {
            console.error('Query failed:', error);
            throw error;
        }
    }

    async close() {
        console.log('Closing database connection...');
        if (this.pool) {
            await this.pool.end();
        }
    }
}

const db = new Database();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: {
            connected: !!DATABASE_URL,
            hasUnpooled: !!DATABASE_URL_UNPOOLED
        }
    });
});

// User management endpoints
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, display_name, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, displayName, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await db.query(
            'INSERT INTO users (username, display_name, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name',
            [username, displayName || username, password, new Date().toISOString()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Chat endpoints
app.get('/api/chat/rooms', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM chat_rooms ORDER BY created_at');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ error: 'Failed to fetch chat rooms' });
    }
});

app.get('/api/chat/messages/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const result = await db.query(
            'SELECT m.*, u.username, u.display_name FROM messages m JOIN users u ON m.user_id = u.id WHERE m.room_id = $1 ORDER BY m.created_at',
            [roomId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/chat/messages', async (req, res) => {
    try {
        const { roomId, userId, message } = req.body;
        
        if (!roomId || !userId || !message) {
            return res.status(400).json({ error: 'Room ID, user ID, and message are required' });
        }

        const result = await db.query(
            'INSERT INTO messages (room_id, user_id, message, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [roomId, userId, message, new Date().toISOString()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Games endpoints
app.get('/api/games', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM games ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

app.post('/api/games', async (req, res) => {
    try {
        const { title, description, downloadUrl, fileName, category } = req.body;
        
        const result = await db.query(
            'INSERT INTO games (title, description, download_url, file_name, category, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description, downloadUrl, fileName, category, new Date().toISOString()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding game:', error);
        res.status(500).json({ error: 'Failed to add game' });
    }
});

// School work endpoints
app.get('/api/schoolwork', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM assignments ORDER BY due_date, created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

app.post('/api/schoolwork', async (req, res) => {
    try {
        const { subject, title, description, dueDate, difficulty, fileUrl } = req.body;
        
        const result = await db.query(
            'INSERT INTO assignments (subject, title, description, due_date, difficulty, file_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [subject, title, description, dueDate, difficulty, fileUrl, new Date().toISOString()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding assignment:', error);
        res.status(500).json({ error: 'Failed to add assignment' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // Initialize database connection
    try {
        await db.connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Failed to connect to database:', error);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

module.exports = app;
