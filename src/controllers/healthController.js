import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HealthService } from '../services/healthService.js';
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

export class HealthController {
  /**
   * Verificar a saúde e latência de uma emissora
   */
  static async checkRadioHealth(req, res) {
    try {
      const { id } = req.params;
      let radio = curatedCatalog.find(r => r.id === id || r.id === id.toLowerCase());

      if (!radio) {
        radio = await RadioBrowserService.getByUuid(id);
      }

      if (!radio || !radio.streamUrl) {
        return res.status(404).json({ error: 'Not Found', message: `Emissora "${id}" não encontrada.` });
      }

      const health = await HealthService.checkStreamHealth(radio.streamUrl);

      return res.json({
        id: radio.id,
        name: radio.name,
        streamUrl: radio.streamUrl,
        health
      });
    } catch (err) {
      console.error('Erro em checkRadioHealth:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao verificar saúde da transmissão.' });
    }
  }
}
