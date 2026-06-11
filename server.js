const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Nueva conexión:', socket.id);

  socket.on('join', (name) => {
    if (!name) return;
    socket.data.name = name;
    socket.emit('system', { text: `Bienvenido, ${name}` });
    socket.broadcast.emit('system', { text: `${name} se ha unido al chat.` });
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

  socket.on('disconnect', () => {
    const name = socket.data.name;
    if (name) {
      socket.broadcast.emit('system', { text: `${name} ha abandonado el chat.` });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
