import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StreamService } from '../services/streamService.js';
import { cache } from '../services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

let curatedCatalog = [];
try {
  curatedCatalog = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf-8'));
} catch (err) {
  curatedCatalog = [];
}

// Mapeamento de cores de destaque por país/categoria para o RadioTop
const DEFAULT_BRAND_COLORS = {
  PT: '0xFF0072CE',
  BR: '0xFF009B3A',
  US: '0xFFB22234',
  GB: '0xFF00247D',
  FR: '0xFF0055A4',
  ES: '0xFFA40000',
  DE: '0xFF000000',
  IT: '0xFF009246',
  CH: '0xFFFF0000',
  LU: '0xFF00A3E0',
  NL: '0xFFFF4F00',
  JP: '0xFFBC002D',
  AU: '0xFF00843D',
  AR: '0xFF75AADB',
  MX: '0xFF006847'
};

// Armazenamento em memória de favoritos por utilizador/dispositivo
const userFavoritesStore = new Map();

export class RadioTopController {
  /**
   * Converte o modelo genérico para o modelo estrito RadioStation da app RadioTop
   */
  static formatForRadioTop(station, isFavorite = false) {
    const countryCode = (station.countryCode || 'GLOBAL').toUpperCase();
    const colorHex = DEFAULT_BRAND_COLORS[countryCode] || '0xFF1E88E5';

    return {
      id: station.id.replace(/-/g, '_'),
      originalId: station.id,
      name: station.name,
      frequencyOrSlogan: station.description || `${station.name} ao vivo`,
      genre: (station.genres && station.genres.length > 0) ? station.genres.join(' / ') : 'Geral',
      country: station.country || 'Mundial',
      countryCode: station.countryCode || '',
      city: station.city || '',
      streamUrl: station.streamUrl,
      backupStreamUrl: station.backupStreamUrl || '',
      proxyStreamUrl: `/api/radios/${station.id}/proxy`,
      logoUrl: station.logo || '',
      logoColorHex: colorHex,
      bitRateKbps: station.bitrate || 128,
      isFavorite: isFavorite,
      isFeatured: !!station.isFeatured,
      isAutoPreset: !!station.isFeatured,
      appTarget: 'RadioTop Premium'
    };
  }

  /**
   * Lista estações no formato nativo da aplicação RadioTop
   */
  static getStations(req, res) {
    try {
      const { country, genre, search, deviceId = 'default' } = req.query;
      let stations = [...curatedCatalog];

      const userFavs = userFavoritesStore.get(deviceId) || new Set();

      if (country) {
        const cLower = country.toLowerCase();
        stations = stations.filter(r => 
          (r.country && r.country.toLowerCase().includes(cLower)) ||
          (r.countryCode && r.countryCode.toLowerCase() === cLower)
        );
      }

      if (genre) {
        const gLower = genre.toLowerCase();
        stations = stations.filter(r => r.genres && r.genres.some(g => g.toLowerCase().includes(gLower)));
      }

      if (search) {
        const sLower = search.toLowerCase();
        stations = stations.filter(r => 
          r.name.toLowerCase().includes(sLower) ||
          (r.description && r.description.toLowerCase().includes(sLower)) ||
          (r.city && r.city.toLowerCase().includes(sLower))
        );
      }

      const formatted = stations.map(s => RadioTopController.formatForRadioTop(s, userFavs.has(s.id)));

      return res.json({
        app: 'RadioTop Premium',
        version: '1.0.0',
        total: formatted.length,
        stations: formatted
      });
    } catch (err) {
      console.error('Erro em RadioTopController.getStations:', err);
      return res.status(500).json({ error: 'Erro ao gerar catálogo para RadioTop' });
    }
  }

  /**
   * Obter lista de países suportados no formato RadioTop
   */
  static getCountries(req, res) {
    const countryMap = new Map();

    for (const r of curatedCatalog) {
      const country = r.country || 'Mundial';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    }

    const countries = Array.from(countryMap.entries()).map(([country, count]) => ({
      name: country,
      stationCount: count
    })).sort((a, b) => b.stationCount - a.stationCount);

    return res.json({
      total: countries.length,
      countries
    });
  }

  /**
   * Sincronizar / Obter favoritos do utilizador RadioTop (Cloud Sync)
   */
  static getFavorites(req, res) {
    const deviceId = req.headers['x-device-id'] || req.query.deviceId || 'default';
    const favSet = userFavoritesStore.get(deviceId) || new Set();

    const stations = curatedCatalog
      .filter(r => favSet.has(r.id))
      .map(s => RadioTopController.formatForRadioTop(s, true));

    return res.json({
      deviceId,
      total: stations.length,
      favorites: stations
    });
  }

  /**
   * Guardar / Atualizar lista de favoritos do utilizador
   */
  static saveFavorites(req, res) {
    const deviceId = req.headers['x-device-id'] || req.body.deviceId || 'default';
    const { stationIds } = req.body;

    if (!Array.isArray(stationIds)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'stationIds deve ser um array de IDs de estações.'
      });
    }

    userFavoritesStore.set(deviceId, new Set(stationIds));

    return res.json({
      success: true,
      deviceId,
      savedCount: stationIds.length,
      message: 'Favoritos sincronizados com a nuvem do RadioTop com sucesso!'
    });
  }

  /**
   * Now Playing simplificado para notificações e lockscreen do RadioTop
   */
  static async getNowPlaying(req, res) {
    const { id } = req.params;
    const station = curatedCatalog.find(r => r.id === id || r.id.replace(/-/g, '_') === id);

    if (!station || !station.streamUrl) {
      return res.status(404).json({ error: 'Estação não encontrada' });
    }

    const np = await StreamService.getNowPlaying(station.streamUrl);
    return res.json({
      stationId: station.id,
      stationName: station.name,
      songTitle: np.title,
      artist: np.artist,
      fullTitle: np.raw,
      logoUrl: station.logo || ''
    });
  }

  /**
   * Streaming de alta estabilidade para clientes móveis
   */
  static streamRadio(req, res) {
    const { id } = req.params;
    const station = curatedCatalog.find(r => r.id === id || r.id.replace(/-/g, '_') === id);

    if (!station || !station.streamUrl) {
      return res.status(404).json({ error: 'Stream não encontrado' });
    }

    StreamService.proxyStream(station.streamUrl, req, res);
  }
}
