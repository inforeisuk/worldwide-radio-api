import { PodcastService } from '../services/podcastService.js';

export class PodcastController {
  /**
   * Listar podcasts de uma emissora
   */
  static async getStationPodcasts(req, res) {
    try {
      const { id } = req.params;
      const podcasts = PodcastService.getPodcastsByStation(id);
      return res.json({
        stationId: id,
        total: podcasts.length,
        podcasts
      });
    } catch (err) {
      console.error('Erro em getStationPodcasts:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao obter podcasts.' });
    }
  }

  /**
   * Listar episódios de um podcast específico
   */
  static async getPodcastEpisodes(req, res) {
    try {
      const { podcastId } = req.params;
      const podcast = PodcastService.getPodcastById(podcastId);
      if (!podcast) {
        return res.status(404).json({ error: 'Not Found', message: `Podcast "${podcastId}" não encontrado.` });
      }
      return res.json({
        id: podcast.id,
        title: podcast.title,
        stationName: podcast.stationName,
        hosts: podcast.hosts,
        category: podcast.category,
        totalEpisodes: podcast.episodes?.length || 0,
        episodes: podcast.episodes || []
      });
    } catch (err) {
      console.error('Erro em getPodcastEpisodes:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao obter episódios.' });
    }
  }

  /**
   * Listar episódios recentes de todos os podcasts
   */
  static async getLatestEpisodes(req, res) {
    try {
      const { limit = 20 } = req.query;
      const episodes = PodcastService.getAllLatestEpisodes(parseInt(limit, 10));
      return res.json({
        total: episodes.length,
        episodes
      });
    } catch (err) {
      console.error('Erro em getLatestEpisodes:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao obter episódios recentes.' });
    }
  }
}
