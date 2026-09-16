import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RadioBrowserService } from '../services/radioBrowserService.js';
import { cache } from '../services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COUNTRIES_PATH = path.join(__dirname, '../data/countries.json');
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

let staticCountries = [];
let curatedCatalog = [];

try {
  staticCountries = JSON.parse(fs.readFileSync(COUNTRIES_PATH, 'utf-8'));
  curatedCatalog = JSON.parse(fs.readFileSync(CURATED_PATH, 'utf-8'));
} catch (err) {
  console.error('Erro ao ler ficheiros estáticos em metaController:', err.message);
}

export class MetaController {
  /**
   * Obter lista de países com códigos, bandeiras e contagem de rádios
   */
  static async getCountries(req, res) {
    try {
      const { continent } = req.query;
      const globalCountries = await RadioBrowserService.getCountries();
      const countsMap = new Map();

      if (globalCountries && Array.isArray(globalCountries)) {
        for (const c of globalCountries) {
          if (c.code) countsMap.set(c.code.toUpperCase(), c.stationCount);
        }
      }

      let countries = staticCountries.map(c => ({
        code: c.code,
        name: c.name,
        namePt: c.namePt,
        continent: c.continent,
        flag: c.flag,
        stationCount: countsMap.get(c.code) || 0
      }));

      if (continent) {
        const contLower = continent.toLowerCase();
        countries = countries.filter(c => c.continent && c.continent.toLowerCase() === contLower);
      }

      countries.sort((a, b) => b.stationCount - a.stationCount);

      return res.json({
        total: countries.length,
        data: countries
      });
    } catch (err) {
      console.error('Erro em getCountries:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter países.'
      });
    }
  }

  /**
   * Obter continentes agrupados
   */
  static async getContinents(req, res) {
    try {
      const continentGroups = {};

      for (const c of staticCountries) {
        const cont = c.continent || 'Other';
        if (!continentGroups[cont]) {
          continentGroups[cont] = {
            continent: cont,
            countryCount: 0,
            countries: []
          };
        }
        continentGroups[cont].countryCount++;
        continentGroups[cont].countries.push({
          code: c.code,
          name: c.name,
          namePt: c.namePt,
          flag: c.flag
        });
      }

      const list = Object.values(continentGroups).sort((a, b) => a.continent.localeCompare(b.continent));

      return res.json({
        total: list.length,
        data: list
      });
    } catch (err) {
      console.error('Erro em getContinents:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter continentes.'
      });
    }
  }

  /**
   * Obter géneros / tags musicais mais populares
   */
  static async getGenres(req, res) {
    try {
      const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 40));
      const globalTags = await RadioBrowserService.getTopTags(limit);

      if (globalTags && globalTags.length > 0) {
        return res.json({
          total: globalTags.length,
          data: globalTags
        });
      }

      // Fallback a partir do catálogo curado
      const genreMap = {};
      for (const r of curatedCatalog) {
        for (const g of r.genres || []) {
          genreMap[g] = (genreMap[g] || 0) + 1;
        }
      }

      const genres = Object.entries(genreMap)
        .map(([name, stationCount]) => ({ name, stationCount }))
        .sort((a, b) => b.stationCount - a.stationCount);

      return res.json({
        total: genres.length,
        data: genres
      });
    } catch (err) {
      console.error('Erro em getGenres:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter géneros.'
      });
    }
  }

  /**
   * Obter idiomas mais comuns
   */
  static async getLanguages(req, res) {
    const commonLanguages = [
      { code: 'pt', name: 'Português', englishName: 'Portuguese' },
      { code: 'en', name: 'Inglês', englishName: 'English' },
      { code: 'es', name: 'Espanhol', englishName: 'Spanish' },
      { code: 'fr', name: 'Francês', englishName: 'French' },
      { code: 'de', name: 'Alemão', englishName: 'German' },
      { code: 'it', name: 'Italiano', englishName: 'Italian' },
      { code: 'lb', name: 'Luxemburguês', englishName: 'Luxembourgish' },
      { code: 'nl', name: 'Neerlandês', englishName: 'Dutch' },
      { code: 'ja', name: 'Japonês', englishName: 'Japanese' },
      { code: 'zh', name: 'Chinês', englishName: 'Chinese' },
      { code: 'ar', name: 'Árabe', englishName: 'Arabic' },
      { code: 'ru', name: 'Russo', englishName: 'Russian' }
    ];

    return res.json({
      total: commonLanguages.length,
      data: commonLanguages
    });
  }

  /**
   * Obter estatísticas globais da API
   */
  static async getStats(req, res) {
    try {
      const countries = await RadioBrowserService.getCountries();
      const totalGlobalStations = (countries || []).reduce((acc, c) => acc + (c.stationCount || 0), 0);

      return res.json({
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        stats: {
          curatedStationsCount: curatedCatalog.length,
          globalStationsAvailable: totalGlobalStations || 45000,
          supportedCountriesCount: (countries && countries.length) || staticCountries.length,
          cacheEntriesActive: cache.size()
        }
      });
    } catch (err) {
      console.error('Erro em getStats:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter estatísticas.'
      });
    }
  }
}
