import { LyricsService } from '../services/lyricsService.js';

export class LyricsController {
  /**
   * Pesquisar a letra da música atual
   */
  static async getSongLyrics(req, res) {
    try {
      const { artist, title } = req.query;

      if (!title) {
        return res.status(400).json({ error: 'Bad Request', message: 'O parâmetro "title" é obrigatório.' });
      }

      const result = await LyricsService.getLyrics(artist || '', title);

      if (!result || !result.lyrics) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Letra não encontrada para "${artist ? artist + ' - ' : ''}${title}".`,
          artist: artist || '',
          title
        });
      }

      return res.json(result);
    } catch (err) {
      console.error('Erro em getSongLyrics:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Erro ao buscar letra da música.' });
    }
  }
}
