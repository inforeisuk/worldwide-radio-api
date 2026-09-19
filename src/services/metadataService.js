import { Parser } from 'icecast-parser';
import { cache } from './cacheService.js';

export class MetadataService {
  /**
   * Obtém a música e artista atual (Now Playing) de uma stream Icecast/Shoutcast
   */
  static getNowPlaying(streamUrl) {
    return new Promise((resolve) => {
      // Usar a cache por URL da stream (para não sobrecarregar as rádios)
      const cacheKey = `nowplaying:${streamUrl}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return resolve(cached);
      }

      const parser = new Parser({
        url: streamUrl,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        keepListen: false, 
        autoUpdate: false, 
        errorInterval: 10, 
        emptyInterval: 10, 
        metadataInterval: 5 
      });

      // Em caso de erro na extração
      parser.on('error', (err) => {
        const fallbackData = { title: null, error: err.message };
        cache.set(cacheKey, fallbackData, 1000 * 30); // 30s cache para erros
        resolve(fallbackData);
      });

      // Quando a metadata for lida com sucesso
      parser.on('metadata', (metadata) => {
        const titleString = metadata.get('StreamTitle') || null;
        let artist = null;
        let song = null;

        if (titleString) {
          // Tentar dividir em "Artista - Título" (formato padrão Icecast)
          const parts = titleString.split(' - ');
          if (parts.length >= 2) {
            artist = parts[0].trim();
            song = parts.slice(1).join(' - ').trim();
          } else {
            song = titleString.trim();
          }
        }

        const data = {
          rawTitle: titleString,
          artist,
          song
        };

        // Guardar na cache (30 segundos para aliviar tráfego)
        cache.set(cacheKey, data, 1000 * 30);
        resolve(data);
      });
      
      parser.on('empty', () => {
         const emptyData = { rawTitle: null, artist: null, song: null };
         cache.set(cacheKey, emptyData, 1000 * 30);
         resolve(emptyData);
      });
    });
  }
}
