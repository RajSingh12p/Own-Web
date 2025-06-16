
-- Database schema for Fox King Place
-- Run this to set up your database tables

-- Users table
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

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '💬',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    download_url TEXT NOT NULL,
    file_name VARCHAR(255),
    category VARCHAR(50) DEFAULT 'action',
    icon VARCHAR(10) DEFAULT '🎮',
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    difficulty VARCHAR(20) DEFAULT 'medium',
    file_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default chat rooms
INSERT INTO chat_rooms (name, description, icon) VALUES 
('General', 'General discussion for everyone', '💬'),
('Gaming', 'Talk about your favorite games', '🎮'),
('School', 'Discuss homework and assignments', '📚'),
('Random', 'Random topics and fun conversations', '🎲')
ON CONFLICT DO NOTHING;

-- Insert default owner user (update password as needed)
INSERT INTO users (username, display_name, password_hash, is_owner) VALUES 
('Raj', 'Owner Raj', 'your_hashed_password_here', TRUE)
ON CONFLICT (username) DO NOTHING;
