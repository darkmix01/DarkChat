# 🌙 DarkChat v2.1 - Mejorado para Mobile

Chat en tiempo real minimalista con diseño oscuro, **ahora con interfaz completamente responsiva para móviles y sistema de alertas mejorado**.

## ✨ Características Principales

### v2.1 (Mejoras Mobile & Alertas)
- ✅ **Interfaz 100% responsiva** — Optimizada para móviles (320px+)
- ✅ **Sidebar colapsable** — Ocultable en pantallas pequeñas
- ✅ **Sistema de alertas mejorado** — Notificaciones elegantes con animaciones
- ✅ **Mejor UX mobile** — Botones más grandes, textos legibles
- ✅ **Viewport meta actualizado** — Comportamiento correcto en móviles
- ✅ **Touch-friendly** — Espaciado óptimo para dedos

### v2.0
- ✅ **Base de datos SQLite** — Historial persistente de mensajes
- ✅ **Múltiples salas** — general, tech, gaming, casual (extensibles)
- ✅ **Validación XSS** — Sanitización de mensajes
- ✅ **Rate limiting** — Anti-spam: máx. 5 mensajes/minuto
- ✅ **Lista de usuarios** — Ve quién está conectado
- ✅ **Indicador de escritura** — "X usuarios escribiendo..."
- ✅ **Nombres únicos** — No permiten duplicados por sala

### v1.0
- Chat en tiempo real vía Socket.IO
- Entrada simple (solo nombre)
- Diseño dark web minimalista

## 🛠️ Stack

- **Backend:** Node.js + Express + Socket.IO
- **Database:** SQLite3
- **Frontend:** HTML5 + Vanilla JavaScript + CSS3 (Responsive)
- **Seguridad:** xss, validación, rate limiting

## 📱 Responsividad

| Dispositivo | Ancho | Comportamiento |
|-------------|-------|----------------|
| Móvil | <480px | Sidebar oculto (toggle), botones grandes, fuentes ajustadas |
| Tablet | 481-900px | Sidebar más estrecho, layout flexible |
| Desktop | >900px | Layout completo, sidebar visible |

## 🚀 Instalación Rápida

```bash
# Clonar
git clone https://github.com/darkmix01/DarkChat.git
cd DarkChat

# Instalar dependencias
npm install

# Configurar (opcional)
cp .env.example .env

# Ejecutar
npm run dev    # Desarrollo con auto-reload
npm start      # Producción

# Abrir
http://localhost:3000
```

## 🎨 Sistema de Alertas

Las alertas se muestran en la esquina superior derecha con animaciones suaves:

```javascript
showAlert(type, message, duration);
// Tipos: 'error', 'success', 'warning', 'info'
// Duración en ms (0 = permanente)

Ejemplos:
showAlert('success', '✅ Conectado', 3000);
showAlert('error', '❌ Error de red', 0);
showAlert('warning', '⚠️ Mensaje muy rápido', 5000);
showAlert('info', 'ℹ️ Información', 4000);
```

## 📐 Estructura del Proyecto

```
DarkChat/
├── server.js                 # Servidor principal
├── package.json              # Dependencias
├── .env.example              # Configuración
├── .gitignore
├── LICENSE
├── README.md
│
├── src/
│   ├── database.js          # SQLite
│   ├── validation.js        # Validación de entrada
│   └── rateLimit.js         # Rate limiting
│
├── public/
│   ├── index.html           # UI (100% responsive)
│   └── chat.js              # Lógica cliente + alertas
│
└── data/
    └── chat.db              # Base de datos (generada)
```

## 🔐 Seguridad Implementada

- ✅ Sanitización XSS (librería `xss`)
- ✅ Validación de entrada
- ✅ Rate limiting (5 msgs/min)
- ✅ HTML escaping
- ✅ Nombres únicos por sala
- ✅ Validación en cliente y servidor

**Para producción:**
- Usar HTTPS/WSS
- Autenticación (JWT)
- CORS configurado
- Firewall
- Logs centralizados

## 📡 API REST

```bash
# Obtener salas
GET /api/rooms

# Obtener mensajes de una sala
GET /api/messages/:roomId?limit=50

# Obtener usuarios conectados
GET /api/users/:roomId
```

## 🎮 Socket.IO Eventos

**Cliente → Servidor:**
- `join: {name, room}` — Conectarse
- `message: text` — Enviar mensaje
- `typing` — Notificar escritura
- `stop-typing` — Dejar de escribir

**Servidor → Cliente:**
- `system: {text, type}` — Mensajes del sistema
- `message: {id, name, text, time}` — Nuevo mensaje
- `history: [messages]` — Historial
- `user-list: [users]` — Lista de usuarios
- `user-typing: {user, id}` — Usuario escribiendo
- `error: {message}` — Error

## ⚙️ Variables de Entorno (.env)

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/chat.db
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_MESSAGES=5
MAX_MESSAGE_LENGTH=500
MAX_USERNAME_LENGTH=30
```

## 🐛 Troubleshooting

**"Error: Cannot find module 'sqlite3'"**
```bash
npm install sqlite3 --build-from-source
```

**Puerto 3000 en uso:**
```bash
PORT=4000 npm start
```

**Base de datos corrupta:**
```bash
rm data/chat.db
npm start  # Se recreará
```

## 🚀 Futuras Mejoras

- [ ] Autenticación con JWT/OAuth
- [ ] Mensajes privados 1-a-1
- [ ] Reacciones con emoji
- [ ] Editar/eliminar mensajes
- [ ] Menciones (@usuario)
- [ ] Compartir archivos
- [ ] Notificaciones browser
- [ ] Tests automatizados
- [ ] Deploy (Heroku/Railway)

## 📋 Requisitos

- Node.js 18+
- npm 9+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir.

---

**Desarrollado con ❤️ por darkmix01**

[GitHub](https://github.com/darkmix01/DarkChat) • [Issues](https://github.com/darkmix01/DarkChat/issues)
