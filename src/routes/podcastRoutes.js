import { Router } from 'express';
import { PodcastController } from '../controllers/podcastController.js';

export const podcastRouter = Router();

// Listar episódios recentes de todos os podcasts
podcastRouter.get('/podcasts/episodes/latest', PodcastController.getLatestEpisodes);

// Detalhes e episódios de um podcast específico
podcastRouter.get('/podcasts/:podcastId', PodcastController.getPodcastEpisodes);
