const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Map of socket.id -> name
const users = new Map();

function currentUsers() {
  // return array of unique names (could have duplicates)
  return Array.from(users.values()).map((name) => ({ name }));
}

io.on('connection', (socket) => {
  console.log('Nueva conexión:', socket.id);

  socket.on('join', (name) => {
    if (!name) return;
    socket.data.name = name;
    users.set(socket.id, name);
    socket.emit('system', { text: `Bienvenido, ${name}` });
    socket.broadcast.emit('system', { text: `${name} se ha unido al chat.` });
    io.emit('users', currentUsers());
  });

  socket.on('message', (text) => {
    const name = socket.data.name || 'Anónimo';
    const msg = {
      name,
      text,
      time: new Date().toISOString(),
    };
    io.emit('message', msg);
  });

  socket.on('typing', (isTyping) => {
    const name = socket.data.name || 'Anónimo';
    socket.broadcast.emit('typing', { name, typing: !!isTyping });
  });

  socket.on('disconnect', () => {
    const name = users.get(socket.id);
    if (name) {
      users.delete(socket.id);
      socket.broadcast.emit('system', { text: `${name} ha abandonado el chat.` });
      io.emit('users', currentUsers());
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
