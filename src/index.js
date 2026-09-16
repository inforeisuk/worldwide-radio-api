import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { config } from './config.js';
import { radioRouter } from './routes/radioRoutes.js';
import { metaRouter } from './routes/metaRoutes.js';
import { radioTopRouter } from './routes/radioTopRoutes.js';
import { chartRouter } from './routes/chartRoutes.js';
import { podcastRouter } from './routes/podcastRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend interativo (Web Player & Explorer)
app.use(express.static(path.join(__dirname, 'public')));

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

// Rotas da API
app.use('/api', radioRouter);
app.use('/api', metaRouter);
app.use('/api', chartRouter);
app.use('/api', podcastRouter);
app.use('/api/radiotop', radioTopRouter);

// Fallback 404 para rotas de API não existentes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `A rota ${req.originalUrl} não foi encontrada. Consulte /docs para ver todos os endpoints disponíveis.`
  });
});

// Inicialização do servidor (apenas fora de testes automatizados)
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, config.host, () => {
    console.log(`=======================================================`);
    console.log(` 🌍 Worldwide Radio API iniciada com sucesso!`);
    console.log(` 🚀 Servidor local:        http://localhost:${config.port}`);
    console.log(` 📻 Web Player & Explorer: http://localhost:${config.port}`);
    console.log(` 📖 Swagger Docs:          http://localhost:${config.port}/docs`);
    console.log(` 📡 Endpoint de Rádios:    http://localhost:${config.port}/api/radios`);
    console.log(` 📊 Estatísticas:          http://localhost:${config.port}/api/stats`);
    console.log(`=======================================================`);
  });
}

export { app, server };
