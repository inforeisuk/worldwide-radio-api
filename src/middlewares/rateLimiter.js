import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Geral da API (300 requisições por minuto por IP)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Limite de requisições excedido. Por favor, aguarde alguns segundos antes de tentar novamente.',
    status: 429
  }
});

/**
 * Rate Limiter para Operações Pesadas (Identificação Shazam, Radar de Artistas)
 * 60 requisições por minuto por IP
 */
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Demasiadas requisições para este serviço. Por favor, aguarde antes de tentar nova pesquisa.',
    status: 429
  }
});

/**
 * Rate Limiter para Inicialização de Streams de Áudio
 * 120 requisições por minuto por IP
 */
export const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Limite de inicializações de stream excedido temporariamente.',
    status: 429
  }
});
