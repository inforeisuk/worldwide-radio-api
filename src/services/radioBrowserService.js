import { config } from '../config.js';
import { cache } from './cacheService.js';

/**
 * Serviço de integração com a rede global Radio-Browser (+40.000 rádios)
 */
export class RadioBrowserService {
  /**
   * Executa uma requisição HTTP com fallback automático entre múltiplos mirrors
   */
  static async fetchFromMirrors(endpoint) {
    let lastError = null;

    for (const mirror of config.mirrors) {
      try {
        const url = `${mirror}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout);

        const res = await fetch(url, {
          headers: {
            'User-Agent': config.userAgent,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    console.warn(`Radio-Browser falhou em todos os mirrors para "${endpoint}":`, lastError?.message);
    return null;
  }

  /**
   * Mapeia os dados brutos do Radio-Browser para o modelo unificado da nossa API
   */
  static normalizeStation(item) {
    return {
      id: item.stationuuid,
      name: (item.name || 'Sem Nome').trim(),
      description: item.state ? `${item.state}, ${item.country}` : (item.country || ''),
      country: item.country || '',
      countryCode: (item.countrycode || '').toUpperCase(),
      continent: null,
      city: item.state || '',
      streamUrl: item.url_resolved || item.url,
      homepage: item.homepage || '',
      logo: item.favicon || '',
      genres: item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      languages: item.language ? item.language.split(',').map(l => l.trim().toLowerCase()).filter(Boolean) : [],
      bitrate: item.bitrate || null,
      codec: item.codec || null,
      votes: item.votes || 0,
      source: 'radio-browser'
    };
  }

  /**
   * Busca avançada de estações mundiais na rede global
   */
  static async searchStations({
    name = '',
    country = '',
    countrycode = '',
    tag = '',
    language = '',
    limit = 50,
    order = 'votes',
    reverse = 'true'
  } = {}) {
    const cacheKey = `rb:search:${name}:${country}:${countrycode}:${tag}:${language}:${limit}:${order}:${reverse}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (country) params.append('country', country);
    if (countrycode) params.append('countrycode', countrycode);
    if (tag) params.append('tag', tag);
    if (language) params.append('language', language);
    params.append('limit', String(Math.min(limit, 100)));
    params.append('order', order);
    params.append('reverse', reverse);
    params.append('hidebroken', 'true');

    const data = await this.fetchFromMirrors(`/json/stations/search?${params.toString()}`);
    if (!data || !Array.isArray(data)) return [];

    const normalized = data
      .filter(item => item.url_resolved || item.url)
      .map(this.normalizeStation);

    cache.set(cacheKey, normalized, 1000 * 60 * 10); // 10 min cache
    return normalized;
  }

  /**
   * Obter rádios mais votadas a nível mundial
   */
  static async getTopVoted(limit = 30) {
    const cacheKey = `rb:topvoted:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromMirrors(`/json/stations/topvote/${limit}`);
    if (!data || !Array.isArray(data)) return [];

    const normalized = data
      .filter(item => item.url_resolved || item.url)
      .map(this.normalizeStation);

    cache.set(cacheKey, normalized, 1000 * 60 * 30); // 30 min cache
    return normalized;
  }

  /**
   * Obter rádio específica por UUID
   */
  static async getByUuid(uuid) {
    const cacheKey = `rb:station:${uuid}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromMirrors(`/json/stations/byuuid/${uuid}`);
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const normalized = this.normalizeStation(data[0]);
    cache.set(cacheKey, normalized, 1000 * 60 * 60); // 1 hour cache
    return normalized;
  }

  /**
   * Obter lista de países e contagem de rádios
   */
  static async getCountries() {
    const cacheKey = 'rb:countries';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromMirrors('/json/countries');
    if (!data || !Array.isArray(data)) return [];

    const formatted = data
      .filter(c => c.stationcount > 0 && c.iso_3166_1)
      .map(c => ({
        name: c.name,
        code: c.iso_3166_1.toUpperCase(),
        stationCount: c.stationcount
      }))
      .sort((a, b) => b.stationCount - a.stationCount);

    cache.set(cacheKey, formatted, 1000 * 60 * 60 * 2); // 2 hours
    return formatted;
  }

  /**
   * Obter lista de tags/géneros mais populares
   */
  static async getTopTags(limit = 50) {
    const cacheKey = `rb:tags:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchFromMirrors(`/json/tags?order=stationcount&reverse=true&limit=${limit}`);
    if (!data || !Array.isArray(data)) return [];

    const formatted = data
      .filter(t => t.stationcount > 0 && t.name)
      .map(t => ({
        name: t.name,
        stationCount: t.stationcount
      }));

    cache.set(cacheKey, formatted, 1000 * 60 * 60 * 2);
    return formatted;
  }
}
