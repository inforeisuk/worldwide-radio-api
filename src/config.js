export const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  version: '1.0.0',
  mirrors: [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info'
  ],
  userAgent: 'WorldwideRadioAPI/1.0 (Node.js/Express; https://radio-browser.info)',
  cacheTTL: 1000 * 60 * 15, // 15 minutos em milissegundos
  requestTimeout: 5000 // 5 segundos
};
