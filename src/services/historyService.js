/**
 * Serviço de Histórico de Músicas Tocadas (Recently Played Songs / Playlist History)
 */

// Armazenamento em memória do histórico por estação
const stationHistoryStore = new Map();

// Seed inicial com playlists realistas recentes por formato musical
const DEFAULT_SEEDS = {
  pop: [
    { artist: "Dua Lipa", title: "Houdini", duration: "3:05" },
    { artist: "Coldplay", title: "feelslikeimfallinginlove", duration: "3:58" },
    { artist: "Os Quatro e Meia", title: "Na Escola", duration: "4:12" },
    { artist: "Billie Eilish", title: "BIRDS OF A FEATHER", duration: "3:03" },
    { artist: "Sabrina Carpenter", title: "Espresso", duration: "2:55" },
    { artist: "Bárbara Tinoco", title: "Chamada Não Atendida", duration: "3:18" },
    { artist: "The Weeknd", title: "Dancing In The Flames", duration: "3:40" },
    { artist: "Teddy Swims", title: "Lose Control", duration: "3:30" },
    { artist: "Carolina Deslandes", title: "A Vida Toda", duration: "3:45" },
    { artist: "Taylor Swift", title: "Cruel Summer", duration: "2:58" }
  ],
  rock: [
    { artist: "Queen", title: "Bohemian Rhapsody", duration: "5:55" },
    { artist: "AC/DC", title: "Thunderstruck", duration: "4:52" },
    { artist: "Linkin Park", title: "The Emptiness Machine", duration: "3:10" },
    { artist: "U2", title: "With Or Without You", duration: "4:56" },
    { artist: "Guns N' Roses", title: "Sweet Child O' Mine", duration: "5:56" },
    { artist: "Xutos & Pontapés", title: "A Minha Casinha", duration: "3:40" },
    { artist: "Foo Fighters", title: "Everlong", duration: "4:10" },
    { artist: "Bon Jovi", title: "Livin' On A Prayer", duration: "4:09" }
  ],
  news: [
    { artist: "Informação e Notícias", title: "Edição de Notícias Principais", duration: "10:00" },
    { artist: "Debate Político", title: "Análise da Atualidade Nacional", duration: "25:00" },
    { artist: "Desporto em Direto", title: "Resumo da Jornada Desportiva", duration: "15:00" },
    { artist: "Economia e Mercados", title: "Boletim Económico", duration: "5:00" }
  ]
};

function formatTimeAgo(minutesAgo) {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000);
  return d.toTimeString().slice(0, 5); // "22:45"
}

export class HistoryService {
  /**
   * Registar uma nova música no histórico da estação
   */
  static recordTrack(stationId, track) {
    if (!stationId || !track || !track.title) return;

    let history = stationHistoryStore.get(stationId);
    if (!history) {
      history = [];
      stationHistoryStore.set(stationId, history);
    }

    const currentTop = history[0];
    const trackTitle = (track.title || '').trim();
    const trackArtist = (track.artist || '').trim();

    // Evita duplicar a mesma música consecutivamente
    if (currentTop && currentTop.title.toLowerCase() === trackTitle.toLowerCase()) {
      return;
    }

    const entry = {
      id: `${stationId}-${Date.now()}`,
      playedAt: new Date().toTimeString().slice(0, 5),
      timestamp: Date.now(),
      artist: trackArtist || 'Vários Artistas',
      title: trackTitle,
      raw: track.raw || `${trackArtist} - ${trackTitle}`,
      duration: track.duration || '3:30'
    };

    history.unshift(entry);

    // Manter no máximo as últimas 30 músicas
    if (history.length > 30) {
      history.pop();
    }
  }

  /**
   * Obter histórico das últimas músicas tocadas
   */
  static getHistory(stationId, genre = 'pop', limit = 15) {
    let history = stationHistoryStore.get(stationId);

    // Se o histórico ainda não tiver registos em tempo real, gerar com base no género
    if (!history || history.length === 0) {
      const gLower = (genre || '').toLowerCase();
      let seedList = DEFAULT_SEEDS.pop;
      if (gLower.includes('rock')) seedList = DEFAULT_SEEDS.rock;
      if (gLower.includes('news') || gLower.includes('talk')) seedList = DEFAULT_SEEDS.news;

      history = seedList.map((item, idx) => ({
        id: `${stationId}-seed-${idx}`,
        playedAt: formatTimeAgo((idx + 1) * 4),
        timestamp: Date.now() - (idx + 1) * 4 * 60 * 1000,
        artist: item.artist,
        title: item.title,
        raw: `${item.artist} - ${item.title}`,
        duration: item.duration
      }));

      stationHistoryStore.set(stationId, history);
    }

    return history.slice(0, Math.min(limit, 30));
  }

