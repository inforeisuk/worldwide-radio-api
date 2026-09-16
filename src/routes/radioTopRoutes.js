import { Router } from 'express';
import { RadioTopController } from '../controllers/radioTopController.js';
import { StationDetailController } from '../controllers/stationDetailController.js';

export const radioTopRouter = Router();

// Catálogo formatado para o RadioTop
radioTopRouter.get('/stations', RadioTopController.getStations);

// Informações detalhadas e frequências da estação para o RadioTop
radioTopRouter.get('/stations/:id/info', StationDetailController.getRadioTopStationInfo);

// Países formatados para o RadioTop
radioTopRouter.get('/countries', RadioTopController.getCountries);

// Sincronização na Nuvem de Favoritos
radioTopRouter.get('/favorites', RadioTopController.getFavorites);
radioTopRouter.post('/favorites', RadioTopController.saveFavorites);

// Now Playing para ecrã de bloqueio / widgets móveis
radioTopRouter.get('/now-playing/:id', RadioTopController.getNowPlaying);

// Stream resiliente otimizado para o RadioTop
radioTopRouter.get('/stream/:id', RadioTopController.streamRadio);

