import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StreamService } from '../services/streamService.js';
import { cache } from '../services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { DBService } from '../db/dbService.js';

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
  static async getStations(req, res) {
    try {
      const { country, genre, search, deviceId = 'default' } = req.query;
      let stations = await DBService.getAllRadios();

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
  static async getCountries(req, res) {
    try {
      const catalog = await DBService.getAllRadios();
      const countryMap = new Map();

      for (const r of catalog) {
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
    } catch (err) {
      console.error('Erro em RadioTopController.getCountries:', err);
      return res.status(500).json({ error: 'Erro ao obter países' });
    }
  }

  /**
   * Sincronizar / Obter favoritos do utilizador RadioTop (Cloud Sync)
   */
  static async getFavorites(req, res) {
    try {
      const deviceId = req.headers['x-device-id'] || req.query.deviceId || 'default';
      const favSet = userFavoritesStore.get(deviceId) || new Set();

      const catalog = await DBService.getAllRadios();
      const stations = catalog
        .filter(r => favSet.has(r.id))
        .map(s => RadioTopController.formatForRadioTop(s, true));

      return res.json({
        deviceId,
        total: stations.length,
        favorites: stations
      });
    } catch (err) {
      console.error('Erro em RadioTopController.getFavorites:', err);
      return res.status(500).json({ error: 'Erro ao obter favoritos' });
    }
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
   * Algoritmo "Para Ti" (Machine Learning Básico)
   * Estuda o ADN musical do utilizador (baseado nos favoritos) e recomenda novas estações
   */
  static async getForYouRecommendations(req, res) {
    try {
      const deviceId = req.headers['x-device-id'] || req.query.deviceId || 'default';
      const favSet = userFavoritesStore.get(deviceId) || new Set();
      const catalog = await DBService.getAllRadios();

      // Fallback: Se não tem favoritos, devolve o Top 10 Global (Trending)
      if (favSet.size === 0) {
        const trending = catalog.slice(0, 10).map(s => RadioTopController.formatForRadioTop(s, false));
        return res.json({
          appTarget: 'RadioTop Premium',
          algorithm: 'trending_global',
          total: trending.length,
          recommendations: trending
        });
      }

      // 1. Extrair o ADN Musical (Perfil do Utilizador)
      const userProfile = { genres: {}, countries: {} };
      
      const favoriteStations = catalog.filter(r => favSet.has(r.id));
      favoriteStations.forEach(station => {
        // Peso dos países
        if (station.countryCode) {
          userProfile.countries[station.countryCode] = (userProfile.countries[station.countryCode] || 0) + 1;
        }
        // Peso dos géneros
        if (station.genres) {
          station.genres.forEach(g => {
            userProfile.genres[g] = (userProfile.genres[g] || 0) + 1;
          });
        }
      });

      // 2. Filtrar e Pontuar as restantes estações
      let recommendations = catalog
        .filter(r => !favSet.has(r.id)) // Ignorar as que já estão nos favoritos
        .map(station => {
          let score = 0;
          
          // Pontuação por país (bónus se for do mesmo país)
          if (station.countryCode && userProfile.countries[station.countryCode]) {
            score += userProfile.countries[station.countryCode] * 2; 
          }
          
          // Pontuação por género musical
          if (station.genres) {
            station.genres.forEach(g => {
              if (userProfile.genres[g]) {
                score += userProfile.genres[g] * 3;
              }
            });
          }
          
          // Fator de popularidade (tie-breaker)
          score += (station.votes || 0) * 0.001;

          return { station, score };
        });

      // 3. Ordenar por pontuação mais alta e cortar o Top 15
      recommendations.sort((a, b) => b.score - a.score);
      const topPicks = recommendations.slice(0, 15).map(item => 
        RadioTopController.formatForRadioTop(item.station, false)
      );

      return res.json({
        appTarget: 'RadioTop Premium',
        algorithm: 'collaborative_filtering',
        total: topPicks.length,
        recommendations: topPicks
      });
    } catch (err) {
      console.error('Erro no Algoritmo Para Ti:', err);
      return res.status(500).json({ error: 'Erro ao gerar recomendações inteligentes' });
    }
  }

  /**
   * Now Playing simplificado para notificações e lockscreen do RadioTop
   */
  static async getNowPlaying(req, res) {
    try {
      const { id } = req.params;
      const catalog = await DBService.getAllRadios();
      const station = catalog.find(r => r.id === id || r.id.replace(/-/g, '_') === id);

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
    } catch (err) {
      console.error('Erro em RadioTopController.getNowPlaying:', err);
      return res.status(500).json({ error: 'Erro ao obter Now Playing' });
    }
  }

  /**
   * Streaming de alta estabilidade para clientes móveis
   */
  static async streamRadio(req, res) {
    try {
      const { id } = req.params;
      const catalog = await DBService.getAllRadios();
      const station = catalog.find(r => r.id === id || r.id.replace(/-/g, '_') === id);

      if (!station || !station.streamUrl) {
        return res.status(404).json({ error: 'Stream não encontrado' });
      }

      StreamService.proxyStream(station.streamUrl, req, res);
    } catch (err) {
      console.error('Erro em RadioTopController.streamRadio:', err);
      return res.status(500).json({ error: 'Erro ao transmitir rádio' });
    }
  }

  /**
   * Árvore de navegação estruturada para Android Auto e Apple CarPlay
   * GET /api/radiotop/car/browse?node=root&deviceId=...
   */
  static async getCarBrowserTree(req, res) {
    try {
      const catalog = await DBService.getAllRadios();
      const activeNode = req.query.nodeId || req.query.node || 'root';
      const deviceId = req.query.deviceId || 'car-default';
      const userFavs = userFavoritesStore.get(deviceId) || new Set(['antena1-pt', 'rfm-pt', 'radio-comercial-pt']);

      if (activeNode === 'root') {
        const rootItems = [
          { nodeId: 'car_favorites', mediaId: 'car_favorites', title: '★ As Minhas Favoritas', subtitle: 'Estações sincronizadas no carro', icon: 'favorite', playable: false },
          { nodeId: 'car_featured', mediaId: 'car_featured', title: '🔥 Em Destaque', subtitle: 'Estações com maior audiência', icon: 'whatshot', playable: false },
          { nodeId: 'countries', mediaId: 'countries', title: '🌍 Países', subtitle: 'Navegar por país', icon: 'public', playable: false },
          { nodeId: 'car_portugal', mediaId: 'car_portugal', title: '🇵🇹 Portugal', subtitle: 'Emissoras nacionais e locais', icon: 'flag', playable: false },
          { nodeId: 'car_brazil', mediaId: 'car_brazil', title: '🇧🇷 Brasil', subtitle: 'Principais redes brasileiras', icon: 'flag', playable: false },
          { nodeId: 'car_news', mediaId: 'car_news', title: '📰 Notícias & Trânsito', subtitle: 'Informação em tempo real', icon: 'newspaper', playable: false },
          { nodeId: 'car_rock_pop', mediaId: 'car_rock_pop', title: '🎸 Pop, Rock & Anos 80', subtitle: 'Música para a viagem', icon: 'music_note', playable: false }
        ];

        return res.json({
          status: 'success',
          nodeId: 'root',
          mediaId: 'root',
          title: 'RadioTop Auto',
          playable: false,
          items: rootItems,
          children: rootItems
        });
      }

      if (activeNode === 'countries') {
        const countryItems = [
          { nodeId: 'car_portugal', mediaId: 'car_portugal', title: '🇵🇹 Portugal', subtitle: 'Emissoras de Portugal', icon: 'flag', playable: false },
          { nodeId: 'car_brazil', mediaId: 'car_brazil', title: '🇧🇷 Brasil', subtitle: 'Emissoras do Brasil', icon: 'flag', playable: false },
          { nodeId: 'car_spain', mediaId: 'car_spain', title: '🇪🇸 Espanha', subtitle: 'Emissoras de Espanha', icon: 'flag', playable: false },
          { nodeId: 'car_uk', mediaId: 'car_uk', title: '🇬🇧 Reino Unido', subtitle: 'Emissoras do Reino Unido', icon: 'flag', playable: false }
        ];

        return res.json({
          status: 'success',
          nodeId: 'countries',
          mediaId: 'countries',
          title: 'Países',
          playable: false,
          items: countryItems,
          children: countryItems
        });
      }

      let filteredStations = [];

      if (activeNode === 'car_favorites') {
        filteredStations = catalog.filter(r => userFavs.has(r.id));
        if (filteredStations.length === 0) {
          filteredStations = catalog.slice(0, 5); // Fallback amigável
        }
      } else if (activeNode === 'car_featured') {
        filteredStations = catalog.filter(r => r.isFeatured);
      } else if (activeNode === 'car_portugal') {
        filteredStations = catalog.filter(r => r.countryCode === 'PT');
      } else if (activeNode === 'car_brazil') {
        filteredStations = catalog.filter(r => r.countryCode === 'BR');
      } else if (activeNode === 'car_spain') {
        filteredStations = catalog.filter(r => r.countryCode === 'ES');
      } else if (activeNode === 'car_uk') {
        filteredStations = catalog.filter(r => r.countryCode === 'GB');
      } else if (activeNode === 'car_news') {
        filteredStations = curatedCatalog.filter(r => (r.genres || []).some(g => ['News', 'Talk', 'Politics'].includes(g)));
      } else if (activeNode === 'car_rock_pop') {
        filteredStations = curatedCatalog.filter(r => (r.genres || []).some(g => ['Rock', 'Pop', 'Classic Rock'].includes(g)));
      } else {
        filteredStations = curatedCatalog.slice(0, 10);
      }

      const items = filteredStations.map(s => ({
        nodeId: s.id,
        mediaId: s.id,
        title: s.name,
        subtitle: s.description || `${s.city || s.country} • Ao Vivo`,
        iconUri: s.logo || '',
        mediaUri: `/api/radios/${s.id}/proxy`,
        directUri: s.streamUrl,
        country: s.country,
        isFavorite: userFavs.has(s.id),
        playable: true
      }));

      return res.json({
        status: 'success',
        nodeId: activeNode,
        mediaId: activeNode,
        total: items.length,
        items,
        children: items
      });
    } catch (err) {
      console.error('Erro em getCarBrowserTree:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao gerar catálogo para o carro.' });
    }
  }
}
