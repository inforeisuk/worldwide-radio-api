import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RadioBrowserService } from '../services/radioBrowserService.js';
import { StreamService } from '../services/streamService.js';
import { HistoryService } from '../services/historyService.js';
import { MetadataService } from '../services/metadataService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { DBService } from '../db/dbService.js';

export class RadioController {
  static async addRadio(req, res) { res.status(501).json({ error: 'Not Implemented' }); }

  /**
   * Listar rádios com paginação e filtros ricos
   */
  static async listRadios(req, res) {
    try {
      const {
        country,
        countrycode,
        continent,
        genre,
        language,
        q,
        order = 'votes',
        source = 'curated', // 'curated', 'global', 'all'
        limit = 20,
        page = 1
      } = req.query;

      let stations = [];

      if (source === 'global') {
        stations = await RadioBrowserService.searchStations({
          name: q || '',
          country: country || '',
          countrycode: countrycode || '',
          tag: genre || '',
          language: language || '',
          limit: 100,
          order: order === 'name' ? 'name' : 'votes'
        });
      } else {
        // Filtrar catálogo SQLite
        let local = await DBService.getAllRadios();

        if (country) {
          const cLower = country.toLowerCase();
          local = local.filter(r => r.country && r.country.toLowerCase().includes(cLower));
        }

        if (countrycode) {
          const codeUpper = countrycode.toUpperCase();
          local = local.filter(r => r.countryCode && r.countryCode.toUpperCase() === codeUpper);
        }

        if (continent) {
          const contLower = continent.toLowerCase();
          local = local.filter(r => r.continent && r.continent.toLowerCase() === contLower);
        }

        if (genre) {
          const gLower = genre.toLowerCase();
          local = local.filter(r => r.genres && r.genres.some(g => g.toLowerCase().includes(gLower)));
        }

        if (language) {
          const lLower = language.toLowerCase();
          local = local.filter(r => r.languages && r.languages.some(l => l.toLowerCase() === lLower));
        }

        if (q) {
          const qLower = q.trim().toLowerCase();
          local = local.filter(r =>
            r.name.toLowerCase().includes(qLower) ||
            (r.description && r.description.toLowerCase().includes(qLower)) ||
            (r.genres && r.genres.some(g => g.toLowerCase().includes(qLower))) ||
            (r.city && r.city.toLowerCase().includes(qLower))
          );
        }

        stations = local;

        // Se source for 'all' e local tiver poucos resultados ou usuário fez busca explícita, complementar
        if (source === 'all' && (q || country || countrycode || genre)) {
          const external = await RadioBrowserService.searchStations({
            name: q || '',
            country: country || '',
            countrycode: countrycode || '',
            tag: genre || '',
            language: language || '',
            limit: 50,
            order: order === 'name' ? 'name' : 'votes'
          });

          // Unir sem duplicados por nome normalizado
          const existingNames = new Set(local.map(r => r.name.toLowerCase().trim()));
          for (const ext of external) {
            if (!existingNames.has(ext.name.toLowerCase().trim())) {
              stations.push(ext);
            }
          }
        }
      }

      // Ordenação
      if (order === 'name') {
        stations.sort((a, b) => a.name.localeCompare(b.name));
      } else if (order === 'votes') {
        stations.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      }

      const total = stations.length;
      const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const offset = (parsedPage - 1) * parsedLimit;
      const paginated = stations.slice(offset, offset + parsedLimit);

      return res.json({
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1,
        count: paginated.length,
        data: paginated
      });
    } catch (err) {
      console.error('Erro em listRadios:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao processar a lista de emissoras.'
      });
    }
  }

  /**
   * Obter rádio por ID local ou UUID global
   */
  static async getRadioById(req, res) {
    try {
      const { id } = req.params;
      const local = (await DBService.getAllRadios()).find(r => r.id === id || r.id === id.toLowerCase());

      if (local) {
        return res.json({ data: local });
      }

      // Tenta buscar no Radio-Browser se parecer com UUID ou não estiver local
      const globalStation = await RadioBrowserService.getByUuid(id);
      if (globalStation) {
        return res.json({ data: globalStation });
      }

      return res.status(404).json({
        error: 'Not Found',
        message: `A emissora com identificador "${id}" não foi encontrada.`
      });
    } catch (err) {
      console.error('Erro em getRadioById:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter informações da estação.'
      });
    }
  }

  /**
   * Redirecionamento HTTP 302 direto para o áudio da estação
   */
  static async streamRadio(req, res) {
    try {
      const { id } = req.params;
      let radio = (await DBService.getAllRadios()).find(r => r.id === id || r.id === id.toLowerCase());

      if (!radio) {
        radio = await RadioBrowserService.getByUuid(id);
      }

      if (!radio || !radio.streamUrl) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Fluxo de áudio para a emissora "${id}" não foi encontrado.`
        });
      }

      return res.redirect(302, radio.streamUrl);
    } catch (err) {
      console.error('Erro em streamRadio:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Falha ao conectar ao fluxo de transmissão.'
      });
    }
  }

  /**
   * Rádio aleatória com filtros opcionais
   */
  static async getRandomRadio(req, res) {
    try {
      const { country, continent, genre } = req.query;
      let pool = [...(await DBService.getAllRadios())];

      if (country) {
        const cLower = country.toLowerCase();
        pool = pool.filter(r => r.country && r.country.toLowerCase().includes(cLower));
      }

      if (continent) {
        const contLower = continent.toLowerCase();
        pool = pool.filter(r => r.continent && r.continent.toLowerCase() === contLower);
      }

      if (genre) {
        const gLower = genre.toLowerCase();
        pool = pool.filter(r => r.genres && r.genres.some(g => g.toLowerCase().includes(gLower)));
      }

      // Se não houver no catálogo curado, buscar na rede global
      if (pool.length === 0) {
        const globalResults = await RadioBrowserService.searchStations({
          country: country || '',
          tag: genre || '',
          limit: 30
        });
        pool = globalResults;
      }

      if (pool.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Nenhuma estação encontrada com os critérios fornecidos.'
        });
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      return res.json({ data: pool[randomIndex] });
    } catch (err) {
      console.error('Erro em getRandomRadio:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao selecionar rádio aleatória.'
      });
    }
  }

  /**
   * Obter rádios mais votadas a nível mundial
   */
  static async getTopVoted(req, res) {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const stations = await RadioBrowserService.getTopVoted(limit);

      if (stations && stations.length > 0) {
        return res.json({
          total: stations.length,
          count: stations.length,
          data: stations
        });
      }

      // Fallback para rádios curadas ordenadas por votos
      const fallback = [...(await DBService.getAllRadios())]
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .slice(0, limit);

      return res.json({
        total: fallback.length,
        count: fallback.length,
        data: fallback
      });
    } catch (err) {
      console.error('Erro em getTopVoted:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter estações populares.'
      });
    }
  }

  /**
   * Pesquisa avançada unificada
   */
  static async searchRadios(req, res) {
    try {
      const { q = '', limit = 30 } = req.query;
      const query = q.trim();

      if (!query) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'O parâmetro de busca "q" é obrigatório.'
        });
      }

      const qLower = query.toLowerCase();
      const localMatches = (await DBService.getAllRadios()).filter(r =>
        r.name.toLowerCase().includes(qLower) ||
        (r.country && r.country.toLowerCase().includes(qLower)) ||
        (r.genres && r.genres.some(g => g.toLowerCase().includes(qLower))) ||
        (r.description && r.description.toLowerCase().includes(qLower))
      );

      const externalMatches = await RadioBrowserService.searchStations({
        name: query,
        limit: parseInt(limit, 10) || 30
      });

      // Deduplicação
      const localNames = new Set(localMatches.map(r => r.name.toLowerCase().trim()));
      const filteredExternal = externalMatches.filter(r => !localNames.has(r.name.toLowerCase().trim()));

      return res.json({
        query,
        total: localMatches.length + filteredExternal.length,
        curatedCount: localMatches.length,
        globalCount: filteredExternal.length,
        data: {
          curated: localMatches,
          global: filteredExternal
        }
      });
    } catch (err) {
      console.error('Erro em searchRadios:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao executar a pesquisa global.'
      });
    }
  }

  /**
   * Proxy resiliente de áudio (sem timeout, com headers CORS)
   */
  static async proxyRadio(req, res) {
    try {
      const { id } = req.params;
      let radio = (await DBService.getAllRadios()).find(r => r.id === id || r.id === id.toLowerCase());

      if (!radio) {
        radio = await RadioBrowserService.getByUuid(id);
      }

      if (!radio || !radio.streamUrl) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Fluxo de áudio para a emissora "${id}" não foi encontrado.`
        });
      }

      const candidates = [
        radio.streamUrl,
        ...(Array.isArray(radio.backupStreams) ? radio.backupStreams : [])
      ].filter(Boolean);

      StreamService.proxyStreamWithFallback(candidates, req, res);
    } catch (err) {
      console.error('Erro em proxyRadio:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }

  /**
   * Extrair metadados ao vivo (Now Playing) da transmissão
   */
  static async getNowPlaying(req, res) {
    try {
      const { id } = req.params;
      let radio = (await DBService.getAllRadios()).find(r => r.id === id || r.id === id.toLowerCase());

      if (!radio) {
        radio = await RadioBrowserService.getByUuid(id);
      }

      if (!radio || !radio.streamUrl) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Emissora "${id}" não encontrada.`
        });
      }

      const nowPlaying = await StreamService.getNowPlaying(radio.streamUrl);

      if (nowPlaying && nowPlaying.title && nowPlaying.title !== 'Emissão ao vivo') {
        HistoryService.recordTrack(radio.id, nowPlaying);
      }

      return res.json({
        id: radio.id,
        name: radio.name,
        nowPlaying
      });
    } catch (err) {
      console.error('Erro em getNowPlaying:', err);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro ao obter metadados da emissora.'
      });
    }
  }

  /**
   * Exportar playlist no formato standard M3U / M3U8 para VLC, IPTV e Smart TVs
   */
  static async exportPlaylistM3U(req, res) {
    try {
      const { country, countrycode, continent, genre, limit = 500 } = req.query;

      let stations = [...(await DBService.getAllRadios())];

      if (country) {
        const cLower = country.toLowerCase();
        stations = stations.filter(r => r.country && r.country.toLowerCase().includes(cLower));
      }
      if (countrycode) {
        const codeUpper = countrycode.toUpperCase();
        stations = stations.filter(r => r.countryCode && r.countryCode.toUpperCase() === codeUpper);
      }
      if (continent) {
        const contLower = continent.toLowerCase();
        stations = stations.filter(r => r.continent && r.continent.toLowerCase() === contLower);
      }
      if (genre) {
        const gLower = genre.toLowerCase();
        stations = stations.filter(r => r.genres && r.genres.some(g => g.toLowerCase().includes(gLower)));
      }

      // Limitar quantidade
      stations = stations.slice(0, parseInt(limit, 10));

      let m3u = '#EXTM3U\n';
      for (const r of stations) {
        const group = `${r.country || 'Global'}${r.genres?.length ? ' - ' + r.genres.join(', ') : ''}`;
        m3u += `#EXTINF:-1 tvg-id="${r.id}" tvg-name="${r.name}" tvg-logo="${r.logoUrl || ''}" group-title="${group}",${r.name}\n`;
        m3u += `${r.streamUrl}\n`;
      }

      res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="radios.m3u"');
      return res.send(m3u);
    } catch (err) {
      console.error('Erro em exportPlaylistM3U:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao gerar playlist M3U.' });
    }
  }

  /**
   * Obter rádios próximas baseadas em código de país ou geolocalização
   */
  static async getNearbyRadios(req, res) {
    try {
      const { countrycode, country, limit = 30 } = req.query;

      // Tentar detetar via query param ou headers de CDN/Cloudflare
      const detectedCode = (countrycode || req.headers['cf-ipcountry'] || req.headers['x-country-code'] || 'PT').toUpperCase();

      let local = (await DBService.getAllRadios()).filter(r => r.countryCode && r.countryCode.toUpperCase() === detectedCode);

      if (local.length < 5) {
        try {
          const external = await RadioBrowserService.searchStations({
            countrycode: detectedCode,
            limit: parseInt(limit, 10),
            order: 'votes'
          });
          const existingIds = new Set(local.map(r => r.id));
          for (const ext of external) {
            if (!existingIds.has(ext.id)) {
              local.push(ext);
            }
          }
        } catch (e) {
          console.warn('Erro ao consultar RadioBrowser para rádios próximas:', e.message);
        }
      }

      const maxLimit = parseInt(limit, 10);
      const result = local.slice(0, maxLimit);

      return res.json({
        detectedCountryCode: detectedCode,
        total: result.length,
        stations: result
      });
    } catch (err) {
      console.error('Erro em getNearbyRadios:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao obter rádios próximas.' });
    }
  }
}

