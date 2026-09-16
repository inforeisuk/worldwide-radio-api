import http from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
import { cache } from './cacheService.js';

export class StreamService {
  /**
   * Encaminha o fluxo de áudio sem limites de timeout (Proxy Resiliente)
   */
  static proxyStream(targetUrl, req, res) {
    try {
      const parsed = parseUrl(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      // Desativar limites de timeout de socket
      req.setTimeout(0);
      res.setTimeout(0);

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.path,
        method: 'GET',
        headers: {
          'User-Agent': 'WorldwideRadioAPI/1.0 (Mobile/Web Player)',
          'Accept': '*/*',
          'Connection': 'keep-alive'
        }
      };

      const proxyReq = client.request(options, (proxyRes) => {
        // Tratar redirecionamentos automáticos no proxy (301, 302, 307, 308)
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          const redirectUrl = new URL(proxyRes.headers.location, targetUrl).toString();
          return StreamService.proxyStream(redirectUrl, req, res);
        }

        const contentType = proxyRes.headers['content-type'] || 'audio/mpeg';

        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'none',
          'Connection': 'keep-alive'
        });

        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.warn(`Erro no proxy de áudio para ${targetUrl}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway',
            message: 'Não foi possível conectar ao fluxo de áudio da emissora.'
          });
        }
      });

      // Fechar ligação upstream quando o utilizador desconectar o reprodutor
      req.on('close', () => {
        proxyReq.destroy();
      });

      proxyReq.end();
    } catch (err) {
      console.error('Falha geral no proxyStream:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }

  /**
   * Extrair título da música e artista através dos metadados ICY (Icecast/Shoutcast)
   */
  static async getNowPlaying(targetUrl) {
    const cacheKey = `np:${targetUrl}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return new Promise((resolve) => {
      try {
        const parsed = parseUrl(targetUrl);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.path,
          method: 'GET',
          headers: {
            'User-Agent': 'WorldwideRadioAPI/1.0',
            'Icy-MetaData': '1' // Solicita metadados no stream
          }
        };

        const timeout = setTimeout(() => {
          if (request) request.destroy();
          resolve(StreamService.emptyNowPlaying());
        }, 3500);

        const request = client.request(options, (res) => {
          // Se for redirecionamento
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            clearTimeout(timeout);
            request.destroy();
            return resolve(StreamService.getNowPlaying(res.headers.location));
          }

          const metaInt = parseInt(res.headers['icy-metaint'], 10);
          const stationName = res.headers['icy-name'] || '';

          if (!metaInt || isNaN(metaInt)) {
            clearTimeout(timeout);
            request.destroy();
            const fallback = {
              title: stationName || 'Emissão ao vivo',
              artist: '',
              raw: stationName || 'Emissão ao vivo',
              source: 'header'
            };
            cache.set(cacheKey, fallback, 1000 * 15);
            return resolve(fallback);
          }

          let bytesRead = 0;
          let metaLength = 0;
          let metaBuffer = Buffer.alloc(0);
          let readingMeta = false;

          res.on('data', (chunk) => {
            let offset = 0;

            while (offset < chunk.length) {
              if (!readingMeta) {
                const remainingAudio = metaInt - bytesRead;
                const availableAudio = chunk.length - offset;

                if (availableAudio >= remainingAudio) {
                  offset += remainingAudio;
                  bytesRead = 0;
                  readingMeta = true;

                  if (offset < chunk.length) {
                    metaLength = chunk[offset] * 16;
                    offset += 1;
                    if (metaLength === 0) {
                      readingMeta = false;
                    }
                  }
                } else {
                  bytesRead += availableAudio;
                  offset = chunk.length;
                }
              } else {
                const remainingMeta = metaLength - metaBuffer.length;
                const availableMeta = chunk.length - offset;
                const toRead = Math.min(remainingMeta, availableMeta);

                metaBuffer = Buffer.concat([metaBuffer, chunk.slice(offset, offset + toRead)]);
                offset += toRead;

                if (metaBuffer.length >= metaLength) {
                  clearTimeout(timeout);
                  request.destroy();

                  const metaString = metaBuffer.toString('utf-8');
                  const match = metaString.match(/StreamTitle='([^']*)';/);
                  let raw = match ? match[1].trim() : '';

                  let artist = '';
                  let title = raw;

                  if (raw.includes(' - ')) {
                    const parts = raw.split(' - ');
                    artist = parts[0].trim();
                    title = parts.slice(1).join(' - ').trim();
                  }

                  const result = {
                    title: title || 'Emissão ao vivo',
                    artist: artist || '',
                    raw: raw || stationName || 'Emissão ao vivo',
                    source: 'icy'
                  };

                  cache.set(cacheKey, result, 1000 * 15); // Cache por 15 segundos
                  return resolve(result);
                }
              }
            }
          });

          res.on('error', () => {
            clearTimeout(timeout);
            resolve(StreamService.emptyNowPlaying());
          });
        });

        request.on('error', () => {
          clearTimeout(timeout);
          resolve(StreamService.emptyNowPlaying());
        });

        request.end();
      } catch (err) {
        resolve(StreamService.emptyNowPlaying());
      }
    });
  }

  static emptyNowPlaying() {
    return {
      title: 'Emissão ao vivo',
      artist: '',
      raw: 'Emissão ao vivo',
      source: 'fallback'
    };
  }
}
