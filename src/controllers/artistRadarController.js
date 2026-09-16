import { HistoryService } from '../services/historyService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

let curatedCatalog = [];
try {
  curatedCatalog = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf-8'));
} catch (e) {
  curatedCatalog = [];
}

// Armazenamento em memória de artistas monitorizados por dispositivo
const radarDevicesStore = new Map();

export class ArtistRadarController {
  /**
   * Verificar quais as rádios que estão a tocar os artistas especificados
   * GET /api/radiotop/artists/now-playing?artists=Coldplay,Dua Lipa,Xutos
   */
  static async getNowPlayingByArtists(req, res) {
    try {
      const { artists, deviceId } = req.query;

      let targetArtists = [];
      if (artists) {
        targetArtists = artists.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
      } else if (deviceId && radarDevicesStore.has(deviceId)) {
        targetArtists = radarDevicesStore.get(deviceId).map(a => a.toLowerCase());
      }

      if (targetArtists.length === 0) {
        // Artistas populares por defeito
        targetArtists = ['coldplay', 'dua lipa', 'billie eilish', 'the weeknd', 'sabrina carpenter', 'os quatro e meia', 'bárbara tinoco'];
      }

      // Verificar as músicas tocadas recentemente em todas as rádios
      const matches = [];

      for (const radio of curatedCatalog) {
        const history = HistoryService.getRecentTracks(radio.id, 5);
        for (const track of history) {
          const trackArtistLower = (track.artist || '').toLowerCase();
          const matched = targetArtists.find(target => trackArtistLower.includes(target));

          if (matched) {
            matches.push({
              stationId: radio.id,
              stationName: radio.name,
              country: radio.country,
              countryCode: radio.countryCode,
              logo: radio.logo,
              artist: track.artist,
              track: track.title,
              songTitle: track.title,
              artistMatched: track.artist,
              searchedKeyword: matched,
              playedAt: track.playedAt,
              station: {
                id: radio.id,
                name: radio.name,
                country: radio.country,
                countryCode: radio.countryCode,
                logo: radio.logo,
                streamUrl: radio.streamUrl
              },
              directPlayUrl: `/api/radios/${radio.id}/stream`,
              proxyPlayUrl: `/api/radios/${radio.id}/proxy`
            });
            break; // 1 match por estação para não duplicar
          }
        }
      }

      return res.json({
        status: 'success',
        success: true,
        checkedAt: new Date().toISOString(),
        totalStationsChecked: curatedCatalog.length,
        totalMatches: matches.length,
        artistsTracked: targetArtists,
        nowPlaying: matches,
        matches
      });
    } catch (err) {
      console.error('Erro em getNowPlayingByArtists:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao verificar radar de artistas.' });
    }
  }

  /**
   * Registar artistas para monitorização contínua de um dispositivo e retornar ocorrências em direto
   * POST /api/radiotop/artists/radar
   */
  static async registerRadar(req, res) {
    try {
      const { deviceId, artists } = req.body || {};

      if (!Array.isArray(artists) || artists.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'O campo "artists" (array de strings) é obrigatório.'
        });
      }

      const clientDeviceId = deviceId || 'anonymous-device';
      radarDevicesStore.set(clientDeviceId, artists);

      const targetArtists = artists.map(a => a.trim().toLowerCase()).filter(Boolean);
      const matches = [];

      for (const radio of curatedCatalog) {
        const history = HistoryService.getRecentTracks(radio.id, 5);
        for (const track of history) {
          const trackArtistLower = (track.artist || '').toLowerCase();
          const matched = targetArtists.find(target => trackArtistLower.includes(target));

          if (matched) {
            matches.push({
              stationId: radio.id,
              stationName: radio.name,
              country: radio.country,
              countryCode: radio.countryCode,
              logo: radio.logo,
              artist: track.artist,
              track: track.title,
              songTitle: track.title,
              artistMatched: track.artist,
              searchedKeyword: matched,
              playedAt: track.playedAt,
              directPlayUrl: `/api/radios/${radio.id}/stream`,
              proxyPlayUrl: `/api/radios/${radio.id}/proxy`
            });
            break;
          }
        }
      }

      return res.json({
        status: 'success',
        success: true,
        deviceId: clientDeviceId,
        registeredArtistsCount: artists.length,
        searchedArtists: artists,
        totalMatches: matches.length,
        matches,
        message: 'Radar de artistas consultado com sucesso.'
      });
    } catch (err) {
      console.error('Erro em registerRadar:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao registar radar de artistas.' });
    }
  }
}
