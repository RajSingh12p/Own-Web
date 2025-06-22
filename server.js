
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
            // Use unpooled connection if available, otherwise fall back to pooled
            const connectionString = this.unpooledConnection || this.connectionString;
            
            this.pool = new Pool({
                connectionString: connectionString,
                ssl: {
                    rejectUnauthorized: false
                },
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });
            
            // Test connection
            const client = await this.pool.connect();
            console.log('Database connected successfully');
            
            // Initialize database tables
            await this.initializeTables(client);
            
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

    async initializeTables(client) {
        console.log('Initializing database tables...');
        try {
            // Create tables if they don't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    display_name VARCHAR(100) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    bio TEXT DEFAULT 'Welcome to my gaming profile!',
                    avatar_url TEXT,
                    is_owner BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    icon VARCHAR(10) DEFAULT '💬',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    message TEXT NOT NULL,
                    message_type VARCHAR(20) DEFAULT 'text',
                    file_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS games (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    download_url TEXT NOT NULL,
                    file_name VARCHAR(255),
                    category VARCHAR(50) DEFAULT 'action',
                    icon VARCHAR(10) DEFAULT '🎮',
                    rating VARCHAR(10) DEFAULT '4.5',
                    downloads VARCHAR(20) DEFAULT '0',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS assignments (
                    id SERIAL PRIMARY KEY,
                    subject VARCHAR(100) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    due_date DATE,
                    difficulty VARCHAR(20) DEFAULT 'medium',
                    file_url TEXT,
                    file_name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Insert default chat rooms if they don't exist
            await client.query(`
                INSERT INTO chat_rooms (name, description, icon) 
                SELECT * FROM (VALUES 
                    ('General', 'General discussion for everyone', '💬'),
                    ('Gaming', 'Talk about games and gaming strategies', '🎮'),
                    ('Study Hall', 'Academic discussions and homework help', '📚'),
                    ('Random', 'Off-topic conversations and fun', '🎲')
                ) AS v(name, description, icon)
                WHERE NOT EXISTS (SELECT 1 FROM chat_rooms WHERE name = v.name);
            `);

            // Insert default owner account if it doesn't exist
            await client.query(`
                INSERT INTO users (username, display_name, password_hash, is_owner, bio) 
                SELECT 'Raj', 'Owner Raj', 'RajPro123321', TRUE, 'The owner of Fox King Place - Gaming Hub!'
                WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'Raj');
            `);

            console.log('Database tables initialized successfully');
        } catch (error) {
            console.error('Error initializing tables:', error);
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

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await db.query(
            'SELECT id, username, display_name, bio, avatar_url, is_owner FROM users WHERE username = $1 AND password_hash = $2',
            [username, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        res.json({ 
            success: true, 
            user: {
                id: user.id,
                username: user.username,
                displayName: user.display_name,
                bio: user.bio,
                avatarUrl: user.avatar_url,
                isOwner: user.is_owner
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
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
