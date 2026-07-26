// Validar nombre de usuario
function validateUsername(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 30) return false;
  // Solo permitir caracteres alfanuméricos, guiones y guiones bajos
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

// Validar contenido de mensaje
function validateMessage(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 500) return false;
  return true;
}

// Sanitizar entrada (remover caracteres peligrosos)
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>"']/g, '') // Remover caracteres HTML peligrosos
    .substring(0, 30); // Limitar longitud
}

// Escapar HTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

module.exports = {
  validateUsername,
  validateMessage,
  sanitizeInput,
  escapeHtml
};
