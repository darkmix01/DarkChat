require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const xss = require('xss');
const Database = require('./src/database');
const { validateUsername, validateMessage, sanitizeInput } = require('./src/validation');
const { createRateLimiter } = require('./src/rateLimit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const db = new Database();
const rateLimiters = new Map(); // Map de limitadores por usuario

// Inicializar base de datos
db.init();

app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.get('/api/rooms', (req, res) => {
  res.json(db.getAllRooms());
});

app.get('/api/messages/:roomId', (req, res) => {
  const { roomId } = req.params;
  const limit = req.query.limit || 50;
  const messages = db.getMessages(roomId, parseInt(limit));
  res.json(messages);
});

app.get('/api/users/:roomId', (req, res) => {
  const { roomId } = req.params;
  const users = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    return {
      id: socketId,
      name: socket?.data?.name || 'Anónimo',
      joinedAt: socket?.data?.joinedAt
    };
  });
  res.json(users);
});

// Socket.IO eventos
io.on('connection', (socket) => {
  console.log('Nueva conexión:', socket.id);

  socket.on('join', (data) => {
    try {
      const { name, room = 'general' } = data;

      // Validar nombre de usuario
      if (!validateUsername(name)) {
        socket.emit('error', { message: 'Nombre inválido. Debe tener 1-30 caracteres alfanuméricos.' });
        return;
      }

      // Validar que el nombre sea único en la sala
      const usersInRoom = Array.from(io.sockets.adapter.rooms.get(room) || []).map(id => {
        const s = io.sockets.sockets.get(id);
        return s?.data?.name;
      });

      if (usersInRoom.includes(name)) {
        socket.emit('error', { message: 'Ese nombre ya está en uso en esta sala.' });
        return;
      }

      socket.data.name = sanitizeInput(name);
      socket.data.room = room;
      socket.data.joinedAt = new Date();

      // Inicializar rate limiter para este usuario
      rateLimiters.set(socket.id, createRateLimiter());

      socket.join(room);

      // Enviar mensaje de bienvenida
      socket.emit('system', {
        text: `Bienvenido a ${room}, ${socket.data.name}`,
        type: 'welcome'
      });

      // Notificar otros usuarios
      socket.to(room).emit('system', {
        text: `${socket.data.name} se ha unido a la sala.`,
        type: 'user-joined',
        user: socket.data.name
      });

      // Cargar últimos mensajes del historico
      const recentMessages = db.getMessages(room, 50);
      socket.emit('history', recentMessages);

      // Actualizar lista de usuarios
      broadcastUserList(room);

      // Guardar evento de conexión
      db.saveMessage({
        room,
        name: 'SISTEMA',
        text: `${socket.data.name} se unió`,
        type: 'system',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error en join:', error);
      socket.emit('error', { message: 'Error al conectar a la sala.' });
    }
  });

  socket.on('message', (text) => {
    try {
      const room = socket.data.room || 'general';

      // Validar que el usuario está autenticado
      if (!socket.data.name) {
        socket.emit('error', { message: 'Debes ingresar primero.' });
        return;
      }

      // Validar mensaje
      if (!validateMessage(text)) {
        socket.emit('error', { message: 'Mensaje inválido. Máximo 500 caracteres.' });
        return;
      }

      // Aplicar rate limiting
      const limiter = rateLimiters.get(socket.id);
      if (!limiter.tryConsume()) {
        socket.emit('error', { message: 'Estás enviando mensajes muy rápido. Espera un momento.' });
        return;
      }

      // Sanitizar mensaje
      const cleanText = xss(text, { whiteList: {} });

      const msg = {
        id: `${Date.now()}-${Math.random()}`,
        room,
        name: socket.data.name,
        text: cleanText,
        time: new Date().toISOString(),
        type: 'message',
        userId: socket.id
      };

      // Guardar en base de datos
      db.saveMessage(msg);

      // Emitir a todos en la sala
      io.to(room).emit('message', msg);
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      socket.emit('error', { message: 'Error al enviar el mensaje.' });
    }
  });

  socket.on('typing', () => {
    const room = socket.data.room || 'general';
    socket.to(room).emit('user-typing', {
      user: socket.data.name || 'Anónimo',
      id: socket.id
    });
  });

  socket.on('stop-typing', () => {
    const room = socket.data.room || 'general';
    socket.to(room).emit('user-stop-typing', {
      id: socket.id
    });
  });

  socket.on('disconnect', () => {
    try {
      const room = socket.data.room || 'general';
      const name = socket.data.name;

      if (name) {
        io.to(room).emit('system', {
          text: `${name} ha abandonado la sala.`,
          type: 'user-left',
          user: name
        });

        // Guardar evento de desconexión
        db.saveMessage({
          room,
          name: 'SISTEMA',
          text: `${name} se desconectó`,
          type: 'system',
          timestamp: new Date()
        });

        broadcastUserList(room);
      }

      rateLimiters.delete(socket.id);
      console.log('Conexión cerrada:', socket.id);
    } catch (error) {
      console.error('Error en disconnect:', error);
    }
  });
});

// Función auxiliar para actualizar lista de usuarios
function broadcastUserList(room) {
  const users = Array.from(io.sockets.adapter.rooms.get(room) || []).map(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    return {
      id: socketId,
      name: socket?.data?.name || 'Anónimo',
      joinedAt: socket?.data?.joinedAt
    };
  });
  io.to(room).emit('user-list', users);
}

server.listen(PORT, () => {
  console.log(`🚀 DarkChat escuchando en http://localhost:${PORT}`);
  console.log(`📝 Base de datos inicializada en: ${process.env.DB_PATH || './data/chat.db'}`);
});

module.exports = { server, io };
