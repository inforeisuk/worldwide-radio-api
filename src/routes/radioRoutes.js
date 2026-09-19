import { Router } from 'express';
import { RadioController } from '../controllers/radioController.js';
import { StationDetailController } from '../controllers/stationDetailController.js';
import { PodcastController } from '../controllers/podcastController.js';
import { HealthController } from '../controllers/healthController.js';
import { LyricsController } from '../controllers/lyricsController.js';
import { RecognitionController } from '../controllers/recognitionController.js';
import { LogoController } from '../controllers/logoController.js';

export const radioRouter = Router();

// Auto-reparação e cura de logótipos em lote
radioRouter.post('/radios/repair-logos', LogoController.repairCuratedLogos);

// Identificador acústico de faixas estilo Shazam
radioRouter.get('/radios/:id/identify', RecognitionController.identify);

// Pesquisa unificada
radioRouter.get('/search', RadioController.searchRadios);

// Letras de músicas em tempo real (Lyrics Finder)
radioRouter.get('/lyrics', LyricsController.getSongLyrics);

// Rádios mais populares
radioRouter.get('/radios/top', RadioController.getTopVoted);

// Rádio aleatória
radioRouter.get('/radios/random', RadioController.getRandomRadio);

// Listagem geral com filtros e paginação
radioRouter.get('/radios', RadioController.listRadios);

// Adicionar nova rádio
radioRouter.post('/radios', RadioController.addRadio);

// Exportador de playlist no formato M3U / M3U8
radioRouter.get('/radios/playlist.m3u', RadioController.exportPlaylistM3U);

// Rádios próximas de mim (geolocalização ou código de país)
radioRouter.get('/radios/nearby', RadioController.getNearbyRadios);

// Podcasts e programas gravados de uma emissora
radioRouter.get('/radios/:id/podcasts', PodcastController.getStationPodcasts);

// Monitor de saúde, latência e status online da emissora
radioRouter.get('/radios/:id/health', HealthController.checkRadioHealth);

// Perfil completo da emissora (Frequências, Programas, Contactos, Músicas)
radioRouter.get('/radios/:id/info', StationDetailController.getStationProfile);

// Histórico das músicas tocadas (Playlist History)
radioRouter.get('/radios/:id/history', StationDetailController.getStationHistory);

// Frequências da emissora
radioRouter.get('/radios/:id/frequencies', StationDetailController.getStationFrequencies);

// Detalhes de uma emissora por ID
radioRouter.get('/radios/:id', RadioController.getRadioById);

// Logótipo resiliente da emissora (Alta resolução com auto-fallback e vector badge)
radioRouter.get('/radios/:id/logo', LogoController.getStationLogo);

// Atualizar ou adicionar manualmente logótipo de uma emissora
radioRouter.put('/radios/:id/logo', LogoController.updateStationLogo);

// Stream de áudio direto (redirecionamento 302)
radioRouter.get('/radios/:id/stream', RadioController.streamRadio);

// Proxy de áudio resiliente (sem timeout, com headers CORS)
radioRouter.get('/radios/:id/proxy', RadioController.proxyRadio);

// Metadados ao vivo (Now Playing - música e artista)
radioRouter.get('/radios/:id/now-playing', RadioController.getNowPlaying);

