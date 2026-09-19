import { Router } from 'express';
import { RadioTopController } from '../controllers/radioTopController.js';
import { StationDetailController } from '../controllers/stationDetailController.js';
import { ArtistRadarController } from '../controllers/artistRadarController.js';

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

// Algoritmo "Para Ti" (Recomendações Inteligentes)
radioTopRouter.get('/foryou', RadioTopController.getForYouRecommendations);

// Now Playing para ecrã de bloqueio / widgets móveis
radioTopRouter.get('/now-playing/:id', RadioTopController.getNowPlaying);

// Stream resiliente otimizado para o RadioTop
radioTopRouter.get('/stream/:id', RadioTopController.streamRadio);

// Radar de Artistas Favoritos (Now Playing e Registo de Alertas)
radioTopRouter.get('/artists/now-playing', ArtistRadarController.getNowPlayingByArtists);
radioTopRouter.post('/artists/radar', ArtistRadarController.registerRadar);

// Árvore de navegação para Android Auto e Apple CarPlay
radioTopRouter.get('/car/browse', RadioTopController.getCarBrowserTree);

