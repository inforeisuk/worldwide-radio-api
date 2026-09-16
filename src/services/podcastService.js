import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PODCASTS_PATH = path.join(__dirname, '../data/stationPodcasts.json');

let podcastsCatalog = [];
try {
  podcastsCatalog = JSON.parse(fs.readFileSync(PODCASTS_PATH, 'utf-8'));
} catch (e) {
  console.warn('Erro ao carregar stationPodcasts.json:', e.message);
  podcastsCatalog = [];
}

export class PodcastService {
  /**
   * Listar todos os podcasts ou filtrar por emissora
   */
  static getPodcastsByStation(stationId) {
    if (!stationId) return podcastsCatalog;
    const cleanId = stationId.toLowerCase().trim();
    return podcastsCatalog.filter(p => p.stationId.toLowerCase() === cleanId);
  }

  /**
   * Obter detalhes e episódios de um podcast
   */
  static getPodcastById(podcastId) {
    if (!podcastId) return null;
    const cleanId = podcastId.toLowerCase().trim();
    return podcastsCatalog.find(p => p.id.toLowerCase() === cleanId) || null;
  }

  /**
   * Listar episódios recentes de todos os podcasts
   */
  static getAllLatestEpisodes(limit = 20) {
    const episodes = [];
    for (const pod of podcastsCatalog) {
      for (const ep of pod.episodes || []) {
        episodes.push({
          ...ep,
          podcastId: pod.id,
          podcastTitle: pod.title,
          stationId: pod.stationId,
          stationName: pod.stationName,
          logo: pod.logo
        });
      }
    }
    return episodes.slice(0, limit);
  }
}
