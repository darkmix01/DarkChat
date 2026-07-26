const socket = io();

// DOM Elements
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const nameInput = document.getElementById('name');
const roomSelect = document.getElementById('room');
const enterBtn = document.getElementById('enter');
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const currentRoomSpan = document.getElementById('current-room');
const usersCountSpan = document.getElementById('users-count');
const typingIndicator = document.getElementById('typing-indicator');
const roomsList = document.getElementById('rooms-list');
const usersList = document.getElementById('users-list');
const alertContainer = document.getElementById('alert-container');

let currentRoom = 'general';
let typingUsers = new Set();
let typingTimeout = null;
let currentUser = null;

// ==================== ALERTAS ====================

class Alert {
  constructor(type, message, duration = 5000) {
    this.type = type; // error, success, warning, info
    this.message = message;
    this.duration = duration;
    this.element = null;
    this.create();
  }

  create() {
    const icons = {
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };

    this.element = document.createElement('div');
    this.element.className = `alert ${this.type}`;
    this.element.innerHTML = `
      <div class="alert-icon">${icons[this.type]}</div>
      <div class="alert-content">${this.message}</div>
      <button class="alert-close" title="Cerrar">×</button>
    `;

    alertContainer.appendChild(this.element);

    this.element.querySelector('.alert-close').addEventListener('click', () => this.remove());

    if (this.duration > 0) {
      setTimeout(() => this.remove(), this.duration);
    }
  }

  remove() {
    if (!this.element) return;
    this.element.classList.add('removing');
    setTimeout(() => {
      this.element?.remove();
      this.element = null;
    }, 300);
  }
}

function showAlert(type, message, duration = 5000) {
  return new Alert(type, message, duration);
}

// ==================== UTILIDADES ====================

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function addMessage(content, className = '') {
  const div = document.createElement('div');
  div.className = 'message ' + className;
  div.innerHTML = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleSidebar(show) {
  if (show) {
    sidebar.classList.add('mobile-visible');
    sidebar.classList.remove('mobile-hidden');
    sidebarOverlay.classList.add('visible');
  } else {
    sidebar.classList.remove('mobile-visible');
    sidebar.classList.add('mobile-hidden');
    sidebarOverlay.classList.remove('visible');
  }
}

// ==================== SALAS Y USUARIOS ====================

function updateRoomsList() {
  fetch('/api/rooms')
    .then(res => res.json())
    .then(rooms => {
      roomsList.innerHTML = rooms
        .map(room => `
          <div class="room-item ${room.id === currentRoom ? 'active' : ''}" data-room="${room.id}" title="${room.description}">
            ${room.id === 'general' ? '📍' : room.id === 'tech' ? '💻' : room.id === 'gaming' ? '🎮' : '☕'} ${escapeHtml(room.name)}
          </div>
        `)
        .join('');

      document.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const room = e.currentTarget.dataset.room;
          switchRoom(room);
          if (window.innerWidth <= 480) {
            toggleSidebar(false);
          }
        });
      });
    })
    .catch(err => {
      console.error('Error al obtener salas:', err);
      showAlert('error', 'Error al cargar salas');
    });
}

function switchRoom(room) {
  currentRoom = room;
  currentRoomSpan.textContent = room;
  messagesDiv.innerHTML = '';
  typingUsers.clear();
  typingIndicator.textContent = '';

  fetch(`/api/messages/${room}`)
    .then(res => res.json())
    .then(messages => {
      if (messages.length === 0) {
        addMessage(
          `<div class="system">No hay mensajes aún. ¡Sé el primero en escribir!</div>`,
          'system'
        );
      } else {
        messages.forEach(msg => {
          const timeStr = new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          addMessage(
            `<div><strong>${escapeHtml(msg.username)}</strong> <span class="meta">${timeStr}</span></div><div>${escapeHtml(msg.text)}</div>`,
            msg.type === 'system' ? 'system' : 'other'
          );
        });
      }
    })
    .catch(err => {
      console.error('Error al cargar mensajes:', err);
      showAlert('error', 'Error al cargar historial');
    });

  updateUsersList(room);
  updateRoomsList();
}

