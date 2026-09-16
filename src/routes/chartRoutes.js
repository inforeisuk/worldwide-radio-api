import { Router } from 'express';
import { ChartController } from '../controllers/chartController.js';

export const chartRouter = Router();

// Ranking Top 40 das músicas mais tocadas nas rádios (Airplay Chart)
chartRouter.get('/charts/top-tracks', ChartController.getTopTracks);
