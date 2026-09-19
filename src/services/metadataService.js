import { Parser } from 'icecast-parser';
import { cache } from './cacheService.js';

export class MetadataService {
  /**
   * Pesquisa uma música na API do iTunes e devolve a capa de Alta Resolução e o link da Apple Music.
   */
  static async fetchAlbumArt(artist, song) {
    if (!artist || !song) return { albumArtUrl: null, trackUrl: null };
    
    try {
      const query = encodeURIComponent(`${artist} ${song}`);
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) return { albumArtUrl: null, trackUrl: null };
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const track = data.results[0];
        let albumArtUrl = track.artworkUrl100 || null;
        
        // Magia: Converter a capa 100x100px para Alta Resolução (600x600)
        if (albumArtUrl) {
          albumArtUrl = albumArtUrl.replace('100x100bb', '600x600bb');
        }
        
        return {
          albumArtUrl,
          trackUrl: track.trackViewUrl || null
        };
      }
      return { albumArtUrl: null, trackUrl: null };
    } catch (err) {
      console.error('Erro na integração iTunes:', err.message);
      return { albumArtUrl: null, trackUrl: null };
    }
  }

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
      parser.on('metadata', async (metadata) => {
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

        // Buscar capa do álbum no iTunes
        const appleData = await MetadataService.fetchAlbumArt(artist, song);

        const data = {
          rawTitle: titleString,
          artist,
          song,
          albumArt: appleData.albumArtUrl,
          appleMusicUrl: appleData.trackUrl
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
