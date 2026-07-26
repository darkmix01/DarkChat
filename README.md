# 🌙 DarkChat v2.0 - Mejorado

Chat en tiempo real minimalista con diseño oscuro, **ahora con salas, historial persistente, validación de seguridad y más features**.

## ✨ Características

### v2.0 (Nuevas mejoras)
- ✅ **Base de datos SQLite** — Historial persistente de mensajes
- ✅ **Múltiples salas** — general, tech, gaming, casual (extensibles)
- ✅ **Validación XSS** — Sanitización de mensajes con librería `xss`
- ✅ **Rate limiting** — Anti-spam: máx. 5 mensajes por minuto
- ✅ **Lista de usuarios** — Ve quién está conectado en cada sala
- ✅ **Indicador de escritura** — "X usuarios escribiendo..."
- ✅ **Nombres únicos por sala** — No permiten duplicados
- ✅ **Mejor UI** — Sidebar con salas y usuarios, diseño mejorado
- ✅ **Configuración con .env** — Variables de entorno personalizables

### v1.0 (Original)
- Chat en tiempo real vía Socket.IO
- Entrada simple (solo nombre)
- Diseño dark web minimalista
- Sin almacenamiento

## 🛠️ Stack

- **Backend:** Node.js + Express + Socket.IO
- **Database:** SQLite3
- **Frontend:** HTML + Vanilla JavaScript
- **Seguridad:** xss (sanitización), validación de entrada, rate limiting

## 📋 Requisitos

- Node.js 18+ (LTS recomendado)
- npm 9+

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/darkmix01/DarkChat.git
cd DarkChat
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

**Archivo `.env` (personalizable):**

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/chat.db
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_MESSAGES=5
MAX_MESSAGE_LENGTH=500
MAX_USERNAME_LENGTH=30
```

### 4. Ejecutar

**Desarrollo (con auto-reload):**

```bash
npm run dev
```

**Producción:**

```bash
npm start
```

### 5. Abrir en navegador

```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
DarkChat/
├── server.js              # Servidor principal + Socket.IO
├── package.json           # Dependencias
├── .env.example           # Variables de entorno (ejemplo)
├── .gitignore             # Archivos ignorados
├── LICENSE                # MIT License
├── README.md              # Este archivo
│
├── src/
│   ├── database.js        # Clase Database (SQLite)
│   ├── validation.js      # Validación de entrada
│   └── rateLimit.js       # Rate limiting
│
├── public/
│   ├── index.html         # Cliente (UI mejorada)
│   └── chat.js            # Lógica del cliente
│
└── data/
    └── chat.db            # Base de datos (generada)
```

## 🔒 Seguridad

### Implementado
- **XSS Protection:** Sanitización de mensajes con `xss` package
- **Input Validation:** Validación de username y mensaje
- **Rate Limiting:** Máx. 5 mensajes/minuto por usuario
- **HTML Escaping:** Escapado de caracteres peligrosos
- **Unique Names:** Nombres únicos por sala

### Recomendaciones para Producción
- Usar HTTPS/WSS (certificado SSL)
- Agregar autenticación (JWT, OAuth)
- Configurar CORS según dominio permitido
- Agregar logs centralizados
- Usar reverse proxy (nginx)
- Configurar firewall
- Rate limiting más estricto en producción

## 📊 API REST

### GET `/api/rooms`

Obtener todas las salas disponibles.

```bash
curl http://localhost:3000/api/rooms
```

### GET `/api/messages/:roomId`

Obtener últimos 50 mensajes de una sala (personalizable con `?limit=N`).

```bash
curl 'http://localhost:3000/api/messages/general?limit=100'
```

### GET `/api/users/:roomId`

Obtener usuarios conectados en una sala.

```bash
curl http://localhost:3000/api/users/general
```

## 🔌 Socket.IO Eventos

### Cliente → Servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `join` | `{name, room}` | Conectarse a una sala |
| `message` | `text` | Enviar mensaje |
| `typing` | — | Notificar que está escribiendo |
| `stop-typing` | — | Notificar que dejó de escribir |

### Servidor → Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `system` | `{text, type}` | Mensaje del sistema |
| `message` | `{id, name, text, time}` | Nuevo mensaje |
| `history` | `[messages]` | Historial al conectar |
| `user-list` | `[users]` | Lista de usuarios |
| `user-typing` | `{user, id}` | Usuario escribiendo |
| `user-stop-typing` | `{id}` | Usuario dejó de escribir |
| `error` | `{message}` | Error (ej: nombre duplicado) |

## 🎮 Uso

1. **Abrir navegador** → `http://localhost:3000`
2. **Ingresar nombre** (1-30 caracteres alfanuméricos)
3. **Seleccionar sala** (general, tech, gaming, casual)
4. **Clickear "Entrar"**
5. **Ver historial** de la sala (últimos 50 mensajes)
6. **Escribir mensajes** — Máx. 5 por minuto, máx. 500 caracteres
7. **Ver usuarios conectados** en el sidebar derecho
8. **Cambiar de sala** — Clickear sala en el sidebar izquierdo

## 📝 Notas

- **Base de datos:** Los mensajes se guardan en SQLite (`./data/chat.db`)
- **Límite de salas:** Actualmente 4 predefinidas, extensible en `public/index.html`
- **Persistencia:** Los mensajes se mantienen entre reinicios (SQLite)
- **Sin autenticación:** Los usuarios son anónimos, identificados por nombre + socket ID

## 🚧 Futuras Mejoras

- [ ] Autenticación con JWT
- [ ] Mensajes privados 1-a-1
- [ ] Reacciones con emoji
- [ ] Editar/Eliminar mensajes
- [ ] Menciones (@usuario)
- [ ] Archivos compartidos
- [ ] Notificaciones del navegador
- [ ] Dark/Light theme toggle
- [ ] Tests automatizados
- [ ] Deploy a Heroku/Railway

## 📄 Licencia

MIT — Libre para usar, modificar y distribuir.

---

**Hecho con ❤️ por darkmix01**
