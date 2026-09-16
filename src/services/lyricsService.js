import { CacheService } from './cacheService.js';

const lyricsCache = new CacheService(); // Cache de letras em memória

export class LyricsService {
  /**
   * Pesquisar letra de uma música por Artista e Título
   */
  static async getLyrics(artist, title) {
    if (!artist || !title) return null;

    const cacheKey = `lyrics_${artist.toLowerCase()}_${title.toLowerCase()}`;
    const cached = lyricsCache.get(cacheKey);
    if (cached) return cached;

    // Limpar ruídos comuns de títulos de rádio (ex: "(Official Video)", "ft.", "feat.")
    const cleanTitle = title
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*\[[^\]]*\]/g, '')
      .replace(/ft\..*$/i, '')
      .replace(/feat\..*$/i, '')
      .trim();

    const cleanArtist = artist.trim();

    try {
      // 1. Tentar LRCLIB API pública gratuita
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.plainLyrics) {
          const result = {
            artist: data.artistName || cleanArtist,
            title: data.trackName || cleanTitle,
            lyrics: data.plainLyrics,
            syncedLyrics: data.syncedLyrics || null,
            source: 'lrclib'
          };
          lyricsCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      // Ignorar e tentar fallback
    }

    try {
      // 2. Fallback: lyrics.ovh
      const urlOvh = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      const controllerOvh = new AbortController();
      const timeoutOvh = setTimeout(() => controllerOvh.abort(), 3000);

      const resOvh = await fetch(urlOvh, { signal: controllerOvh.signal });
      clearTimeout(timeoutOvh);

      if (resOvh.ok) {
        const dataOvh = await resOvh.json();
        if (dataOvh.lyrics) {
          const result = {
            artist: cleanArtist,
            title: cleanTitle,
            lyrics: dataOvh.lyrics.trim(),
            syncedLyrics: null,
            source: 'lyrics.ovh'
          };
          lyricsCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      // Falha de ambos os serviços
    }

    return null;
  }
}
