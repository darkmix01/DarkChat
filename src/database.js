const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/chat.db');
    this.dbDir = path.dirname(dbPath);
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error al conectar con la BD:', err);
      } else {
        console.log('✅ Conectado a la base de datos SQLite');
      }
    });
  }

  init() {
    // Crear directorio si no existe
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    // Crear tablas
    this.db.serialize(() => {
      // Tabla de salas
      this.db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabla de mensajes
      this.db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          roomId TEXT NOT NULL,
          username TEXT NOT NULL,
          text TEXT NOT NULL,
          type TEXT DEFAULT 'message',
          userId TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(roomId) REFERENCES rooms(id)
        )
      `);

      // Crear índices para mejor rendimiento
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(roomId)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`);

      // Insertar sala por defecto
      this.db.run(
        `INSERT OR IGNORE INTO rooms (id, name, description) VALUES (?, ?, ?)`,
        ['general', 'General', 'Sala general de chat'],
        (err) => {
          if (err) console.error('Error al crear sala general:', err);
          else console.log('✅ Sala general lista');
        }
      );
    });
  }

  saveMessage(msg) {
    return new Promise((resolve, reject) => {
      const room = msg.room || 'general';
      this.db.run(
        `INSERT INTO messages (id, roomId, username, text, type, userId, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          msg.id || `${Date.now()}-${Math.random()}`,
          room,
          msg.name || msg.username,
          msg.text,
          msg.type || 'message',
          msg.userId || null,
          msg.timestamp || new Date().toISOString()
        ],
        function (err) {
          if (err) {
            console.error('Error al guardar mensaje:', err);
            reject(err);
          } else {
            resolve({ id: this.lastID });
          }
        }
      );
    });
  }

  getMessages(room, limit = 50) {
    return new Promise((resolve) => {
      this.db.all(
        `SELECT * FROM messages WHERE roomId = ? ORDER BY timestamp DESC LIMIT ?`,
        [room, limit],
        (err, rows) => {
          if (err) {
            console.error('Error al obtener mensajes:', err);
            resolve([]);
          } else {
            resolve((rows || []).reverse());
          }
        }
      );
    });
  }

  getAllRooms() {
    return new Promise((resolve) => {
      this.db.all(`SELECT * FROM rooms ORDER BY createdAt ASC`, (err, rows) => {
        if (err) {
          console.error('Error al obtener salas:', err);
          resolve([]);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  createRoom(id, name, description) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO rooms (id, name, description) VALUES (?, ?, ?)`,
        [id, name, description],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;
