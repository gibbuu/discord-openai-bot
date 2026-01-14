import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MemoryDatabase {
  constructor(dbPath = join(__dirname, '../../conversations.db')) {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    // Create conversations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_channel 
      ON conversations(user_id, channel_id, timestamp)
    `);
  }

  /**
   * Add a message to conversation history
   */
  addMessage(userId, channelId, role, content) {
    const stmt = this.db.prepare(`
      INSERT INTO conversations (user_id, channel_id, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const timestamp = Date.now();
    stmt.run(userId, channelId, role, content, timestamp);
  }

  /**
   * Get conversation history for a user in a channel
   */
  getConversationHistory(userId, channelId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT role, content, timestamp
      FROM conversations
      WHERE user_id = ? AND channel_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    
    const messages = stmt.all(userId, channelId, limit);
    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Clear conversation history for a user in a channel
   */
  clearHistory(userId, channelId) {
    const stmt = this.db.prepare(`
      DELETE FROM conversations
      WHERE user_id = ? AND channel_id = ?
    `);
    
    stmt.run(userId, channelId);
  }

  /**
   * Get total message count for statistics
   */
  getMessageCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM conversations');
    return stmt.get().count;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

export default MemoryDatabase;
