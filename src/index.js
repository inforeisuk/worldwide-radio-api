import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { config } from './config.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { radioRouter } from './routes/radioRoutes.js';
import { metaRouter } from './routes/metaRoutes.js';
import { radioTopRouter } from './routes/radioTopRoutes.js';
import { chartRouter } from './routes/chartRoutes.js';
import { podcastRouter } from './routes/podcastRoutes.js';
import { initCronJobs } from './jobs/cronJobs.js';
import { SocketService } from './services/socketService.js';
import { requireApiKey } from './middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares de Segurança e Otimização
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Headers de Proteção HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Compressão Gzip / Brotli inteligente (ignora streams contínuos de áudio)
app.use(compression({
  filter: (req, res) => {
    if (req.path.includes('/stream') || req.path.includes('/proxy')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Servir frontend interativo (Web Player & Explorer)
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting nos endpoints da API
app.use('/api', apiLimiter);

// Documentação Swagger UI
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui { background-color: #0f172a; color: #f8fafc; }
      .swagger-ui .info .title { color: #38bdf8; }
    `,
    customSiteTitle: 'Worldwide Radio API - Documentação Swagger'
  }));
} catch (err) {
  console.warn('Aviso: Não foi possível carregar o swagger.yaml:', err.message);
}

// Health check desprotegido (para o Render não falhar)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proteger todas as rotas da API com a API Key
app.use('/api', requireApiKey);

// Montar as rotas da API
app.use('/api', radioRouter);
app.use('/api', metaRouter);
app.use('/api/radiotop', radioTopRouter);
app.use('/api/charts', chartRouter);
app.use('/api/podcasts', podcastRouter);

// Fallback 404 para rotas de API não existentes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `A rota ${req.originalUrl} não foi encontrada. Consulte /docs para ver todos os endpoints disponíveis.`
  });
});

// Tratamento global de exceções (impede crashes acidentais do processo)
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err.message || err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message || 'Ocorreu um erro interno no servidor.'
    });
  }
});

// Inicialização do servidor (apenas fora de testes automatizados)
let server = null;
if (process.env.NODE_ENV !== 'test') {
  initCronJobs();
  server = app.listen(config.port, config.host, () => {
    console.log(`=======================================================`);
    console.log(` 🌍 Worldwide Radio API iniciada com sucesso!`);
    console.log(` 🚀 Servidor local:        http://localhost:${config.port}`);
    console.log(` 📻 Web Player & Explorer: http://localhost:${config.port}`);
    console.log(` 📖 Swagger Docs:          http://localhost:${config.port}/docs`);
    console.log(` 📡 Endpoint de Rádios:    http://localhost:${config.port}/api/radios`);
    console.log(` 🩺 Telemetria & Status:   http://localhost:${config.port}/api/diagnostics`);
    console.log(` 📊 Estatísticas:          http://localhost:${config.port}/api/stats`);
    console.log(`=======================================================`);
  });

  // Inicializar o túnel WebSocket na mesma porta
  SocketService.init(server);
}

// Encerramento suave (Graceful Shutdown)
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Sinal ${signal} recebido. A encerrar o servidor suavemente...`);
  if (server) {
    server.close(() => {
      console.log('✅ Servidor HTTP e conexões encerradas com sucesso.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