function updateUsersList(room) {
  fetch(`/api/users/${room}`)
    .then(res => res.json())
    .then(users => {
      usersCountSpan.textContent = `👥 ${users.length}`;
      usersList.innerHTML = users
        .map(user => `
          <div class="user-item ${typingUsers.has(user.id) ? 'typing' : ''}" title="${user.name}">
            👤 ${escapeHtml(user.name)}
          </div>
        `)
        .join('');
    })
    .catch(err => {
      console.error('Error al obtener usuarios:', err);
    });
}

// ==================== EVENTOS DE LOGIN ====================

enterBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const room = roomSelect.value;

  if (!name) {
    showAlert('warning', '⚡ Escribe tu nombre para entrar');
    nameInput.focus();
    return;
  }

  if (name.length < 1) {
    showAlert('warning', '⚡ El nombre debe tener al menos 1 carácter');
    return;
  }

  enterBtn.disabled = true;
  enterBtn.textContent = 'Conectando...';
  socket.emit('join', { name, room });
});

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') enterBtn.click();
});

// ==================== EVENTOS DE CHAT ====================

sendBtn.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (!text) {
    msgInput.focus();
    return;
  }
  socket.emit('message', text);
  msgInput.value = '';
  socket.emit('stop-typing');
  msgInput.focus();
});

msgInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

msgInput.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing');
  }, 3000);
});

// ==================== SIDEBAR MOBILE ====================

toggleSidebarBtn.addEventListener('click', () => {
  const isVisible = sidebar.classList.contains('mobile-visible');
  toggleSidebar(!isVisible);
});

sidebarOverlay.addEventListener('click', () => {
  toggleSidebar(false);
});

// Cerrar sidebar al cambiar de orientación
window.addEventListener('orientationchange', () => {
  toggleSidebar(false);
});

// ==================== SOCKET EVENTOS ====================

socket.on('system', (data) => {
  if (data.type === 'welcome') {
    currentUser = data.text.split(', ')[1]; // Obtener nombre del mensaje
    nameInput.value = '';
    enterBtn.disabled = false;
    enterBtn.textContent = 'Entrar';
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    currentRoomSpan.textContent = currentRoom;
    updateRoomsList();
    updateUsersList(currentRoom);
    showAlert('success', `✅ ¡Bienvenido a ${currentRoom}!`, 3000);
  } else {
    addMessage(
      `<div class="system">${escapeHtml(data.text)}</div>`,
      'system'
    );
  }
});

socket.on('message', (m) => {
  const timeStr = new Date(m.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  addMessage(
    `<div><strong>${escapeHtml(m.name)}</strong> <span class="meta">${timeStr}</span></div><div>${escapeHtml(m.text)}</div>`,
    'other'
  );
});

socket.on('error', (data) => {
  showAlert('error', `❌ ${data.message}`);
  if (data.message.includes('conectar') || data.message.includes('ingresar')) {
    enterBtn.disabled = false;
    enterBtn.textContent = 'Entrar';
  }
});

socket.on('history', (messages) => {
  messages.forEach(msg => {
    const timeStr = new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    addMessage(
      `<div><strong>${escapeHtml(msg.username)}</strong> <span class="meta">${timeStr}</span></div><div>${escapeHtml(msg.text)}</div>`,
      msg.type === 'system' ? 'system' : 'other'
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
    const count = Array.from(typingUsers).length;
    typingIndicator.textContent = `✏️ ${count} usuario${count > 1 ? 's' : ''} escribiendo...`;
  } else {
    typingIndicator.textContent = '';
  }
}

socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
  showAlert('info', '🟢 Conectado al servidor', 2000);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
  showAlert('error', '🔴 Desconectado del servidor', 0);
  loginContainer.style.display = 'flex';
  chatContainer.style.display = 'none';
  enterBtn.disabled = false;
  enterBtn.textContent = 'Entrar';
  toggleSidebar(false);
});

socket.on('connect_error', (error) => {
  console.error('Error de conexión:', error);
  showAlert('error', `⚠️ Error: ${error.message}`);
});

// Prevenir submit en mobile
document.addEventListener('touchmove', (e) => {
  if (e.target === msgInput) return; // Permitir scroll en input
}, { passive: true });
