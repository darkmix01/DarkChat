const socket = io();

const loginForm = document.getElementById('loginForm');
const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const nameInput = document.getElementById('name');
const messagesDiv = document.getElementById('messages');
const composer = document.getElementById('composer');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const title = document.getElementById('title');

function addMessageNode(name, text, opts = {}) {
  const { role = 'article', cls = '' } = opts;
  const container = document.createElement('div');
  container.className = 'message ' + cls;
  container.setAttribute('role', role);

  // header
  const header = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = name || '';
  const meta = document.createElement('span');
  meta.className = 'meta';
  meta.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  header.appendChild(strong);
  header.appendChild(document.createTextNode(' '));
  header.appendChild(meta);

  // body
  const body = document.createElement('div');
  body.textContent = text;

  container.appendChild(header);
  container.appendChild(body);
  messagesDiv.appendChild(container);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  return container;
}

// login submit
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return alert('Escribe tu nombre');
  socket.emit('join', name);
  title.textContent = `DarkChat — ${name}`;
  loginDiv.style.display = 'none';
  chatDiv.style.display = 'flex';
  chatDiv.removeAttribute('aria-hidden');
  msgInput.focus();
});

// composer submit (Enter envia; Shift+Enter nueva línea)
composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  sendBtn.disabled = true;
  // Emit message and re-enable via callback if server supports it
  socket.emit('message', text, () => {
    sendBtn.disabled = false;
  });
  addMessageNode('Tú', text, { cls: 'mine' });
  msgInput.value = '';
  msgInput.focus();
});

// Allow Shift+Enter for newline
msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
  // Emit typing events debounced
  if (e.key.length === 1 || e.key === 'Backspace') {
    socket.emit('typing', { typing: true });
    clearTimeout(msgInput._typingTimeout);
    msgInput._typingTimeout = setTimeout(() => socket.emit('typing', { typing: false }), 1200);
  }
});

// receive system / messages
socket.on('system', (data) => {
  addMessageNode('', data.text, { cls: 'system', role: 'status' });
});

socket.on('message', (m) => {
  addMessageNode(m.name, m.text, { cls: 'other' });
});

// typing indicator from server
let typingIndicator = null;
socket.on('typing', (data) => {
  if (data.typing) {
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.className = 'message other typing';
      typingIndicator.textContent = `${data.name || 'Alguien'} está escribiendo...`;
      messagesDiv.appendChild(typingIndicator);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  } else {
    if (typingIndicator) {
      typingIndicator.remove();
      typingIndicator = null;
    }
  }
});
