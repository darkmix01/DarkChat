const socket = io();

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const nameInput = document.getElementById('name');
const enterBtn = document.getElementById('enter');
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const title = document.getElementById('title');

function addMessage(content, className = '') {
  const div = document.createElement('div');
  div.className = 'message ' + className;
  div.innerHTML = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

enterBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return alert('Escribe tu nombre');
  socket.emit('join', name);
  title.textContent = `DarkChat — ${name}`;
  loginDiv.style.display = 'none';
  chatDiv.style.display = 'flex';
});

sendBtn.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('message', text);
  msgInput.value = '';
});

msgInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

socket.on('system', (data) => {
  addMessage(`<div class="system">${escapeHtml(data.text)}</div>`, 'system');
});

socket.on('message', (m) => {
  const time = new Date(m.time).toLocaleTimeString();
  addMessage(`<div><strong>${escapeHtml(m.name)}</strong> <span class="meta">${time}</span></div><div>${escapeHtml(m.text)}</div>`);
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
