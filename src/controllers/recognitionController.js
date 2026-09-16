import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RecognitionService } from '../services/recognitionService.js';
import { RadioBrowserService } from '../services/radioBrowserService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

let curatedCatalog = [];
try {
  curatedCatalog = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf-8'));
} catch (e) {
  curatedCatalog = [];
}

export class RecognitionController {
  /**
   * Identificador acústico de faixas em direto (estilo Shazam)
   * GET /api/radios/:id/identify
   */
  static async identify(req, res) {
    try {
      const { id } = req.params;
      let radio = curatedCatalog.find(r => r.id === id || r.id === id.toLowerCase());

      if (!radio) {
        radio = await RadioBrowserService.getByUuid(id);
      }

      if (!radio) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Emissora "${id}" não encontrada para identificação.`
        });
      }

      const result = await RecognitionService.identifyTrack(radio);

      return res.json({
        status: 'success',
        stationId: radio.id,
        stationName: radio.name,
        identification: {
          track: result.title,
          artist: result.artist,
          album: result.album,
          genre: result.genre,
          confidence: result.confidence,
          lyrics: result.lyrics,
          streamingLinks: {
            spotify: result.spotifySearchUrl,
            youtube: result.youtubeSearchUrl,
            appleMusic: result.appleMusicSearchUrl
          }
        },
        ...result
      });
    } catch (err) {
      console.error('Erro em identify:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao identificar a música da transmissão.'
      });
    }
  }
}
