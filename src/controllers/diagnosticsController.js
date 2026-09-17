import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { StreamService } from '../services/streamService.js';
import { cache } from '../services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CURATED_PATH = path.join(__dirname, '../data/curatedRadios.json');

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export class DiagnosticsController {
  /**
   * Métricas operacionais em tempo real e telemetria da API
   * GET /api/diagnostics
   */
  static getDiagnostics(req, res) {
    try {
      const memory = process.memoryUsage();
      const processUptime = process.uptime();

      let curatedCount = 0;
      try {
        const raw = fs.readFileSync(CURATED_PATH, 'utf-8');
        const list = JSON.parse(raw);
        curatedCount = Array.isArray(list) ? list.length : 0;
      } catch {
        curatedCount = 0;
      }

      const activeStreams = StreamService.getActiveStreamsCount();

      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'worldwide-radio-api',
        uptime: {
          seconds: Math.floor(processUptime),
          formatted: formatUptime(processUptime)
        },
        traffic: {
          activeStreamListeners: activeStreams,
          rateLimitActive: true
        },
        memory: {
          heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
          rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
          externalMB: Math.round((memory.external / 1024 / 1024) * 100) / 100
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          cpuCores: os.cpus().length,
          freeMemoryMB: Math.round((os.freemem() / 1024 / 1024) * 100) / 100,
          totalMemoryMB: Math.round((os.totalmem() / 1024 / 1024) * 100) / 100,
          loadAverage: os.loadavg()
        },
        catalog: {
          curatedStations: curatedCount,
          compression: 'gzip/brotli enabled',
          multiStreamFailover: 'active'
        }
      });
    } catch (err) {
      console.error('Erro em getDiagnostics:', err);
      return res.status(500).json({
        status: 'degraded',
        error: 'Internal Server Error',
        message: 'Erro ao recolher telemetria do sistema.'
      });
    }
  }
}
