const socket = io();

const loginDiv = document.getElementById('login');
const chatDiv = document.getElementById('chat');
const nameInput = document.getElementById('name');
const enterBtn = document.getElementById('enter');
const messagesDiv = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const title = document.getElementById('title');
const usersDiv = document.getElementById('users');
const usersCount = document.getElementById('users-count');
const typingDiv = document.getElementById('typing');

let myName = null;
let typingTimeout = null;
let othersTyping = new Set();

function addMessage(content, className = '') {
  const div = document.createElement('div');
  div.className = 'message ' + className;
  div.innerHTML = content;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function avatarHtml(name) {
  const initials = name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  const color = stringToColor(name);
  return `<div class="avatar" style="background:${color};">${escapeHtml(initials)}</div>`;
}

enterBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return alert('Escribe tu nombre');
  myName = name;
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
  socket.emit('typing', false);
});

msgInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

msgInput.addEventListener('input', () => {
  socket.emit('typing', true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit('typing', false), 900);
});

socket.on('system', (data) => {
  addMessage(`<div class="system">${escapeHtml(data.text)}</div>`, 'system');
});

socket.on('message', (m) => {
  const time = new Date(m.time).toLocaleTimeString();
  const isMine = m.name === myName;
  const cls = isMine ? 'mine' : 'other';
  const av = avatarHtml(m.name);
  const meta = `<div><strong>${escapeHtml(m.name)}</strong> <span class="meta">${time}</span></div>`;
  addMessage(`<div style="display:flex;gap:8px;align-items:flex-start">${av}<div>${meta}<div>${escapeHtml(m.text)}</div></div></div>`, cls);
});

socket.on('users', (list) => {
  usersDiv.innerHTML = '';
  const unique = [];
  const seen = new Set();
  list.forEach(u => {
    if (!seen.has(u.name)) { seen.add(u.name); unique.push(u); }
  });
  unique.forEach(u => {
    const el = document.createElement('div');
    el.className = 'user';
    el.innerHTML = `${avatarHtml(u.name)}<div style="font-size:14px">${escapeHtml(u.name)}</div>`;
    usersDiv.appendChild(el);
  });
  usersCount.textContent = `${unique.length} online`;
});

socket.on('typing', (data) => {
  if (!data || !data.name) return;
  if (data.typing) {
    if (data.name !== myName) othersTyping.add(data.name);
  } else {
    othersTyping.delete(data.name);
  }
  renderTyping();
});

function renderTyping() {
  if (othersTyping.size === 0) {
    typingDiv.style.display = 'none';
    typingDiv.textContent = '';
    return;
  }
  typingDiv.style.display = 'block';
  const names = Array.from(othersTyping).slice(0,3);
  typingDiv.textContent = names.join(', ') + (othersTyping.size > 3 ? ' y otros están escribiendo...' : ' está escribiendo...');
}
