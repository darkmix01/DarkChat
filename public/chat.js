const socket = io();

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const sidebar = document.getElementById('sidebar');
const nameInput = document.getElementById('name');
const roomSelect = document.getElementById('room');
const enterBtn = document.getElementById('enter');
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const currentRoomSpan = document.getElementById('current-room');
const usersCountSpan = document.getElementById('users-count');
const typingIndicator = document.getElementById('typing-indicator');
const errorMsg = document.getElementById('error-msg');
const roomsList = document.getElementById('rooms-list');
const usersList = document.getElementById('users-list');

let currentRoom = 'general';
let typingUsers = new Set();
let typingTimeout = null;

// Escapar HTML
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Mostrar error
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  setTimeout(() => {
    errorMsg.style.display = 'none';
  }, 5000);
}

// Agregar mensaje al chat
function addMessage(content, className = '') {
  const div = document.createElement('div');
  div.className = 'message ' + className;
  div.innerHTML = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Actualizar lista de salas
function updateRoomsList() {
  fetch('/api/rooms')
    .then(res => res.json())
    .then(rooms => {
      roomsList.innerHTML = rooms
        .map(room => `
          <div class="room-item ${room.id === currentRoom ? 'active' : ''}" data-room="${room.id}">
            📍 ${escapeHtml(room.name)}
          </div>
        `)
        .join('');

      document.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const room = e.currentTarget.dataset.room;
          switchRoom(room);
        });
      });
    })
    .catch(err => console.error('Error al obtener salas:', err));
}

// Cambiar de sala
function switchRoom(room) {
  currentRoom = room;
  currentRoomSpan.textContent = room;
  messagesDiv.innerHTML = '';
  typingUsers.clear();
  typingIndicator.textContent = '';

  // Cargar mensajes de la sala
  fetch(`/api/messages/${room}`)
    .then(res => res.json())
    .then(messages => {
      messages.forEach(msg => {
        const timeStr = new Date(msg.timestamp).toLocaleTimeString();
        addMessage(
          `<div><strong>${escapeHtml(msg.username)}</strong> <span class="meta">${timeStr}</span></div><div>${escapeHtml(msg.text)}</div>`,
          'other'
        );
      });
    })
    .catch(err => console.error('Error al cargar mensajes:', err));

  updateUsersList(room);
  updateRoomsList();
}

// Actualizar lista de usuarios
function updateUsersList(room) {
  fetch(`/api/users/${room}`)
    .then(res => res.json())
    .then(users => {
      usersCountSpan.textContent = `👥 ${users.length}`;
      usersList.innerHTML = users
        .map(user => `
          <div class="user-item ${typingUsers.has(user.id) ? 'typing' : ''}">
            👤 ${escapeHtml(user.name)}
          </div>
        `)
        .join('');
    })
    .catch(err => console.error('Error al obtener usuarios:', err));
}

// Entrar al chat
enterBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const room = roomSelect.value;

  if (!name) {
    showError('Escribe tu nombre');
    return;
  }

  socket.emit('join', { name, room });
});

// Enviar mensaje
sendBtn.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('message', text);
  msgInput.value = '';
  socket.emit('stop-typing');
});

// Tecla Enter
msgInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// Indicador de escritura
msgInput.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing');
  }, 3000);
});

// Socket eventos
socket.on('system', (data) => {
  addMessage(
    `<div class="system">${escapeHtml(data.text)}</div>`,
    'system'
  );
});

socket.on('message', (m) => {
  const timeStr = new Date(m.time).toLocaleTimeString();
  addMessage(
    `<div><strong>${escapeHtml(m.name)}</strong> <span class="meta">${timeStr}</span></div><div>${escapeHtml(m.text)}</div>`,
    'other'
  );
});

socket.on('error', (data) => {
  showError(data.message);
});

socket.on('history', (messages) => {
  messages.forEach(msg => {
    const timeStr = new Date(msg.timestamp).toLocaleTimeString();
    addMessage(
      `<div><strong>${escapeHtml(msg.username)}</strong> <span class="meta">${timeStr}</span></div><div>${escapeHtml(msg.text)}</div>`,
      'other'
    );
  });
});

socket.on('user-list', (users) => {
  usersCountSpan.textContent = `👥 ${users.length}`;
  usersList.innerHTML = users
    .map(user => `
      <div class="user-item ${typingUsers.has(user.id) ? 'typing' : ''}">
        👤 ${escapeHtml(user.name)}
      </div>
    `)
    .join('');
});

socket.on('user-typing', (data) => {
  typingUsers.add(data.id);
  updateTypingIndicator();
});

socket.on('user-stop-typing', (data) => {
  typingUsers.delete(data.id);
  updateTypingIndicator();
});

function updateTypingIndicator() {
  if (typingUsers.size > 0) {
    typingIndicator.textContent = `${Array.from(typingUsers).length} usuario(s) escribiendo...`;
  } else {
    typingIndicator.textContent = '';
  }
}

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
  loginDiv.style.display = 'flex';
  chatDiv.style.display = 'none';
  sidebar.style.display = 'none';
});

// Evento cuando se une exitosamente
socket.on('system', (data) => {
  if (data.type === 'welcome') {
    nameInput.value = '';
    loginDiv.style.display = 'none';
    chatDiv.style.display = 'flex';
    sidebar.style.display = 'flex';
    currentRoomSpan.textContent = currentRoom;
    updateRoomsList();
    updateUsersList(currentRoom);
    addMessage(
      `<div class="system">${escapeHtml(data.text)}</div>`,
      'system'
    );
  }
});
