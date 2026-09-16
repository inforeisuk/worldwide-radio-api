import http from 'http';
import https from 'https';
import { URL } from 'url';

export class HealthService {
  /**
   * Verificar a latência e o status de um fluxo de áudio
   */
  static async checkStreamHealth(streamUrl) {
    if (!streamUrl) {
      return { status: 'offline', error: 'URL não fornecido' };
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      let timedOut = false;

      try {
        const parsedUrl = new URL(streamUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': 'RadioHealthChecker/1.0',
            'Range': 'bytes=0-1024' // Apenas os primeiros bytes para teste rápido
          },
          timeout: 3500
        };

        const req = protocol.request(options, (res) => {
          const latencyMs = Date.now() - startTime;
          const statusCode = res.statusCode;
          const contentType = res.headers['content-type'] || 'unknown';

          res.destroy(); // Fechar conexão imediatamente

          if (statusCode >= 200 && statusCode < 400) {
            resolve({
              status: 'online',
              httpStatus: statusCode,
              latencyMs,
              contentType,
              isHls: streamUrl.toLowerCase().includes('.m3u8') || contentType.includes('mpegurl'),
              checkedAt: new Date().toISOString()
            });
          } else {
            resolve({
              status: 'unstable',
              httpStatus: statusCode,
              latencyMs,
              contentType,
              checkedAt: new Date().toISOString()
            });
          }
        });

        req.on('timeout', () => {
          timedOut = true;
          req.destroy();
          resolve({
            status: 'offline',
            error: 'Timeout após 3.5s',
            latencyMs: 3500,
            checkedAt: new Date().toISOString()
          });
        });

        req.on('error', (err) => {
          if (!timedOut) {
            resolve({
              status: 'offline',
              error: err.message,
              checkedAt: new Date().toISOString()
            });
          }
        });

        req.end();
      } catch (err) {
        resolve({
          status: 'error',
          error: err.message,
          checkedAt: new Date().toISOString()
        });
      }
    });
  }
}
