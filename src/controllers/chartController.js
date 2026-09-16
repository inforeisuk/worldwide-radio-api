import { HistoryService } from '../services/historyService.js';

export class ChartController {
  /**
   * Obter o ranking das músicas mais tocadas nas rádios (Airplay Charts)
   */
  static async getTopTracks(req, res) {
    try {
      const { country, genre, limit = 40 } = req.query;
      const data = HistoryService.getAirplayCharts({
        country,
        genre,
        limit: parseInt(limit, 10)
      });
      return res.json(data);
    } catch (err) {
      console.error('Erro em getTopTracks:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao gerar o Top 40.' });
    }
  }
}
