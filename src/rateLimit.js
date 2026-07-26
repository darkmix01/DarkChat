// Sistema de rate limiting basado en ventanas de tiempo
class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = [];
  }

  tryConsume() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Limpiar requests antiguos
    this.requests = this.requests.filter(time => time > windowStart);

    // Verificar si puede enviar
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  reset() {
    this.requests = [];
  }
}

function createRateLimiter(
  windowMs = process.env.RATE_LIMIT_WINDOW || 60000,
  maxRequests = process.env.RATE_LIMIT_MAX_MESSAGES || 5
) {
  return new RateLimiter(windowMs, maxRequests);
}

module.exports = {
  RateLimiter,
  createRateLimiter
};