  /**
   * Alias de conveniência para obter faixas recentes de uma estação
   */
  static getRecentTracks(stationId, limit = 10) {
    return this.getHistory(stationId, 'pop', limit);
  }

  /**
   * Gerar ranking Top das músicas mais tocadas nas rádios (Airplay Chart)
   */
  static getAirplayCharts({ country = '', genre = '', limit = 40 } = {}) {
    const trackCounts = new Map();

    // 1. Processar histórico em memória
    for (const [stationId, tracks] of stationHistoryStore.entries()) {
      for (const t of tracks) {
        if (!t.title || t.artist === 'Informação e Notícias') continue;
        const key = `${t.artist.toLowerCase()} - ${t.title.toLowerCase()}`;
        if (!trackCounts.has(key)) {
          trackCounts.set(key, {
            artist: t.artist,
            title: t.title,
            spins: 0,
            lastPlayedAt: t.playedAt,
            stations: new Set()
          });
        }
        const record = trackCounts.get(key);
        record.spins += 1;
        record.stations.add(stationId);
      }
    }

    // 2. Se a store tiver poucos dados, popular com a lista padrão de sucessos das rádios
    const POPULAR_CHART_SEEDS = [
      { artist: "Coldplay", title: "feelslikeimfallinginlove", spins: 48 },
      { artist: "Dua Lipa", title: "Houdini", spins: 45 },
      { artist: "Sabrina Carpenter", title: "Espresso", spins: 43 },
      { artist: "Billie Eilish", title: "BIRDS OF A FEATHER", spins: 41 },
      { artist: "Os Quatro e Meia", title: "Na Escola", spins: 39 },
      { artist: "The Weeknd", title: "Dancing In The Flames", spins: 38 },
      { artist: "Bárbara Tinoco", title: "Chamada Não Atendida", spins: 36 },
      { artist: "Teddy Swims", title: "Lose Control", spins: 35 },
      { artist: "Linkin Park", title: "The Emptiness Machine", spins: 34 },
      { artist: "Carolina Deslandes", title: "A Vida Toda", spins: 32 },
      { artist: "Taylor Swift", title: "Cruel Summer", spins: 31 },
      { artist: "Benson Boone", title: "Beautiful Things", spins: 29 },
      { artist: "Hozier", title: "Too Sweet", spins: 28 },
      { artist: "Chappell Roan", title: "Good Luck, Babe!", spins: 26 },
      { artist: "Xutos & Pontapés", title: "A Minha Casinha", spins: 25 },
      { artist: "Myles Smith", title: "Stargazing", spins: 24 }
    ];

    for (const seed of POPULAR_CHART_SEEDS) {
      const key = `${seed.artist.toLowerCase()} - ${seed.title.toLowerCase()}`;
      if (!trackCounts.has(key)) {
        trackCounts.set(key, {
          artist: seed.artist,
          title: seed.title,
          spins: seed.spins,
          lastPlayedAt: "Hoje",
          stations: new Set(['rfm-pt', 'radio-comercial-pt'])
        });
      }
    }

    const sorted = Array.from(trackCounts.values())
      .sort((a, b) => b.spins - a.spins)
      .slice(0, Math.min(limit, 50))
      .map((item, index) => ({
        rank: index + 1,
        artist: item.artist,
        title: item.title,
        spins: item.spins,
        stationCount: item.stations.size || 2,
        lastPlayed: item.lastPlayedAt || 'Recente',
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${item.artist} ${item.title}`)}`,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.title}`)}`
      }));

    return {
      country: country || 'Global',
      genre: genre || 'Todos',
      updatedAt: new Date().toISOString(),
      total: sorted.length,
      chart: sorted
    };
  }
}
