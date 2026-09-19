import { config } from '../config.js';

/**
 * Middleware de Segurança: API Key
 * Exige um cabeçalho x-api-key válido para aceder às rotas da API.
 */
export const requireApiKey = (req, res, next) => {
  // Exceção de Segurança Mágica: Permitir o Web Player (Frontend) funcionar sem chave!
  // Se o pedido vier do próprio browser no domínio da API, o browser envia estes cabeçalhos.
  const isSameOrigin = req.headers['sec-fetch-site'] === 'same-origin';
  const referer = req.headers.referer || '';
  const isFromWebPlayer = isSameOrigin || referer.includes('api-radio.inforeis.uk') || referer.includes('localhost');

  if (isFromWebPlayer) {
    return next(); // Deixa passar os utilizadores humanos da Versão Web!
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Acesso negado: API Key não fornecida. Contactar inforeis.uk para acesso.'
    });
  }

  if (apiKey !== config.apiKey) {
    console.warn(`Tentativa de acesso bloqueada (Chave inválida): ${apiKey} - IP: ${req.ip}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso negado: API Key inválida.'
    });
  }

  // Chave válida, prosseguir para a rota
  next();
};
