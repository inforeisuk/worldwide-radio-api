import { Router } from 'express';
import { MetaController } from '../controllers/metaController.js';
import { DiagnosticsController } from '../controllers/diagnosticsController.js';

export const metaRouter = Router();

// Diagnóstico e telemetria operacional em tempo real
metaRouter.get('/diagnostics', DiagnosticsController.getDiagnostics);

// Países com contagem de emissoras
metaRouter.get('/countries', MetaController.getCountries);

// Continentes
metaRouter.get('/continents', MetaController.getContinents);

// Géneros e tags musicais
metaRouter.get('/genres', MetaController.getGenres);

// Idiomas suportados
metaRouter.get('/languages', MetaController.getLanguages);

// Estatísticas globais do serviço
metaRouter.get('/stats', MetaController.getStats);
