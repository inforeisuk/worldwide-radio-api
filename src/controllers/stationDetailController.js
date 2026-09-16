import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HistoryService } from '../services/historyService.js';
import { StreamService } from '../services/streamService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DETAILS_PATH = path.join(__dirname, '../data/stationDetails.json');
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

let stationDetails = {};
let curatedCatalog = [];

try {
  stationDetails = JSON.parse(fs.readFileSync(DETAILS_PATH, 'utf-8'));
  curatedCatalog = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf-8'));
} catch (err) {
  console.error('Erro ao carregar dados de detalhes:', err);
}

function findStation(id) {
  const normId = id.toLowerCase().replace(/_/g, '-');
  return curatedCatalog.find(r => r.id === normId || r.id === id);
}

export class StationDetailController {
  /**
   * Perfil completo institucional da emissora (Frequências, Programas, Contactos, Músicas)
   */
  static async getStationProfile(req, res) {
    try {
      const { id } = req.params;
      const station = findStation(id);

      if (!station) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Emissora "${id}" não encontrada.`
        });
      }

      const normId = station.id;
      const details = stationDetails[normId] || {
        slogan: station.description || `${station.name} - Emissão ao vivo`,
        about: station.description || `Transmissão oficial de ${station.name} a partir de ${station.city || station.country}.`,
        frequencies: [
          { city: station.city || 'Nacional', frequency: 'FM / Web' }
        ],
        contacts: {
          phone: '',
          email: '',
          address: `${station.city || ''}, ${station.country}`,
          website: station.homepage || ''
        },
        social: {},
        schedule: [
          { time: "07:00 - 10:00", title: "Emissão Matinal", hosts: [station.name] },
          { time: "10:00 - 18:00", title: "Música e Atualidade", hosts: [station.name] },
          { time: "18:00 - 00:00", title: "Tarde e Noite", hosts: [station.name] }
        ],
        hosts: []
      };

      // Obter histórico recente de músicas
      const genre = (station.genres && station.genres[0]) || 'pop';
      const history = HistoryService.getHistory(station.id, genre, 15);

      return res.json({
        id: station.id,
        name: station.name,
        country: station.country,
        countryCode: station.countryCode,
        city: station.city,
        logo: station.logo,
        streamUrl: station.streamUrl,
        genres: station.genres,
        bitrate: station.bitrate,
        slogan: details.slogan,
        about: details.about,
        frequencies: details.frequencies,
        schedule: details.schedule,
        hosts: details.hosts,
        contacts: details.contacts,
        social: details.social,
        recentTracks: history
      });
    } catch (err) {
      console.error('Erro em getStationProfile:', err);
      return res.status(500).json({ error: 'Erro ao obter perfil da estação' });
    }
  }

  /**
   * Histórico das músicas tocadas (Playlist History)
   */
  static getStationHistory(req, res) {
    try {
      const { id } = req.params;
      const station = findStation(id);

      if (!station) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Emissora "${id}" não encontrada.`
        });
      }

      const limit = parseInt(req.query.limit, 10) || 15;
      const genre = (station.genres && station.genres[0]) || 'pop';
      const history = HistoryService.getHistory(station.id, genre, limit);

      return res.json({
        stationId: station.id,
        stationName: station.name,
        total: history.length,
        tracks: history
      });
    } catch (err) {
      console.error('Erro em getStationHistory:', err);
      return res.status(500).json({ error: 'Erro ao obter histórico de músicas' });
    }
  }

  /**
   * Frequências de sintonia regional
   */
  static getStationFrequencies(req, res) {
    const { id } = req.params;
    const station = findStation(id);

    if (!station) {
      return res.status(404).json({ error: 'Emissora não encontrada' });
    }

    const details = stationDetails[station.id];
    const freqs = (details && details.frequencies) || [
      { city: station.city || 'Nacional', frequency: 'Web / FM' }
    ];

    return res.json({
      stationId: station.id,
      stationName: station.name,
      frequencies: freqs
    });
  }

  /**
   * Perfil formatado para a aplicação RadioTop Premium
   */
  static getRadioTopStationInfo(req, res) {
    const { id } = req.params;
    const station = findStation(id);

    if (!station) {
      return res.status(404).json({ error: 'Emissora não encontrada' });
    }

    const normId = station.id;
    const details = stationDetails[normId] || {
      frequencies: [{ city: station.city || 'Principal', frequency: 'FM' }],
      contacts: { website: station.homepage || '' }
    };

    const genre = (station.genres && station.genres[0]) || 'pop';
    const history = HistoryService.getHistory(station.id, genre, 10);

    return res.json({
      appTarget: 'RadioTop Premium',
      id: station.id.replace(/-/g, '_'),
      name: station.name,
      frequencies: details.frequencies || [],
      contacts: details.contacts || {},
      social: details.social || {},
      schedule: details.schedule || [],
      recentTracks: history
    });
  }
}
