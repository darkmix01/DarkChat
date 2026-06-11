# DarkChat

Chat de texto sencillo en tiempo real (Express + Socket.IO). Solo se pide el nombre para entrar.

Archivos añadidos:
- `server.js` — servidor Express + Socket.IO
- `public/index.html` — cliente (pide nombre y muestra chat)
- `public/chat.js` — lógica cliente Socket.IO
- `package.json` — dependencias y scripts (`start`, `dev`)

Requisitos
- Node.js 18+ (o Node.js LTS)

Instalación y ejecución

1. Clonar el repositorio:

   git clone https://github.com/darkmix01/DarkChat.git
   cd DarkChat

2. Instalar dependencias:

   npm install

3. Ejecutar en desarrollo (con nodemon):

   npm run dev

   o ejecutar en producción:

   npm start

4. Abrir en el navegador:

   http://localhost:3000

Configuración
- Puerto: por defecto 3000. Puedes cambiarlo mediante la variable de entorno PORT:

  PORT=4000 npm start

Notas de seguridad y alcance
- Implementación mínima y sin autenticación. No usar en producción sin añadir medidas de seguridad (validación, límites, sanitización adicional, HTTPS, autenticación).
- Mensajes se transmiten en tiempo real vía Socket.IO y no se almacenan en el servidor.

Si quieres, puedo:
- Añadir almacenamiento (historial en archivo o base de datos),
- Forzar nombres únicos o gestionar salas,
- Hacer despliegue en una rama nueva o en la rama por defecto según prefieras.
