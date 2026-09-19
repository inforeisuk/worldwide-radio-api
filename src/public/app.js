/**
 * Worldwide Radio Explorer - Professional Web Player & RadioTop Integration
 */

// Application State
const state = {
  currentStation: null,
  isPlaying: false,
  page: 1,
  limit: 24,
  totalPages: 1,
  totalStations: 0,
  selectedContinent: '',
  selectedCountry: '',
  selectedGenre: '',
  selectedSource: 'curated',
  selectedSort: 'votes',
  searchQuery: '',
  activeTab: 'all', // 'all', 'favorites', 'recents'
  useProxy: false,
  favorites: new Set(JSON.parse(localStorage.getItem('ww_radio_favorites') || '[]')),
  recents: JSON.parse(localStorage.getItem('ww_radio_recents') || '[]'),
  countriesList: [],
  // Watchdog & Resilience
  watchdogTimer: null,
  lastPlaybackTime: 0,
  lastProgressTimestamp: Date.now(),
  reconnectAttempts: 0,
  // Sleep timer
  sleepTimerTimeout: null,
  sleepTimerInterval: null,
  sleepRemainingSeconds: 0,
  sleepInitialVolume: 0.8,
  currentLang: localStorage.getItem('ww_radio_lang') || (navigator.language.startsWith('pt') ? 'pt' : (navigator.language.startsWith('es') ? 'es' : (navigator.language.startsWith('fr') ? 'fr' : (navigator.language.startsWith('de') ? 'de' : 'en')))),
  isVoiceListening: false,
  // HLS
  hlsInstance: null,
  // Now Playing Poller & Faixa atual
  nowPlayingInterval: null,
  currentTrackTitle: '',
  loadedStations: [],
  // Web Audio Equalizer
  audioContext: null,
  audioSourceNode: null,
  eqFilters: [],
  mediaStreamDestination: null,
  // Gravador
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],
  recordStartTime: 0,
  recordTimerInterval: null,
  // Modo Carro & PWA
  carClockInterval: null,
  deferredPwaPrompt: null,
  // Despertador Rádio & Qualidade
  alarmEnabled: false,
  alarmTime: '07:30',
  alarmStation: null,
  alarmFadeSeconds: 30,
  alarmCheckInterval: null,
  alarmTriggeredToday: false,
  audioQuality: 'HQ',
  healthCheckTimer: null
};

// DOM Elements
const elements = {
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  btnVoiceSearch: document.getElementById('btn-voice-search'),
  btnLangToggle: document.getElementById('btn-lang-toggle'),
  langDropdownMenu: document.getElementById('lang-dropdown-menu'),
  currentLangText: document.getElementById('current-lang-text'),
  continentSelect: document.getElementById('continent-select'),
  countrySelect: document.getElementById('country-select'),
  sourceSelect: document.getElementById('source-select'),
  sortSelect: document.getElementById('sort-select'),
  genresContainer: document.getElementById('genres-container'),
  stationsGrid: document.getElementById('stations-grid'),
  resultsCount: document.getElementById('results-count'),
  resultsTitle: document.getElementById('results-title'),
  loadingSpinner: document.getElementById('loading-spinner'),
  btnRandomRadio: document.getElementById('btn-random-radio'),
  pagination: document.getElementById('pagination'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  pageIndicator: document.getElementById('page-indicator'),
  favCounter: document.getElementById('fav-counter'),
  // Stats
  statTotalStations: document.getElementById('stat-total-stations'),
  statCountries: document.getElementById('stat-countries'),
  // Header Actions
  btnTopCharts: document.getElementById('btn-top-charts'),
  btnArtistRadar: document.getElementById('btn-artist-radar'),
  btnAlarm: document.getElementById('btn-alarm'),
  btnCarMode: document.getElementById('btn-car-mode'),
  btnExportM3U: document.getElementById('btn-export-m3u'),
  btnInstallPwa: document.getElementById('btn-install-pwa'),
  btnNearby: document.getElementById('btn-nearby'),
  // Player Elements
  audioPlayer: document.getElementById('audio-player'),
  btnPlayPause: document.getElementById('btn-play-pause'),
  playIcon: document.getElementById('play-icon'),
  pauseIcon: document.getElementById('pause-icon'),
  playerLogo: document.getElementById('player-logo'),
  playerName: document.getElementById('player-name'),
  playerCountryGenre: document.getElementById('player-country-genre'),
  playerStatus: document.getElementById('player-status'),
  playerVisualizer: document.getElementById('player-visualizer'),
  playerHealthBadge: document.getElementById('player-health-badge'),
  volumeSlider: document.getElementById('volume-slider'),
  btnPlayerFav: document.getElementById('btn-player-fav'),
  btnToggleProxy: document.getElementById('btn-toggle-proxy'),
  btnCopyStream: document.getElementById('btn-copy-stream'),
  btnQualityMode: document.getElementById('btn-quality-mode'),
  qualityLabel: document.getElementById('quality-label'),
  // Shazam Identify & Share
  btnIdentify: document.getElementById('btn-identify'),
  identifyModal: document.getElementById('identify-modal'),
  identifyLoading: document.getElementById('identify-loading'),
  identifyResult: document.getElementById('identify-result'),
  identifyTitle: document.getElementById('identify-title'),
  identifyArtist: document.getElementById('identify-artist'),
  identifyStation: document.getElementById('identify-station'),
  identifySpotify: document.getElementById('identify-spotify'),
  identifyYoutube: document.getElementById('identify-youtube'),
  identifyLyricsBtn: document.getElementById('identify-lyrics-btn'),
  btnCloseIdentify: document.getElementById('btn-close-identify'),
  btnShare: document.getElementById('btn-share'),
  shareModal: document.getElementById('share-modal'),
  shareStationName: document.getElementById('share-station-name'),
  shareQrcodeContainer: document.getElementById('share-qrcode-container'),
  shareLinkInput: document.getElementById('share-link-input'),
  btnCopyShareLink: document.getElementById('btn-copy-share-link'),
  shareWhatsapp: document.getElementById('share-whatsapp'),
  shareTelegram: document.getElementById('share-telegram'),
  btnCloseShare: document.getElementById('btn-close-share'),
  // Artist Radar Modal
  radarModal: document.getElementById('radar-modal'),
  radarArtistInput: document.getElementById('radar-artist-input'),
  btnRadarSearch: document.getElementById('btn-radar-search'),
  radarResultsList: document.getElementById('radar-results-list'),
  btnCloseRadar: document.getElementById('btn-close-radar'),
  // Now Playing & Ações Rápidas
  nowPlayingStrip: document.getElementById('now-playing-strip'),
  npText: document.getElementById('np-text'),
  npActions: document.getElementById('np-actions'),
  npSpotifyBtn: document.getElementById('np-spotify-btn'),
  npYoutubeBtn: document.getElementById('np-youtube-btn'),
  npLyricsBtn: document.getElementById('np-lyrics-btn'),
  // Gravador & Equalizador
  btnRecord: document.getElementById('btn-record'),
  recLabel: document.getElementById('rec-label'),
  btnEqualizer: document.getElementById('btn-equalizer'),
  eqModal: document.getElementById('eq-modal'),
  btnCloseEq: document.getElementById('btn-close-eq'),
  btnResetEq: document.getElementById('btn-reset-eq'),
  eqPresetsList: document.getElementById('eq-presets-list'),
  // Modo Carro
  carModeOverlay: document.getElementById('car-mode-overlay'),
  btnExitCarMode: document.getElementById('btn-exit-car-mode'),
  carClock: document.getElementById('car-clock'),
  carStationLogo: document.getElementById('car-station-logo'),
  carStationName: document.getElementById('car-station-name'),
  carStationMeta: document.getElementById('car-station-meta'),
  carNowPlayingTitle: document.getElementById('car-now-playing-title'),
  btnCarPrev: document.getElementById('btn-car-prev'),
  btnCarPlay: document.getElementById('btn-car-play'),
  carPlayIcon: document.getElementById('car-play-icon'),
  carPauseIcon: document.getElementById('car-pause-icon'),
  btnCarNext: document.getElementById('btn-car-next'),
  carVolumeSlider: document.getElementById('car-volume-slider'),
  // Despertador Rádio Modal
  alarmModal: document.getElementById('alarm-modal'),
  alarmTimeInput: document.getElementById('alarm-time-input'),
  alarmStationName: document.getElementById('alarm-station-name'),
  alarmFadeSelect: document.getElementById('alarm-fade-select'),
  alarmStatusBanner: document.getElementById('alarm-status-banner'),
  alarmStatusText: document.getElementById('alarm-status-text'),
  btnToggleAlarm: document.getElementById('btn-toggle-alarm'),
  btnCancelAlarm: document.getElementById('btn-cancel-alarm'),
  btnCloseAlarm: document.getElementById('btn-close-alarm'),
  // Top 40 Charts Modal
  chartsModal: document.getElementById('charts-modal'),
  chartsList: document.getElementById('charts-list'),
  btnCloseCharts: document.getElementById('btn-close-charts'),
  // Letras Modal
  lyricsModal: document.getElementById('lyrics-modal'),
  lyricsTitle: document.getElementById('lyrics-title'),
  lyricsArtist: document.getElementById('lyrics-artist'),
  lyricsContent: document.getElementById('lyrics-content'),
  btnCloseLyrics: document.getElementById('btn-close-lyrics'),
  // Sleep Timer
  btnSleepTimer: document.getElementById('btn-sleep-timer'),
  sleepBadge: document.getElementById('sleep-badge'),
  sleepMenu: document.getElementById('sleep-menu'),
  toast: document.getElementById('toast'),
  // Modal de Detalhes da Emissora (estilo radios-online.pt)
  btnPlayerInfo: document.getElementById('btn-player-info'),
  stationModal: document.getElementById('station-modal'),
  modalName: document.getElementById('modal-name'),
  modalLogo: document.getElementById('modal-logo'),
  modalSlogan: document.getElementById('modal-slogan'),
  modalAboutText: document.getElementById('modal-about-text'),
  modalTracksList: document.getElementById('modal-tracks-list'),
  modalFrequenciesList: document.getElementById('modal-frequencies-list'),
  modalScheduleList: document.getElementById('modal-schedule-list'),
  modalPodcastsList: document.getElementById('modal-podcasts-list'),
  modalContactsInfo: document.getElementById('modal-contacts-info'),
  btnCloseModal: document.getElementById('btn-close-modal')
};

// Country ISO to Emoji Flag helper
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const DEFAULT_LOGO = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%20width=%2280%22%20height=%2280%22><rect width=%2280%22 height=%2280%22 fill=%22%231e293b%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2232%22 fill=%22%2394a3b8%22>📻</text></svg>";

/* ==========================================================================
   Internacionalização (i18n) - PT, EN, ES, FR, DE
   ========================================================================== */
const translations = {
  pt: {
    title: 'Worldwide Radio PRO',
    tagline: 'Streaming global resiliente & integração RadioTop Premium',
    stationsGlobal: 'Emissoras Globais',
    countriesSupported: 'Países Suportados',
    antiDropMode: 'Modo Anti-Queda',
    allStations: '🌍 Todas as Estações',
    myFavorites: '⭐ Minhas Favoritas',
    recentlyPlayed: '🕒 Ouvidas Recentemente',
    searchPlaceholder: 'Pesquisar por nome da rádio, país, cidade ou género...',
    voiceSearchTitle: 'Falar para pesquisar (Comando de Voz)',
    voiceListening: '🎙️ A ouvir... Diga o nome da rádio, país ou género',
    voiceError: 'Erro no reconhecimento de voz:',
    voiceNotSupported: 'O seu navegador não suporta pesquisa por voz.',
    random: 'Aleatória',
    topCharts: 'Top 40',
    radar: 'Radar Artistas',
    alarm: 'Alarme',
    m3uPlaylist: 'Playlist M3U',
    installApp: 'Instalar',
    ready: 'Pronto',
    loading: 'A carregar...',
    playing: 'No Ar',
    shazamIdentify: 'Identificar Música em Direto (Shazam)',
    shazamTitle: 'Música Reconhecida',
    shazamAnalyzing: 'A analisar áudio da transmissão...',
    shazamNoTrack: 'Nenhuma faixa identificada de momento',
    share: 'Partilhar Rádio',
    shareTitle: 'Ouvir Comigo',
    sharePrompt: 'Aponta a câmara do telemóvel para ouvir instantaneamente',
    shareCopied: 'Link copiado para a área de transferência!',
    viewLyrics: 'Ver Letra',
    sleepTimerTitle: 'Desligar áudio em:',
    sleepTimerOff: 'Desativado',
    sleepTimerActive: 'A rádio desligará em {m} minutos com fade-out suave.',
    sleepTimerGoodnight: '⏰ Sleep Timer: Rádio desligada suavemente. Boa noite!',
    radarTitle: 'Radar de Artistas Favoritos',
    radarPlaceholder: 'Ex: Coldplay, Dua Lipa, Bárbara Tinoco...',
    radarSearch: 'Procurar',
    radarNowPlayingHeading: 'Artistas a tocar agora nas principais rádios:',
    radarNotFound: 'Nenhuma rádio a tocar este artista no momento. O radar continua ativo!'
  },
  en: {
    title: 'Worldwide Radio PRO',
    tagline: 'Resilient global radio streaming & RadioTop Premium integration',
    stationsGlobal: 'Global Stations',
    countriesSupported: 'Supported Countries',
    antiDropMode: 'Anti-Drop Mode',
    allStations: '🌍 All Stations',
    myFavorites: '⭐ My Favorites',
    recentlyPlayed: '🕒 Recently Played',
    searchPlaceholder: 'Search by radio name, country, city, or genre...',
    voiceSearchTitle: 'Speak to search (Voice Command)',
    voiceListening: '🎙️ Listening... Say a radio station, country or genre',
    voiceError: 'Voice recognition error:',
    voiceNotSupported: 'Your browser does not support voice search.',
    random: 'Random',
    topCharts: 'Top 40',
    radar: 'Artist Radar',
    alarm: 'Alarm',
    m3uPlaylist: 'M3U Playlist',
    installApp: 'Install',
    ready: 'Ready',
    loading: 'Loading...',
    playing: 'On Air',
    shazamIdentify: 'Identify Live Track (Shazam)',
    shazamTitle: 'Track Identified',
    shazamAnalyzing: 'Analyzing audio stream...',
    shazamNoTrack: 'No track recognized at this moment',
    share: 'Share Station',
    shareTitle: 'Listen With Me',
    sharePrompt: 'Point your phone camera to listen instantly',
    shareCopied: 'Link copied to clipboard!',
    viewLyrics: 'View Lyrics',
    sleepTimerTitle: 'Turn off audio in:',
    sleepTimerOff: 'Disabled',
    sleepTimerActive: 'Radio will turn off in {m} minutes with gentle fade-out.',
    sleepTimerGoodnight: '⏰ Sleep Timer: Radio faded out and stopped. Good night!',
    radarTitle: 'Favorite Artists Radar',
    radarPlaceholder: 'E.g.: Coldplay, Dua Lipa, The Weeknd...',
    radarSearch: 'Search',
    radarNowPlayingHeading: 'Artists currently playing on top stations:',
    radarNotFound: 'No radio playing this artist right now. The radar remains active!'
  },
  es: {
    title: 'Worldwide Radio PRO',
    tagline: 'Streaming global resiliente e integración RadioTop Premium',
    stationsGlobal: 'Emisoras Globales',
    countriesSupported: 'Países Soportados',
    antiDropMode: 'Modo Anti-Caída',
    allStations: '🌍 Todas las Estaciones',
    myFavorites: '⭐ Mis Favoritas',
    recentlyPlayed: '🕒 Escuchadas Recientes',
    searchPlaceholder: 'Buscar por nombre de radio, país, ciudad o género...',
    voiceSearchTitle: 'Hablar para buscar (Comando de Voz)',
    voiceListening: '🎙️ Escuchando... Di una radio, país o género',
    voiceError: 'Error en reconocimiento de voz:',
    voiceNotSupported: 'Su navegador no soporta búsqueda por voz.',
    random: 'Aleatoria',
    topCharts: 'Top 40',
    radar: 'Radar Artistas',
    alarm: 'Alarma',
    m3uPlaylist: 'Lista M3U',
    installApp: 'Instalar',
    ready: 'Listo',
    loading: 'Cargando...',
    playing: 'En el Aire',
    shazamIdentify: 'Identificar Canción en Directo (Shazam)',
    shazamTitle: 'Canción Reconocida',
    shazamAnalyzing: 'Analizando audio de la transmisión...',
    shazamNoTrack: 'Ninguna pista identificada en este momento',
    share: 'Compartir Radio',
    shareTitle: 'Escucha Conmigo',
    sharePrompt: 'Apunta la cámara del móvil para escuchar al instante',
    shareCopied: '¡Enlace copiado al portapapeles!',
    viewLyrics: 'Ver Letra',
    sleepTimerTitle: 'Apagar audio en:',
    sleepTimerOff: 'Desactivado',
    sleepTimerActive: 'La radio se apagará en {m} minutos con fade-out suave.',
    sleepTimerGoodnight: '⏰ Sleep Timer: Radio apagada suavemente. ¡Buenas noches!',
    radarTitle: 'Radar de Artistas Favoritos',
    radarPlaceholder: 'Ej: Coldplay, Rosalía, Bad Bunny...',
    radarSearch: 'Buscar',
    radarNowPlayingHeading: 'Artistas sonando ahora en emisoras top:',
    radarNotFound: 'Ninguna emisora transmitiendo a este artista ahora.'
  },
  fr: {
    title: 'Worldwide Radio PRO',
    tagline: 'Streaming mondial résilient & intégration RadioTop Premium',
    stationsGlobal: 'Radios Mondiales',
    countriesSupported: 'Pays Supportés',
    antiDropMode: 'Mode Anti-Coupure',
    allStations: '🌍 Toutes les Radios',
    myFavorites: '⭐ Mes Favorites',
    recentlyPlayed: '🕒 Récemment Écoutées',
    searchPlaceholder: 'Rechercher par nom de radio, pays, ville ou genre...',
    voiceSearchTitle: 'Recherche vocale',
    voiceListening: '🎙️ Écoute en cours... Dites une radio, pays ou genre',
    voiceError: 'Erreur de reconnaissance vocale:',
    voiceNotSupported: 'Votre navigateur ne prend pas en charge la recherche vocale.',
    random: 'Aléatoire',
    topCharts: 'Top 40',
    radar: 'Radar Artistes',
    alarm: 'Alarme',
    m3uPlaylist: 'Playlist M3U',
    installApp: 'Installer',
    ready: 'Prêt',
    loading: 'Chargement...',
    playing: 'En Direct',
    shazamIdentify: 'Identifier la musique en direct (Shazam)',
    shazamTitle: 'Titre Reconnu',
    shazamAnalyzing: 'Analyse du flux audio...',
    shazamNoTrack: 'Aucun titre reconnu en ce moment',
    share: 'Partager Radio',
    shareTitle: 'Écoute Avec Moi',
    sharePrompt: 'Scannez avec votre téléphone pour écouter immédiatement',
    shareCopied: 'Lien copié dans le presse-papiers !',
    viewLyrics: 'Voir Paroles',
    sleepTimerTitle: 'Éteindre la radio dans :',
    sleepTimerOff: 'Désactivé',
    sleepTimerActive: 'La radio s\'éteindra dans {m} minutes avec fondu sonore.',
    sleepTimerGoodnight: '⏰ Sleep Timer : Radio éteinte en douceur. Bonne nuit !',
    radarTitle: 'Radar des Artistes Favoris',
    radarPlaceholder: 'Ex: Stromae, Daft Punk, Coldplay...',
    radarSearch: 'Chercher',
    radarNowPlayingHeading: 'Artistes diffusés actuellement :',
    radarNotFound: 'Aucune radio ne diffuse cet artiste en ce moment.'
  },
  de: {
    title: 'Worldwide Radio PRO',
    tagline: 'Globales resilient Radio-Streaming & RadioTop Premium Integration',
    stationsGlobal: 'Globale Radiosender',
    countriesSupported: 'Unterstützte Länder',
    antiDropMode: 'Anti-Abbruch-Modus',
    allStations: '🌍 Alle Sender',
    myFavorites: '⭐ Meine Favoriten',
    recentlyPlayed: '🕒 Zuletzt Gehört',
    searchPlaceholder: 'Nach Sender, Land, Stadt oder Genre suchen...',
    voiceSearchTitle: 'Sprachsuche (Sprachbefehl)',
    voiceListening: '🎙️ Höre zu... Nennen Sie einen Sender, Land oder Genre',
    voiceError: 'Fehler bei der Spracherkennung:',
    voiceNotSupported: 'Ihr Browser unterstützt keine Sprachsuche.',
    random: 'Zufall',
    topCharts: 'Top 40',
    radar: 'Künstler-Radar',
    alarm: 'Wecker',
    m3uPlaylist: 'M3U Wiedergabeliste',
    installApp: 'Installieren',
    ready: 'Bereit',
    loading: 'Laden...',
    playing: 'Auf Sendung',
    shazamIdentify: 'Lied live erkennen (Shazam)',
    shazamTitle: 'Erkannter Titel',
    shazamAnalyzing: 'Audio-Stream wird analysiert...',
    shazamNoTrack: 'Derzeit kein Titel erkannt',
    share: 'Sender Teilen',
    shareTitle: 'Mit Mir Hören',
    sharePrompt: 'Mit Smartphone-Kamera scannen für Sofort-Wiedergabe',
    shareCopied: 'Link in Zwischenablage kopiert!',
    viewLyrics: 'Songtext',
    sleepTimerTitle: 'Radio ausschalten in:',
    sleepTimerOff: 'Deaktiviert',
    sleepTimerActive: 'Radio schaltet sich in {m} Minuten mit Sanftem Ausblenden ab.',
    sleepTimerGoodnight: '⏰ Sleep Timer: Radio sanft beendet. Gute Nacht!',
    radarTitle: 'Lieblingskünstler-Radar',
    radarPlaceholder: 'Z.B.: Rammstein, Coldplay, Robin Schulz...',
    radarSearch: 'Suchen',
    radarNowPlayingHeading: 'Künstler, die jetzt auf Top-Sendern laufen:',
    radarNotFound: 'Kein Sender spielt diesen Künstler im Moment.'
  }
};

function setLanguage(lang) {
  if (!translations[lang]) lang = 'pt';
  state.currentLang = lang;
  localStorage.setItem('ww_radio_lang', lang);
  if (elements.currentLangText) elements.currentLangText.textContent = lang.toUpperCase();
  const t = translations[lang];

  if (elements.searchInput) elements.searchInput.placeholder = t.searchPlaceholder;
  if (elements.btnVoiceSearch) elements.btnVoiceSearch.title = t.voiceSearchTitle;
  if (elements.btnIdentify) elements.btnIdentify.title = t.shazamIdentify;
  if (elements.btnShare) elements.btnShare.title = t.share;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
}

function initI18n() {
  if (elements.btnLangToggle && elements.langDropdownMenu) {
    elements.btnLangToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.langDropdownMenu.style.display = elements.langDropdownMenu.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', () => {
      if (elements.langDropdownMenu) elements.langDropdownMenu.style.display = 'none';
    });

    elements.langDropdownMenu.querySelectorAll('.lang-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = opt.dataset.lang;
        setLanguage(selectedLang);
        elements.langDropdownMenu.style.display = 'none';
        showToast(`🌐 Idioma alterado para ${opt.textContent}`);
      });
    });
  }

  setLanguage(state.currentLang);
}

/* ==========================================================================
   Pesquisa e Controlo por Voz (Web Speech API)
   ========================================================================== */
function initVoiceSearch() {
  if (!elements.btnVoiceSearch) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.btnVoiceSearch.addEventListener('click', () => {
      const t = translations[state.currentLang] || translations.pt;
      showToast(t.voiceNotSupported);
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  elements.btnVoiceSearch.addEventListener('click', () => {
    if (state.isVoiceListening) {
      recognition.stop();
      return;
    }

    const langCodes = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
    recognition.lang = langCodes[state.currentLang] || 'pt-PT';

    try {
      recognition.start();
      state.isVoiceListening = true;
      elements.btnVoiceSearch.classList.add('listening');
      const t = translations[state.currentLang] || translations.pt;
      showToast(t.voiceListening);
    } catch (e) {
      console.warn('SpeechRecognition error:', e);
    }
  });

  recognition.onresult = (event) => {
    state.isVoiceListening = false;
    elements.btnVoiceSearch.classList.remove('listening');
    if (event.results && event.results[0] && event.results[0][0]) {
      const spokenText = event.results[0][0].transcript.trim();
      elements.searchInput.value = spokenText;
      state.searchQuery = spokenText;
      state.page = 1;
      fetchStations();
      showToast(`🎙️ "${spokenText}"`);
    }
  };

  recognition.onerror = (event) => {
    state.isVoiceListening = false;
    elements.btnVoiceSearch.classList.remove('listening');
    const t = translations[state.currentLang] || translations.pt;
    if (event.error !== 'no-speech') {
      showToast(`${t.voiceError} ${event.error}`);
    }
  };

  recognition.onend = () => {
    state.isVoiceListening = false;
    elements.btnVoiceSearch.classList.remove('listening');
  };
}

/* ==========================================================================
   Identificador Musical Estilo Shazam (GET /api/radios/:id/identify)
   ========================================================================== */
function initShazam() {
  if (elements.btnIdentify) {
    elements.btnIdentify.addEventListener('click', identifyLiveTrack);
  }
  if (elements.btnCloseIdentify) {
    elements.btnCloseIdentify.addEventListener('click', () => {
      elements.identifyModal.style.display = 'none';
    });
  }
  if (elements.identifyModal) {
    elements.identifyModal.addEventListener('click', (e) => {
      if (e.target === elements.identifyModal) elements.identifyModal.style.display = 'none';
    });
  }
}

async function identifyLiveTrack() {
  if (!state.currentStation) {
    showToast('Selecione uma rádio para identificar a música.');
    return;
  }

  elements.identifyModal.style.display = 'flex';
  elements.identifyStation.textContent = state.currentStation.name;
  elements.identifyLoading.style.display = 'block';
  elements.identifyResult.style.display = 'none';

  try {
    const res = await fetch(`/api/radios/${state.currentStation.id}/identify`);
    const data = await res.json();

    elements.identifyLoading.style.display = 'none';
    elements.identifyResult.style.display = 'block';

    if (data.status === 'success' && data.identification) {
      const info = data.identification;
      elements.identifyTitle.textContent = info.track || 'Faixa Identificada';
      elements.identifyArtist.textContent = info.artist || 'Artista Desconhecido';

      const spotifyUrl = info.streamingLinks?.spotify || `https://open.spotify.com/search/${encodeURIComponent(info.artist + ' ' + info.track)}`;
      const youtubeUrl = info.streamingLinks?.youtube || `https://www.youtube.com/results?search_query=${encodeURIComponent(info.artist + ' ' + info.track)}`;
      
      elements.identifySpotify.href = spotifyUrl;
      elements.identifyYoutube.href = youtubeUrl;

      elements.identifyLyricsBtn.onclick = () => {
        elements.identifyModal.style.display = 'none';
        openLyricsModal(info.artist, info.track);
      };
    } else {
      elements.identifyTitle.textContent = 'Música não identificada';
      elements.identifyArtist.textContent = 'Transmissão ao vivo / Locução comercial';
      elements.identifySpotify.href = '#';
      elements.identifyYoutube.href = '#';
    }
  } catch (err) {
    elements.identifyLoading.style.display = 'none';
    elements.identifyResult.style.display = 'block';
    elements.identifyTitle.textContent = 'Erro na identificação';
    elements.identifyArtist.textContent = 'Tente novamente em instantes';
  }
}

/* ==========================================================================
   Partilha Social "Ouvir Comigo" & QR Code SVG
   ========================================================================== */
function initShare() {
  if (elements.btnShare) {
    elements.btnShare.addEventListener('click', openShareModal);
  }
  if (elements.btnCloseShare) {
    elements.btnCloseShare.addEventListener('click', () => {
      elements.shareModal.style.display = 'none';
    });
  }
  if (elements.shareModal) {
    elements.shareModal.addEventListener('click', (e) => {
      if (e.target === elements.shareModal) elements.shareModal.style.display = 'none';
    });
  }
  if (elements.btnCopyShareLink) {
    elements.btnCopyShareLink.addEventListener('click', copyShareLink);
  }
}

function openShareModal() {
  const station = state.currentStation || state.loadedStations[0];
  if (!station) {
    showToast('Nenhuma rádio selecionada para partilhar.');
    return;
  }

  elements.shareModal.style.display = 'flex';
  elements.shareStationName.textContent = `${station.name} (${station.country})`;

  const shareUrl = `${window.location.origin}${window.location.pathname}?station=${encodeURIComponent(station.id)}`;
  elements.shareLinkInput.value = shareUrl;

  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=0f172a&qzone=2`;
  elements.shareQrcodeContainer.innerHTML = `<img src="${qrImgUrl}" alt="QR Code ${station.name}" width="180" height="180" style="border-radius: 8px; display: block;" onerror="this.outerHTML='<p style=\\'color:#1e293b;padding:20px;font-size:0.8rem;\\'>${shareUrl}</p>'">`;

  const shareText = `Ouve comigo a rádio ${station.name} na Worldwide Radio PRO! 📻🎶`;
  elements.shareWhatsapp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
  elements.shareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
}

function copyShareLink() {
  if (!elements.shareLinkInput) return;
  navigator.clipboard.writeText(elements.shareLinkInput.value).then(() => {
    showToast('🔗 Link copiado para a área de transferência!');
  }).catch(() => {
    elements.shareLinkInput.select();
    document.execCommand('copy');
    showToast('🔗 Link copiado!');
  });
}

/* ==========================================================================
   Radar de Artistas Favoritos (/api/radiotop/artists/...)
   ========================================================================== */
function initArtistRadar() {
  if (elements.btnArtistRadar) {
    elements.btnArtistRadar.addEventListener('click', openRadarModal);
  }
  if (elements.btnCloseRadar) {
    elements.btnCloseRadar.addEventListener('click', () => {
      elements.radarModal.style.display = 'none';
    });
  }
  if (elements.radarModal) {
    elements.radarModal.addEventListener('click', (e) => {
      if (e.target === elements.radarModal) elements.radarModal.style.display = 'none';
    });
  }
  if (elements.btnRadarSearch) {
    elements.btnRadarSearch.addEventListener('click', () => {
      searchArtistRadar(elements.radarArtistInput.value);
    });
  }
  if (elements.radarArtistInput) {
    elements.radarArtistInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchArtistRadar(elements.radarArtistInput.value);
      }
    });
  }
}

async function openRadarModal() {
  elements.radarModal.style.display = 'flex';
  elements.radarResultsList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">A consultar emissoras ao vivo...</div>';

  try {
    const res = await fetch('/api/radiotop/artists/now-playing');
    const data = await res.json();
    if (data.status === 'success' && data.nowPlaying && data.nowPlaying.length > 0) {
      renderRadarStations(data.nowPlaying, 'Artistas a tocar agora nas principais rádios:');
    } else {
      elements.radarResultsList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">Insira o nome de um artista para verificar onde está a tocar.</div>';
    }
  } catch (e) {
    elements.radarResultsList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">Insira o nome de um artista para procurar no radar.</div>';
  }
}

async function searchArtistRadar(query) {
  if (!query || !query.trim()) return;
  elements.radarResultsList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--accent-cyan);">📡 A fazer varrimento de frequências mundiais...</div>';

  try {
    const res = await fetch('/api/radiotop/artists/radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artists: [query.trim()] })
    });
    const data = await res.json();
    if (data.status === 'success' && data.matches && data.matches.length > 0) {
      renderRadarStations(data.matches, `Encontradas ${data.matches.length} emissora(s) a tocar "${query}":`);
    } else {
      elements.radarResultsList.innerHTML = `
        <div style="text-align:center; padding: 30px; color: var(--text-secondary);">
          <span style="font-size: 2rem;">📡</span>
          <p style="margin-top: 10px; font-weight: 600; color: #fff;">Nenhuma rádio a tocar "${query}" neste instante exato.</p>
          <p style="font-size: 0.85rem; margin-top: 6px;">O radar continuará atento. Tente também artistas populares como Coldplay, Dua Lipa ou The Weeknd.</p>
        </div>
      `;
    }
  } catch (err) {
    elements.radarResultsList.innerHTML = '<div style="text-align:center; padding: 20px; color: #ef4444;">Erro ao consultar o radar de artistas.</div>';
  }
}

function renderRadarStations(stations, headingText) {
  let html = `<div style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 600; margin-bottom: 10px;">${headingText}</div>`;
  stations.forEach(item => {
    const flag = getFlagEmoji(item.countryCode || (item.country === 'Portugal' ? 'PT' : (item.country === 'Spain' ? 'ES' : (item.country === 'United Kingdom' ? 'GB' : ''))));
    const track = item.track || item.currentTrack || 'Música em direto';
    const artist = item.artist ? ` - ${item.artist}` : '';
    const logo = item.logo || item.favicon || DEFAULT_LOGO;
    html += `
      <div class="radar-station-card">
        <div class="radar-station-info">
          <img src="${logo}" class="radar-station-logo" onerror="this.src='${DEFAULT_LOGO}'" alt="${item.stationName}">
          <div>
            <div class="radar-track-title">🎵 ${track}${artist}</div>
            <div class="radar-station-name">${flag} ${item.stationName} (${item.country || 'Global'})</div>
          </div>
        </div>
        <button class="btn-radar-tune" data-station-id="${item.stationId}">▶ Sintonizar</button>
      </div>
    `;
  });
  elements.radarResultsList.innerHTML = html;

  elements.radarResultsList.querySelectorAll('.btn-radar-tune').forEach(btn => {
    btn.addEventListener('click', async () => {
      const stId = btn.dataset.stationId;
      try {
        const res = await fetch(`/api/radios/${stId}`);
        if (res.ok) {
          const { station } = await res.json();
          if (station) {
            elements.radarModal.style.display = 'none';
            playStation(station);
            showToast(`📻 Sintonizada: ${station.name}`);
          }
        }
      } catch (e) {
        console.error('Erro ao sintonizar rádio do radar:', e);
      }
    });
  });
}

/* ==========================================================================
   Deep Linking (?station=...)
   ========================================================================== */
function handleDeepLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const stationId = urlParams.get('station');
  if (stationId) {
    fetch(`/api/radios/${encodeURIComponent(stationId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.station) {
          playStation(data.station);
          showToast(`📻 Sintonizando deep link: ${data.station.name}`);
        }
      })
      .catch(err => console.warn('Deep link error:', err));
  }
}

/**
 * Inicialização
 */
async function init() {
  updateFavCounter();
  initI18n();
  initVoiceSearch();
  initShazam();
  initShare();
  initArtistRadar();
  handleDeepLink();
  initMetadata();
  initWatchdog();
  initMediaSessionHandlers();
  fetchStations();
}

/**
 * Carregar metadados e estatísticas
 */
async function initMetadata() {
  try {
    const statsRes = await fetch('/api/stats');
    if (statsRes.ok) {
      const { stats } = await statsRes.json();
      if (stats) {
        elements.statTotalStations.textContent = stats.globalStationsAvailable ? `${stats.globalStationsAvailable.toLocaleString()}+` : '40.000+';
        elements.statCountries.textContent = stats.supportedCountriesCount || '200+';
      }
    }

    const countriesRes = await fetch('/api/countries');
    if (countriesRes.ok) {
      const { data } = await countriesRes.json();
      state.countriesList = data || [];
      renderCountryOptions();
    }
  } catch (err) {
    console.warn('Erro ao carregar metadados:', err);
  }
}

function renderCountryOptions() {
  const filtered = state.selectedContinent 
    ? state.countriesList.filter(c => c.continent === state.selectedContinent)
    : state.countriesList;

  elements.countrySelect.innerHTML = '<option value="">Todos os Países</option>';
  for (const c of filtered) {
    const opt = document.createElement('option');
    opt.value = c.code;
    const countInfo = c.stationCount ? ` (${c.stationCount})` : '';
    opt.textContent = `${c.flag || getFlagEmoji(c.code)} ${c.namePt || c.name}${countInfo}`;
    elements.countrySelect.appendChild(opt);
  }
}

/**
 * Buscar e listar estações de rádio
 */
async function fetchStations() {
  showLoading(true);

  try {
    // Se a aba for "favoritas"
    if (state.activeTab === 'favorites') {
      const favIds = Array.from(state.favorites);
      if (favIds.length === 0) {
        renderStations([]);
        updateResultsInfo();
        showLoading(false);
        return;
      }
      const res = await fetch(`/api/radios?limit=100&source=all`);
      const data = await res.json();
      const allStations = data.data || [];
      const favStations = allStations.filter(s => state.favorites.has(s.id));
      renderStations(favStations);
      state.totalStations = favStations.length;
      updateResultsInfo();
      showLoading(false);
      return;
    }

    // Se a aba for "recentes"
    if (state.activeTab === 'recents') {
      renderStations(state.recents);
      state.totalStations = state.recents.length;
      updateResultsInfo();
      showLoading(false);
      return;
    }

    // Aba geral
    const params = new URLSearchParams();
    if (state.searchQuery) params.append('q', state.searchQuery);
    if (state.selectedCountry) params.append('countrycode', state.selectedCountry);
    if (state.selectedContinent) params.append('continent', state.selectedContinent);
    if (state.selectedGenre) params.append('genre', state.selectedGenre);
    params.append('source', state.selectedSource);
    params.append('order', state.selectedSort);
    params.append('page', state.page);
    params.append('limit', state.limit);

    const res = await fetch(`/api/radios?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const data = await res.json();
    state.totalStations = data.total || 0;
    state.totalPages = data.totalPages || 1;

    renderStations(data.data || []);
    updatePaginationControls();
    updateResultsInfo();
  } catch (err) {
    console.error('Erro ao buscar emissoras:', err);
    elements.stationsGrid.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <p style="color: #f87171; font-size: 1.1rem; margin-bottom: 8px;">Erro ao carregar emissoras</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Verifique a sua conexão com a API e tente novamente.</p>
      </div>
    `;
  } finally {
    showLoading(false);
  }
}

/**
 * Renderizar grelha de cartões
 */
function renderStations(stations) {
  state.loadedStations = stations || [];
  elements.stationsGrid.innerHTML = '';

  if (stations.length === 0) {
    const msg = state.activeTab === 'favorites' 
      ? 'Ainda não adicionou nenhuma rádio às favoritas. Clique na estrela ★ de qualquer rádio!'
      : state.activeTab === 'recents'
      ? 'Nenhuma rádio ouvida recentemente.'
      : 'Nenhuma estação encontrada 📻. Tente ajustar os filtros.';

    elements.stationsGrid.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <p style="font-size: 1.2rem; margin-bottom: 8px;">Lista Vazia</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${msg}</p>
      </div>
    `;
    return;
  }

  stations.forEach(station => {
    const card = document.createElement('div');
    const isCurrentPlaying = state.currentStation?.id === station.id && state.isPlaying;
    const isFav = state.favorites.has(station.id);
    card.className = `station-card ${isCurrentPlaying ? 'is-playing' : ''}`;
    card.dataset.id = station.id;

    const flag = station.countryCode ? getFlagEmoji(station.countryCode) : '🌐';
    const tagsHtml = (station.genres || []).slice(0, 3).map(g => `<span class="station-tag">${g}</span>`).join('');

    card.innerHTML = `
      <div>
        <div class="card-top">
          <img class="station-logo" src="${station.logo || `/api/radios/${station.id}/logo`}" alt="${station.name}" onerror="this.onerror=null;this.src='/api/radios/${station.id}/logo'">
          <div class="station-info">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h3 class="station-name" title="${station.name}">${station.name}</h3>
              <button class="btn-fav-star ${isFav ? 'active' : ''}" data-action="favorite" title="Favoritar">★</button>
            </div>
            <div class="station-meta-badge">
              <span class="station-flag">${flag}</span>
              <span>${station.country || 'Global'}</span>
              ${station.city ? `• <span>${station.city}</span>` : ''}
            </div>
          </div>
        </div>
        <p class="station-desc" title="${station.description || station.name}">${station.description || 'Transmissão ao vivo via internet.'}</p>
        <div class="station-tags">${tagsHtml}</div>
      </div>
      <div class="card-actions">
        <button class="btn-card-play" data-action="play">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          ${isCurrentPlaying ? 'Ouvindo' : 'Reproduzir'}
        </button>
        <button class="btn-card-stream" data-action="info" title="Ver Informações e Músicas Tocadas">
          ℹ️ Info
        </button>
        <button class="btn-card-stream" data-action="proxy" title="Abrir fluxo com Proxy Resiliente">
          Proxy 🛡️
        </button>
      </div>
    `;

    // Eventos
    card.querySelector('[data-action="play"]').addEventListener('click', (e) => {
      e.stopPropagation();
      playStation(station);
    });

    card.querySelector('[data-action="info"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openStationModal(station.id);
    });

    card.querySelector('[data-action="proxy"]').addEventListener('click', (e) => {
      e.stopPropagation();
      state.useProxy = true;
      elements.btnToggleProxy.classList.add('active');
      playStation(station);
      showToast('🛡️ Modo Proxy ativado para esta estação.');
    });

    card.querySelector('[data-action="favorite"]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(station.id);
    });

    card.addEventListener('click', () => {
      playStation(station);
    });

    elements.stationsGrid.appendChild(card);
  });
}

/**
 * Determinar URL de áudio (Direct vs Proxy)
 */
function getPlayUrl(station) {
  const isHttpsPage = window.location.protocol === 'https:';
  const isHttpStream = (station.streamUrl || '').startsWith('http://');

  // Se a página estiver em HTTPS e o stream for HTTP não seguro, usar SEMPRE o Proxy para contornar bloqueio de Mixed Content dos browsers
  if (state.useProxy || (isHttpsPage && isHttpStream)) {
    return `/api/radios/${station.id}/proxy`;
  }
  return `/api/radios/${station.id}/stream`;
}

/**
 * Reproduzir estação com suporte a HLS, MediaSession e Watchdog
 */
function playStation(station, isRecovery = false) {
  if (!isRecovery && state.currentStation?.id === station.id && state.isPlaying) {
    pausePlayback();
    return;
  }

  state.currentStation = station;
  state.isPlaying = true;
  state.lastPlaybackTime = 0;
  state.lastProgressTimestamp = Date.now();

  // Guardar nos Recentes
  addRecent(station);

  // Atualizar UI do Player
  elements.playerName.textContent = station.name;
  elements.playerLogo.src = station.logo || `/api/radios/${station.id}/logo`;
  elements.playerLogo.onerror = () => {
    elements.playerLogo.onerror = () => { elements.playerLogo.src = DEFAULT_LOGO; };
    elements.playerLogo.src = `/api/radios/${station.id}/logo`;
  };
  const flag = station.countryCode ? getFlagEmoji(station.countryCode) : '🌐';
  const genresStr = (station.genres || []).slice(0, 2).join(', ');
  elements.playerCountryGenre.textContent = `${flag} ${station.country || 'Mundial'}${genresStr ? ` • ${genresStr}` : ''}`;
  elements.playerStatus.textContent = isRecovery ? 'A recuperar ligação...' : 'A conectar...';
  elements.playerStatus.style.color = 'var(--accent-cyan)';
  elements.playerVisualizer.style.display = 'flex';

  updatePlayIcons(true);
  updatePlayerFavButton();

  // Atualizar MediaSession no sistema operacional (macOS, Windows, iOS, Android)
  updateMediaSession(station);

  // Verificar saúde e latência em tempo real
  checkCurrentStationHealth(station.id);
  if (elements.alarmStationName) {
    elements.alarmStationName.textContent = station.name;
  }

  // Configurar e iniciar fluxo de áudio
  const playUrl = getPlayUrl(station) + `?_t=${Date.now()}`;
  const isHls = (station.streamUrl || '').toLowerCase().includes('.m3u8');

  // Limpar instância HLS anterior se existir
  if (state.hlsInstance) {
    state.hlsInstance.destroy();
    state.hlsInstance = null;
  }

  if (isHls && window.Hls && Hls.isSupported()) {
    // Usar Hls.js com auto-recuperação de erros de rede e buffer
    state.hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60
    });

    state.hlsInstance.loadSource(station.streamUrl);
    state.hlsInstance.attachMedia(elements.audioPlayer);

    state.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      elements.audioPlayer.play().catch(handlePlayError);
    });

    state.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('HLS Network Error, tentando recuperar...');
            state.hlsInstance.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('HLS Media Error, recuperando...');
            state.hlsInstance.recoverMediaError();
            break;
          default:
            console.error('HLS Fatal Error:', data);
            state.hlsInstance.destroy();
            handlePlayError(data);
            break;
        }
      }
    });
  } else {
    // Reprodução nativa de áudio (MP3 / AAC / OGG)
    elements.audioPlayer.src = playUrl;
    elements.audioPlayer.play().catch(handlePlayError);
  }

  // Ativar Polling de Now Playing para esta rádio
  startNowPlayingPolling(station.id);

  // Atualizar visualização na grelha
  document.querySelectorAll('.station-card').forEach(c => {
    if (c.dataset.id === station.id) {
      c.classList.add('is-playing');
      const btn = c.querySelector('.btn-card-play');
      if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Ouvindo';
    } else {
      c.classList.remove('is-playing');
      const btn = c.querySelector('.btn-card-play');
      if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Reproduzir';
    }
  });
}

function handlePlayError(err) {
  console.warn('Erro ao reproduzir via stream regular:', err);
  // Se falhar e ainda não estiver usando proxy, tentar proxy automaticamente
  if (!state.useProxy && state.currentStation) {
    console.log('Tentando reproduzir através do Proxy Resiliente...');
    state.useProxy = true;
    if (elements.btnToggleProxy) elements.btnToggleProxy.classList.add('active');
    playStation(state.currentStation, true);
    return;
  }
  elements.playerStatus.textContent = 'Emissora temporariamente indisponível';
  elements.playerStatus.style.color = '#f87171';
  elements.playerVisualizer.style.display = 'none';
  state.isPlaying = false;
  updatePlayIcons(false);
  showToast(`⚠️ ${state.currentStation?.name || 'A emissora'} está temporariamente sem sinal no servidor de origem.`);
}

function pausePlayback() {
  elements.audioPlayer.pause();
  state.isPlaying = false;
  elements.playerStatus.textContent = 'Pausado';
  elements.playerStatus.style.color = 'var(--text-secondary)';
  elements.playerVisualizer.style.display = 'none';
  updatePlayIcons(false);
  stopNowPlayingPolling();

  document.querySelectorAll('.station-card').forEach(c => {
    c.classList.remove('is-playing');
    const btn = c.querySelector('.btn-card-play');
    if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Reproduzir';
  });
}

function resumePlayback() {
  if (!state.currentStation) return;
  playStation(state.currentStation);
}

function updatePlayIcons(isPlaying) {
  if (isPlaying) {
    elements.playIcon.style.display = 'none';
    elements.pauseIcon.style.display = 'block';
    if (elements.carPlayIcon) elements.carPlayIcon.style.display = 'none';
    if (elements.carPauseIcon) elements.carPauseIcon.style.display = 'block';
  } else {
    elements.playIcon.style.display = 'block';
    elements.pauseIcon.style.display = 'none';
    if (elements.carPlayIcon) elements.carPlayIcon.style.display = 'block';
    if (elements.carPauseIcon) elements.carPauseIcon.style.display = 'none';
  }
}

/**
 * WATCHDOG INTELIGENTE ANTI-CONGELAMENTO E AUTO-RECONEXÃO
 */
function initWatchdog() {
  if (state.watchdogTimer) clearInterval(state.watchdogTimer);

  state.watchdogTimer = setInterval(() => {
    if (!state.isPlaying || !state.currentStation) return;

    const currentPos = elements.audioPlayer.currentTime;
    const now = Date.now();

    // Se o reprodutor estiver a andar normalmente
    if (currentPos > state.lastPlaybackTime) {
      state.lastPlaybackTime = currentPos;
      state.lastProgressTimestamp = now;
      state.reconnectAttempts = 0;
      return;
    }

    // Se estiver estagnado há mais de 4.5 segundos mesmo estando em reprodução
    const timeStagnant = (now - state.lastProgressTimestamp) / 1000;
    if (timeStagnant > 4.5 && !elements.audioPlayer.paused) {
      console.warn(`[Watchdog] Áudio estagnado há ${timeStagnant.toFixed(1)}s. Disparando auto-reconexão transparente...`);
      state.lastProgressTimestamp = now;
      state.reconnectAttempts++;

      // Se já falhou várias vezes no stream normal, ativa o proxy automaticamente
      if (state.reconnectAttempts >= 2 && !state.useProxy) {
        state.useProxy = true;
        elements.btnToggleProxy.classList.add('active');
      }

      playStation(state.currentStation, true);
    }
  }, 2500);
}

/**
 * Integração com a API navigator.mediaSession (Impede suspensão em 2º plano)
 */
function updateMediaSession(station) {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: station.country ? `${station.country} • Em Direto` : 'Emissão ao vivo',
      album: station.description || 'Worldwide Radio',
      artwork: [
        { src: station.logo || DEFAULT_LOGO, sizes: '96x96', type: 'image/png' },
        { src: station.logo || DEFAULT_LOGO, sizes: '256x256', type: 'image/png' },
        { src: station.logo || DEFAULT_LOGO, sizes: '512x512', type: 'image/png' }
      ]
    });
  } catch (err) {
    console.warn('Erro ao atualizar mediaSession:', err);
  }
}

function initMediaSessionHandlers() {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.setActionHandler('play', () => resumePlayback());
    navigator.mediaSession.setActionHandler('pause', () => pausePlayback());
    navigator.mediaSession.setActionHandler('stop', () => pausePlayback());
    navigator.mediaSession.setActionHandler('nexttrack', () => fetchRandomRadio());
  } catch (err) {
    console.warn('Erro ao registar action handlers de mediaSession:', err);
  }
}

/**
 * Metadados ao vivo (Now Playing)
 */
function startNowPlayingPolling(stationId) {
  stopNowPlayingPolling();
  fetchNowPlaying(stationId);
  state.nowPlayingInterval = setInterval(() => {
    if (state.isPlaying && state.currentStation?.id === stationId) {
      fetchNowPlaying(stationId);
    }
  }, 15000);
}

function stopNowPlayingPolling() {
  if (state.nowPlayingInterval) {
    clearInterval(state.nowPlayingInterval);
    state.nowPlayingInterval = null;
  }
  elements.nowPlayingStrip.style.display = 'none';
}

async function fetchNowPlaying(stationId) {
  try {
    const res = await fetch(`/api/radios/${stationId}/now-playing`);
    if (res.ok) {
      const { nowPlaying } = await res.json();
      if (nowPlaying && nowPlaying.raw && nowPlaying.raw !== 'Emissão ao vivo') {
        const trackTitle = nowPlaying.artist 
          ? `${nowPlaying.artist} — ${nowPlaying.title}`
          : nowPlaying.raw;
        state.currentTrackTitle = trackTitle;
        elements.nowPlayingStrip.style.display = 'flex';
        elements.npText.textContent = trackTitle;
        if (elements.npActions) elements.npActions.style.display = 'flex';
        if (elements.carNowPlayingTitle) elements.carNowPlayingTitle.textContent = trackTitle;
      } else {
        elements.nowPlayingStrip.style.display = 'none';
        if (elements.npActions) elements.npActions.style.display = 'none';
        if (elements.carNowPlayingTitle) elements.carNowPlayingTitle.textContent = 'Emissão em direto';
      }
    }
  } catch (err) {
    // Ignorar erros silenciosos de now-playing
  }
}

/**
 * Eventos do áudio
 */
elements.audioPlayer.addEventListener('playing', () => {
  elements.playerStatus.textContent = state.useProxy ? 'Ao vivo (Proxy)' : 'Ao vivo';
  elements.playerStatus.style.color = 'var(--success)';
  state.lastProgressTimestamp = Date.now();
});

elements.audioPlayer.addEventListener('waiting', () => {
  elements.playerStatus.textContent = 'A carregar...';
  elements.playerStatus.style.color = 'var(--accent-cyan)';
});

elements.audioPlayer.addEventListener('stalled', () => {
  console.warn('Audio buffer stalled. Watchdog irá verificar...');
});

elements.audioPlayer.addEventListener('error', (e) => {
  console.warn('Erro reportado pelo elemento áudio:', elements.audioPlayer.error);
  handlePlayError(elements.audioPlayer.error || e);
});

// Retomar automaticamente quando a internet for restabelecida
window.addEventListener('online', () => {
  if (state.isPlaying && state.currentStation) {
    showToast('🌐 Internet restaurada! A retomar rádio...');
    playStation(state.currentStation, true);
  }
});

/**
 * Sistema de Favoritos e Recentes
 */
function toggleFavorite(stationId) {
  if (state.favorites.has(stationId)) {
    state.favorites.delete(stationId);
    showToast('Removida dos favoritos');
  } else {
    state.favorites.add(stationId);
    showToast('★ Adicionada às favoritas!');
  }

  localStorage.setItem('ww_radio_favorites', JSON.stringify(Array.from(state.favorites)));
  updateFavCounter();
  updatePlayerFavButton();

  // Atualizar estrelas na grelha
  document.querySelectorAll(`.station-card[data-id="${stationId}"] .btn-fav-star`).forEach(btn => {
    btn.classList.toggle('active', state.favorites.has(stationId));
  });

  // Se estiver na aba de favoritas, re-renderizar
  if (state.activeTab === 'favorites') {
    fetchStations();
  }
}

function updateFavCounter() {
  elements.favCounter.textContent = state.favorites.size;
}

function updatePlayerFavButton() {
  if (!state.currentStation) {
    elements.btnPlayerFav.classList.remove('active');
    return;
  }
  elements.btnPlayerFav.classList.toggle('active', state.favorites.has(state.currentStation.id));
}

function addRecent(station) {
  state.recents = [station, ...state.recents.filter(s => s.id !== station.id)].slice(0, 20);
  localStorage.setItem('ww_radio_recents', JSON.stringify(state.recents));
}

/**
 * Sleep Timer com Fade-Out Suave (últimos 2 minutos)
 */
function setSleepTimer(minutes) {
  if (state.sleepTimerTimeout) clearTimeout(state.sleepTimerTimeout);
  if (state.sleepTimerInterval) clearInterval(state.sleepTimerInterval);

  if (minutes === 0) {
    elements.sleepBadge.style.display = 'none';
    if (state.sleepInitialVolume !== undefined) {
      elements.audioPlayer.volume = state.sleepInitialVolume;
      elements.volumeSlider.value = state.sleepInitialVolume;
    }
    showToast('Sleep Timer desativado');
    return;
  }

  state.sleepRemainingSeconds = minutes * 60;
  state.sleepInitialVolume = elements.audioPlayer.volume || 0.8;
  elements.sleepBadge.style.display = 'block';
  elements.sleepBadge.textContent = `${minutes}m`;
  showToast(`⏰ A rádio desligará em ${minutes} minutos com fade-out suave.`);

  state.sleepTimerInterval = setInterval(() => {
    state.sleepRemainingSeconds--;

    // Fade-out suave nos últimos 120 segundos (2 minutos)
    if (state.sleepRemainingSeconds <= 120 && state.sleepRemainingSeconds > 0) {
      const fadeRatio = state.sleepRemainingSeconds / 120;
      const currentVol = (state.sleepInitialVolume * fadeRatio).toFixed(2);
      elements.audioPlayer.volume = parseFloat(currentVol);
      elements.volumeSlider.value = parseFloat(currentVol);
    }

    if (state.sleepRemainingSeconds <= 0) {
      clearInterval(state.sleepTimerInterval);
      elements.sleepBadge.style.display = 'none';
      pausePlayback();
      // Restaurar volume original para a próxima sessão
      elements.audioPlayer.volume = state.sleepInitialVolume || 0.8;
      elements.volumeSlider.value = state.sleepInitialVolume || 0.8;
      showToast('⏰ Sleep Timer: Rádio desligada suavemente. Boa noite!');
    } else {
      const mins = Math.ceil(state.sleepRemainingSeconds / 60);
      elements.sleepBadge.textContent = `${mins}m`;
    }
  }, 1000);
}

/**
 * Rádio aleatória
 */
async function fetchRandomRadio() {
  try {
    elements.btnRandomRadio.disabled = true;
    elements.btnRandomRadio.style.opacity = '0.7';

    const params = new URLSearchParams();
    if (state.selectedCountry) params.append('country', state.selectedCountry);
    if (state.selectedContinent) params.append('continent', state.selectedContinent);
    if (state.selectedGenre) params.append('genre', state.selectedGenre);

    const res = await fetch(`/api/radios/random?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao obter rádio aleatória');

    const { data } = await res.json();
    if (data) {
      playStation(data);
      showToast(`🎲 Sorteada: ${data.name} (${data.country || 'Mundial'})`);
    }
  } catch (err) {
    console.error('Erro na rádio aleatória:', err);
  } finally {
    elements.btnRandomRadio.disabled = false;
    elements.btnRandomRadio.style.opacity = '1';
  }
}

/**
 * Controles de UI
 */
function updatePaginationControls() {
  if (state.totalPages <= 1 || state.activeTab !== 'all') {
    elements.pagination.style.display = 'none';
    return;
  }
  elements.pagination.style.display = 'flex';
  elements.pageIndicator.textContent = `Página ${state.page} de ${state.totalPages}`;
  elements.btnPrevPage.disabled = state.page <= 1;
  elements.btnNextPage.disabled = state.page >= state.totalPages;
}

function updateResultsInfo() {
  const countText = `${state.totalStations.toLocaleString()} encontrada${state.totalStations === 1 ? '' : 's'}`;
  elements.resultsCount.textContent = countText;

  if (state.activeTab === 'favorites') {
    elements.resultsTitle.textContent = 'Minhas Estações Favoritas ⭐';
  } else if (state.activeTab === 'recents') {
    elements.resultsTitle.textContent = 'Ouvidas Recentemente 🕒';
  } else if (state.searchQuery) {
    elements.resultsTitle.textContent = `Resultados para "${state.searchQuery}"`;
  } else if (state.selectedCountry) {
    const cObj = state.countriesList.find(c => c.code === state.selectedCountry);
    elements.resultsTitle.textContent = `Emissoras em ${cObj ? (cObj.namePt || cObj.name) : state.selectedCountry}`;
  } else {
    elements.resultsTitle.textContent = 'Estações em Destaque Mundial';
  }
}

function showLoading(show) {
  elements.loadingSpinner.style.display = show ? 'block' : 'none';
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Event Listeners
elements.btnPlayPause.addEventListener('click', () => {
  if (state.isPlaying) {
    pausePlayback();
  } else {
    resumePlayback();
  }
});

elements.btnPlayerFav.addEventListener('click', () => {
  if (state.currentStation) {
    toggleFavorite(state.currentStation.id);
  }
});

elements.btnToggleProxy.addEventListener('click', () => {
  state.useProxy = !state.useProxy;
  elements.btnToggleProxy.classList.toggle('active', state.useProxy);
  showToast(state.useProxy ? '🛡️ Modo Proxy ativado' : '🌐 Modo Stream direto ativado');
  if (state.isPlaying && state.currentStation) {
    playStation(state.currentStation, true);
  }
});

elements.volumeSlider.addEventListener('input', (e) => {
  elements.audioPlayer.volume = parseFloat(e.target.value);
});

elements.btnCopyStream.addEventListener('click', () => {
  if (!state.currentStation) return;
  const streamUrl = `${window.location.origin}/api/radios/${state.currentStation.id}/stream`;
  navigator.clipboard.writeText(streamUrl).then(() => {
    showToast('Link do stream copiado!');
  }).catch(() => {
    showToast('Stream: ' + streamUrl);
  });
});

elements.btnRandomRadio.addEventListener('click', fetchRandomRadio);

// Sleep Timer Menu
elements.btnSleepTimer.addEventListener('click', (e) => {
  e.stopPropagation();
  elements.sleepMenu.style.display = elements.sleepMenu.style.display === 'none' ? 'flex' : 'none';
});

document.addEventListener('click', () => {
  elements.sleepMenu.style.display = 'none';
});

elements.sleepMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  if (e.target.dataset.minutes !== undefined) {
    setSleepTimer(parseInt(e.target.dataset.minutes, 10));
    elements.sleepMenu.style.display = 'none';
  }
});

// View Tabs (Todas, Favoritas, Recentes)
document.querySelectorAll('.view-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    state.page = 1;
    fetchStations();
  });
});

// Busca com Debounce
elements.searchInput.addEventListener('input', debounce((e) => {
  state.searchQuery = e.target.value.trim();
  state.page = 1;
  elements.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
  fetchStations();
}, 400));

elements.searchClearBtn.addEventListener('click', () => {
  elements.searchInput.value = '';
  state.searchQuery = '';
  elements.searchClearBtn.style.display = 'none';
  state.page = 1;
  fetchStations();
});

// Filtros
elements.continentSelect.addEventListener('change', (e) => {
  state.selectedContinent = e.target.value;
  state.selectedCountry = '';
  state.page = 1;
  renderCountryOptions();
  fetchStations();
});

elements.countrySelect.addEventListener('change', (e) => {
  state.selectedCountry = e.target.value;
  state.page = 1;
  fetchStations();
});

elements.sourceSelect.addEventListener('change', (e) => {
  state.selectedSource = e.target.value;
  state.page = 1;
  fetchStations();
});

elements.sortSelect.addEventListener('change', (e) => {
  state.selectedSort = e.target.value;
  state.page = 1;
  fetchStations();
});

elements.genresContainer.addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  state.selectedGenre = e.target.dataset.genre || '';
  state.page = 1;
  fetchStations();
});

// Paginação
elements.btnPrevPage.addEventListener('click', () => {
  if (state.page > 1) {
    state.page--;
    fetchStations();
    window.scrollTo({ top: 350, behavior: 'smooth' });
  }
});

elements.btnNextPage.addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page++;
    fetchStations();
    window.scrollTo({ top: 350, behavior: 'smooth' });
  }
});

// Tecla de atalho: Barra de espaço para tocar/pausar
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && elements.stationModal.style.display !== 'none') {
    elements.stationModal.style.display = 'none';
    return;
  }
  if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
    e.preventDefault();
    if (state.isPlaying) {
      pausePlayback();
    } else {
      resumePlayback();
    }
  }
});

/**
 * ABRIR MODAL DE PERFIL DA EMISSORA & HISTÓRICO (Estilo radios-online.pt)
 */
async function openStationModal(stationId) {
  if (!stationId) return;

  // Resetar visualização e exibir modal
  elements.stationModal.style.display = 'flex';
  elements.modalName.textContent = 'A carregar informações...';
  elements.modalSlogan.textContent = 'Por favor aguarde';
  elements.modalLogo.src = DEFAULT_LOGO;
  elements.modalTracksList.innerHTML = '<p style="color: var(--text-secondary); padding: 10px;">A consultar histórico de músicas...</p>';
  elements.modalFrequenciesList.innerHTML = '';
  elements.modalScheduleList.innerHTML = '';
  elements.modalContactsInfo.innerHTML = '';
  elements.modalAboutText.textContent = '';

  // Ativar primeira aba por padrão
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.modal-tab[data-tab="tracks"]')?.classList.add('active');
  document.getElementById('tab-tracks')?.classList.add('active');

  try {
    const res = await fetch(`/api/radios/${stationId}/info`);
    if (!res.ok) throw new Error('Não foi possível carregar os detalhes');

    const data = await res.json();

    // Informações Principais
    elements.modalName.textContent = data.name;
    elements.modalLogo.src = data.logo || `/api/radios/${data.id}/logo`;
    elements.modalLogo.onerror = () => {
      elements.modalLogo.onerror = () => { elements.modalLogo.src = DEFAULT_LOGO; };
      elements.modalLogo.src = `/api/radios/${data.id}/logo`;
    };

    // 1. Músicas Tocadas
    const tracks = data.recentTracks || [];
    if (tracks.length === 0) {
      elements.modalTracksList.innerHTML = '<p style="color: var(--text-secondary); padding: 10px;">Nenhuma música registada recentemente.</p>';
    } else {
      elements.modalTracksList.innerHTML = tracks.map(t => {
        const query = encodeURIComponent(`${t.artist} ${t.title}`);
        const spUrl = `https://open.spotify.com/search/${query}`;
        const ytUrl = `https://www.youtube.com/results?search_query=${query}`;
        return `
        <div class="track-row">
          <span class="track-time">${t.playedAt || '--:--'}</span>
          <div class="track-details">
            <div class="track-title">${t.title}</div>
            <div class="track-artist">${t.artist}</div>
          </div>
          <div class="track-actions">
            <a href="${spUrl}" target="_blank" rel="noopener noreferrer" class="btn-track-service btn-spotify" title="Ouvir no Spotify">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            </a>
            <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="btn-track-service btn-youtube" title="Pesquisar vídeo no YouTube">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
          ${t.duration ? `<span style="font-size: 0.8rem; color: var(--text-secondary);">${t.duration}</span>` : ''}
        </div>
      `;
      }).join('');
    }

    // 2. Frequências
    const freqs = data.frequencies || [];
    if (freqs.length === 0) {
      elements.modalFrequenciesList.innerHTML = '<p style="color: var(--text-secondary); padding: 10px;">Emissão exclusiva via Web / Internet.</p>';
    } else {
      elements.modalFrequenciesList.innerHTML = freqs.map(f => `
        <div class="freq-card">
          <span class="freq-city">${f.city}</span>
          <span class="freq-val">${f.frequency}</span>
        </div>
      `).join('');
    }

    // 3. Programação
    const sched = data.schedule || [];
    if (sched.length === 0) {
      elements.modalScheduleList.innerHTML = '<p style="color: var(--text-secondary); padding: 10px;">Grelha de programação regular 24/7.</p>';
    } else {
      elements.modalScheduleList.innerHTML = sched.map(s => `
        <div class="schedule-card">
          <div class="schedule-time">${s.time}</div>
          <div>
            <div class="schedule-title">${s.title}</div>
            ${s.hosts && s.hosts.length > 0 ? `<div class="schedule-hosts">Animadores: ${s.hosts.join(', ')}</div>` : ''}
          </div>
        </div>
      `).join('');
    }

    // 4. Contactos & Redes
    const c = data.contacts || {};
    const s = data.social || {};
    let contactsHtml = '';

    if (c.phone) contactsHtml += `<div class="contact-card"><span class="contact-label">Telefone</span><a href="tel:${c.phone}" class="contact-val">${c.phone}</a></div>`;
    if (c.whatsapp) contactsHtml += `<div class="contact-card"><span class="contact-label">WhatsApp</span><span class="contact-val">${c.whatsapp}</span></div>`;
    if (c.email) contactsHtml += `<div class="contact-card"><span class="contact-label">Email</span><a href="mailto:${c.email}" class="contact-val">${c.email}</a></div>`;
    if (c.website) contactsHtml += `<div class="contact-card"><span class="contact-label">Website</span><a href="${c.website}" target="_blank" class="contact-val">${c.website}</a></div>`;
    if (c.address) contactsHtml += `<div class="contact-card"><span class="contact-label">Morada</span><span class="contact-val">${c.address}</span></div>`;

    if (s.facebook) contactsHtml += `<div class="contact-card"><span class="contact-label">Facebook</span><a href="${s.facebook}" target="_blank" class="contact-val">${s.facebook}</a></div>`;
    if (s.instagram) contactsHtml += `<div class="contact-card"><span class="contact-label">Instagram</span><a href="${s.instagram}" target="_blank" class="contact-val">${s.instagram}</a></div>`;
    if (s.youtube) contactsHtml += `<div class="contact-card"><span class="contact-label">YouTube</span><a href="${s.youtube}" target="_blank" class="contact-val">${s.youtube}</a></div>`;

    elements.modalContactsInfo.innerHTML = contactsHtml || '<p style="color: var(--text-secondary); padding: 10px;">Contactos não registados.</p>';

    // 5. Podcasts & Programas Gravados
    try {
      const podRes = await fetch(`/api/radios/${stationId}/podcasts`);
      if (podRes.ok) {
        const podData = await podRes.json();
        const pods = podData.podcasts || [];
        if (pods.length === 0) {
          elements.modalPodcastsList.innerHTML = '<p style="color: var(--text-secondary); padding: 10px;">Esta emissora ainda não tem podcasts registados no catálogo.</p>';
        } else {
          elements.modalPodcastsList.innerHTML = pods.map(p => `
            <div class="podcast-show-card">
              <div class="podcast-show-header">
                <img src="${p.logo || DEFAULT_LOGO}" alt="${p.title}" class="podcast-show-logo">
                <div>
                  <div class="podcast-show-title">${p.title}</div>
                  <div class="podcast-show-desc">${p.description}</div>
                </div>
              </div>
              <div class="podcast-episodes-list">
                ${(p.episodes || []).map(ep => `
                  <div class="podcast-episode-row">
                    <div class="ep-details">
                      <div class="ep-title">${ep.title}</div>
                      <div class="ep-meta">${ep.date} • ${ep.duration}</div>
                    </div>
                    <button class="btn-ep-play" data-audio="${ep.audioUrl}" data-title="${ep.title}">▶ Ouvir</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('');

          // Listener para reproduzir episódios de podcasts
          elements.modalPodcastsList.querySelectorAll('.btn-ep-play').forEach(b => {
            b.addEventListener('click', (e) => {
              const audioUrl = e.currentTarget.dataset.audio;
              const epTitle = e.currentTarget.dataset.title;
              if (audioUrl) {
                elements.audioPlayer.src = audioUrl;
                elements.audioPlayer.play();
                elements.playerName.textContent = epTitle;
                elements.playerStatus.textContent = 'Podcast';
                elements.playerStatus.style.color = 'var(--accent-purple)';
                showToast(`A reproduzir episódio: ${epTitle}`);
              }
            });
          });
        }
      }
    } catch (pe) {
      elements.modalPodcastsList.innerHTML = '<p style="color: var(--text-secondary); padding: 10px;">Sem podcasts disponíveis de momento.</p>';
    }

  } catch (err) {
    console.error('Erro ao carregar detalhes da estação:', err);
    elements.modalName.textContent = 'Erro ao carregar detalhes';
    elements.modalTracksList.innerHTML = '<p style="color: #f87171; padding: 10px;">Não foi possível contactar os detalhes da rádio.</p>';
  }
}

// Fechar Modal
elements.btnCloseModal.addEventListener('click', () => {
  elements.stationModal.style.display = 'none';
});

elements.stationModal.addEventListener('click', (e) => {
  if (e.target === elements.stationModal) {
    elements.stationModal.style.display = 'none';
  }
});

// Botão de Info no Player Fixo
elements.btnPlayerInfo.addEventListener('click', () => {
  if (state.currentStation) {
    openStationModal(state.currentStation.id);
  } else {
    showToast('Selecione uma rádio para ver os detalhes e músicas tocadas.');
  }
});

// Abas do Modal
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    const content = document.getElementById(`tab-${target}`);
    if (content) content.classList.add('active');
  });
});

/* ==========================================================================
   1. EQUALIZADOR DE ÁUDIO (Web Audio API - 5 Bandas & Presets)
   ========================================================================== */
const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0],
  bass: [7, 4, 0, 0, -1],
  vocal: [-3, 0, 4, 4, 1],
  pop: [3, 1, 0, 2, 4],
  rock: [5, 2, -1, 3, 5],
  electronic: [7, 3, 0, 1, 4],
  acoustic: [3, 2, 1, 2, 3]
};

function initAudioContext() {
  if (state.audioContext) {
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }
    return;
  }

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    state.audioContext = new AudioContextClass();

    // Criar nó fonte a partir do elemento de áudio
    state.audioSourceNode = state.audioContext.createMediaElementSource(elements.audioPlayer);

    const bands = [
      { freq: 60, type: 'lowshelf' },
      { freq: 250, type: 'peaking', q: 1 },
      { freq: 1000, type: 'peaking', q: 1 },
      { freq: 4000, type: 'peaking', q: 1 },
      { freq: 12000, type: 'highshelf' }
    ];

    state.eqFilters = bands.map(b => {
      const f = state.audioContext.createBiquadFilter();
      f.type = b.type;
      f.frequency.value = b.freq;
      if (b.q) f.Q.value = b.q;
      f.gain.value = 0;
      return f;
    });

    let lastNode = state.audioSourceNode;
    for (const filter of state.eqFilters) {
      lastNode.connect(filter);
      lastNode = filter;
    }

    lastNode.connect(state.audioContext.destination);

    if (state.audioContext.createMediaStreamDestination) {
      state.mediaStreamDestination = state.audioContext.createMediaStreamDestination();
      lastNode.connect(state.mediaStreamDestination);
    }
  } catch (err) {
    console.warn('Web Audio inicializado com áudio direto:', err);
  }
}

function applyEqPreset(presetKey) {
  initAudioContext();
  const values = EQ_PRESETS[presetKey] || EQ_PRESETS.flat;
  values.forEach((val, idx) => {
    if (state.eqFilters[idx]) {
      state.eqFilters[idx].gain.value = val;
    }
    const slider = document.getElementById(`eq-band-${idx}`);
    if (slider) slider.value = val;
    const gainLabel = document.getElementById(`gain-val-${idx}`);
    if (gainLabel) gainLabel.textContent = (val > 0 ? `+${val}` : `${val}`) + 'dB';
  });

  document.querySelectorAll('.eq-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });
}

// Configurar sliders do equalizador
for (let i = 0; i < 5; i++) {
  const slider = document.getElementById(`eq-band-${i}`);
  const gainLabel = document.getElementById(`gain-val-${i}`);
  if (slider) {
    slider.addEventListener('input', (e) => {
      initAudioContext();
      const val = parseFloat(e.target.value);
      if (state.eqFilters[i]) {
        state.eqFilters[i].gain.value = val;
      }
      if (gainLabel) gainLabel.textContent = (val > 0 ? `+${val}` : `${val}`) + 'dB';
      document.querySelectorAll('.eq-preset-btn').forEach(b => b.classList.remove('active'));
    });
  }
}

// Presets do Equalizador
document.querySelectorAll('.eq-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyEqPreset(btn.dataset.preset);
  });
});

elements.btnResetEq?.addEventListener('click', () => {
  applyEqPreset('flat');
  showToast('Equalizador reposto para Flat.');
});

elements.btnEqualizer?.addEventListener('click', () => {
  initAudioContext();
  elements.eqModal.style.display = 'flex';
});

elements.btnCloseEq?.addEventListener('click', () => {
  elements.eqModal.style.display = 'none';
});

elements.eqModal?.addEventListener('click', (e) => {
  if (e.target === elements.eqModal) elements.eqModal.style.display = 'none';
});

/* ==========================================================================
   2. GRAVADOR DE ÁUDIO AO VIVO (Live Audio Stream Recorder)
   ========================================================================== */
function toggleRecording() {
  if (!state.isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  if (!state.isPlaying || !state.currentStation) {
    showToast('Inicie a reprodução de uma rádio para poder gravar.');
    return;
  }

  initAudioContext();

  let stream = null;
  if (state.mediaStreamDestination && state.mediaStreamDestination.stream) {
    stream = state.mediaStreamDestination.stream;
  } else if (elements.audioPlayer.captureStream) {
    stream = elements.audioPlayer.captureStream();
  } else if (elements.audioPlayer.mozCaptureStream) {
    stream = elements.audioPlayer.mozCaptureStream();
  }

  if (!stream) {
    showToast('A gravação de áudio não é suportada neste navegador.');
    return;
  }

  try {
    state.recordedChunks = [];
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    let chosenMime = '';
    for (const m of mimeTypes) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) {
        chosenMime = m;
        break;
      }
    }

    state.mediaRecorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);

    state.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.recordedChunks.push(e.data);
      }
    };

    state.mediaRecorder.onstop = () => {
      if (state.recordTimerInterval) {
        clearInterval(state.recordTimerInterval);
        state.recordTimerInterval = null;
      }
      elements.btnRecord.classList.remove('recording');
      elements.recLabel.textContent = 'Gravar';

      if (state.recordedChunks.length === 0) {
        showToast('Nenhum dado de áudio gravado.');
        return;
      }

      const mime = state.mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(state.recordedChunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const safeName = (state.currentStation?.name || 'radio').replace(/[^a-zA-Z0-9_-]/g, '_');
      const now = new Date();
      const timeStamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm';
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_${timeStamp}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Gravação descarregada (${(blob.size / 1024).toFixed(0)} KB)!`);
    };

    state.mediaRecorder.start(1000);
    state.isRecording = true;
    state.recordStartTime = Date.now();
    elements.btnRecord.classList.add('recording');
    elements.recLabel.textContent = '00:00';

    state.recordTimerInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - state.recordStartTime) / 1000);
      const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const secs = String(elapsedSec % 60).padStart(2, '0');
      elements.recLabel.textContent = `${mins}:${secs}`;
    }, 1000);

    showToast('🔴 A gravar transmissão em direto...');
  } catch (err) {
    console.error('Erro ao iniciar gravação:', err);
    showToast('Erro ao iniciar gravador de áudio.');
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.isRecording) {
    state.isRecording = false;
    state.mediaRecorder.stop();
  }
}

elements.btnRecord?.addEventListener('click', toggleRecording);

/* ==========================================================================
   3. AÇÕES RÁPIDAS SPOTIFY & YOUTUBE NO NOW PLAYING
   ========================================================================== */
elements.npSpotifyBtn?.addEventListener('click', () => {
  const query = state.currentTrackTitle || state.currentStation?.name || '';
  if (query) {
    window.open(`https://open.spotify.com/search/${encodeURIComponent(query)}`, '_blank');
  }
});

elements.npYoutubeBtn?.addEventListener('click', () => {
  const query = state.currentTrackTitle || state.currentStation?.name || '';
  if (query) {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
  }
});

/* ==========================================================================
   4. MODO CARRO (Interface simplificada e de grande contraste)
   ========================================================================== */
function openCarMode() {
  elements.carModeOverlay.style.display = 'flex';
  updateCarModeUI();
  updateCarClock();
  if (!state.carClockInterval) {
    state.carClockInterval = setInterval(updateCarClock, 1000);
  }
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  } catch (e) {}
}

function closeCarMode() {
  elements.carModeOverlay.style.display = 'none';
  if (state.carClockInterval) {
    clearInterval(state.carClockInterval);
    state.carClockInterval = null;
  }
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  } catch (e) {}
}

function updateCarClock() {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  if (elements.carClock) elements.carClock.textContent = `${hrs}:${mins}`;
}

function updateCarModeUI() {
  if (!elements.carStationName) return;
  if (state.currentStation) {
    elements.carStationName.textContent = state.currentStation.name;
    const genres = (state.currentStation.genres || []).join(', ');
    elements.carStationMeta.textContent = `${state.currentStation.country || 'Global'}${genres ? ' • ' + genres : ''}`;
    elements.carStationLogo.src = state.currentStation.logo || DEFAULT_LOGO;
    elements.carNowPlayingTitle.textContent = state.currentTrackTitle || 'Emissão em direto';
  } else {
    elements.carStationName.textContent = 'Selecione uma Estação';
    elements.carStationMeta.textContent = 'Sintonizador Mundial';
    elements.carStationLogo.src = DEFAULT_LOGO;
    elements.carNowPlayingTitle.textContent = 'Pronto';
  }

  if (state.isPlaying) {
    elements.carPlayIcon.style.display = 'none';
    elements.carPauseIcon.style.display = 'block';
  } else {
    elements.carPlayIcon.style.display = 'block';
    elements.carPauseIcon.style.display = 'none';
  }

  if (elements.carVolumeSlider) {
    elements.carVolumeSlider.value = elements.volumeSlider.value;
  }
}

function playNextStation() {
  if (!state.loadedStations || state.loadedStations.length === 0) {
    fetchRandomRadio();
    return;
  }
  const currentIndex = state.loadedStations.findIndex(s => s.id === state.currentStation?.id);
  const nextIndex = (currentIndex + 1) % state.loadedStations.length;
  playStation(state.loadedStations[nextIndex]);
}

function playPrevStation() {
  if (!state.loadedStations || state.loadedStations.length === 0) {
    fetchRandomRadio();
    return;
  }
  const currentIndex = state.loadedStations.findIndex(s => s.id === state.currentStation?.id);
  const prevIndex = (currentIndex - 1 + state.loadedStations.length) % state.loadedStations.length;
  playStation(state.loadedStations[prevIndex]);
}

elements.btnCarMode?.addEventListener('click', openCarMode);
elements.btnExitCarMode?.addEventListener('click', closeCarMode);
elements.btnCarPlay?.addEventListener('click', () => {
  if (state.isPlaying) pausePlayback();
  else resumePlayback();
});
elements.btnCarNext?.addEventListener('click', playNextStation);
elements.btnCarPrev?.addEventListener('click', playPrevStation);

elements.carVolumeSlider?.addEventListener('input', (e) => {
  elements.audioPlayer.volume = e.target.value;
  elements.volumeSlider.value = e.target.value;
});

/* ==========================================================================
   5. RÁDIOS PRÓXIMAS DE MIM (Geolocalização / Timezone)
   ========================================================================== */
async function loadNearbyStations() {
  showToast('A detetar localização e rádios próximas...');
  elements.resultsTitle.textContent = '📍 Rádios Próximas de Si';
  elements.loadingSpinner.style.display = 'inline-block';
  elements.stationsGrid.innerHTML = '';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let detectedCode = 'PT';
    if (tz.includes('Lisbon') || tz.includes('Madeira') || tz.includes('Azores')) detectedCode = 'PT';
    else if (tz.includes('Madrid') || tz.includes('Canary')) detectedCode = 'ES';
    else if (tz.includes('Paris')) detectedCode = 'FR';
    else if (tz.includes('Luxembourg')) detectedCode = 'LU';
    else if (tz.includes('London')) detectedCode = 'GB';
    else if (tz.includes('Sao_Paulo') || tz.includes('Bahia') || tz.includes('Fortaleza')) detectedCode = 'BR';
    else if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) detectedCode = 'US';
    else if (tz.includes('Berlin')) detectedCode = 'DE';

    const res = await fetch(`/api/radios/nearby?countrycode=${detectedCode}`);
    if (res.ok) {
      const data = await res.json();
      const list = data.stations || [];
      elements.resultsCount.textContent = `${list.length} encontradas (${data.detectedCountryCode || detectedCode})`;
      renderStations(list);
      showToast(`Carregadas ${list.length} rádios de ${data.detectedCountryCode || detectedCode}!`);
    } else {
      throw new Error('Falha na resposta da API');
    }
  } catch (err) {
    console.error('Erro em loadNearbyStations:', err);
    showToast('Não foi possível obter rádios próximas.');
    fetchStations();
  } finally {
    elements.loadingSpinner.style.display = 'none';
  }
}

elements.btnNearby?.addEventListener('click', loadNearbyStations);

/* ==========================================================================
   6. EXPORTAR PLAYLIST M3U / M3U8 (VLC / Smart TV / IPTV)
   ========================================================================== */
function exportM3UPlaylist() {
  const params = new URLSearchParams();
  if (state.selectedCountry) params.set('country', state.selectedCountry);
  if (state.selectedContinent) params.set('continent', state.selectedContinent);
  if (state.selectedGenre) params.set('genre', state.selectedGenre);
  const url = `/api/radios/playlist.m3u?${params.toString()}`;
  showToast('📥 A transferir lista M3U para VLC / Smart TV...');
  window.location.href = url;
}

elements.btnExportM3U?.addEventListener('click', exportM3UPlaylist);

/* ==========================================================================
   7. CONFIGURAÇÃO PWA & SERVICE WORKER
   ========================================================================== */
function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('Service Worker não registado:', err);
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPwaPrompt = e;
    if (elements.btnInstallPwa) {
      elements.btnInstallPwa.style.display = 'inline-flex';
    }
  });

  elements.btnInstallPwa?.addEventListener('click', async () => {
    if (state.deferredPwaPrompt) {
      state.deferredPwaPrompt.prompt();
      const { outcome } = await state.deferredPwaPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Aplicação instalada com sucesso!');
      }
      state.deferredPwaPrompt = null;
      elements.btnInstallPwa.style.display = 'none';
    }
  });
}

/* ==========================================================================
   8. MONITOR DE SAÚDE E LATÊNCIA EM TEMPO REAL (Stream Health Check)
   ========================================================================== */
async function checkCurrentStationHealth(stationId) {
  if (!stationId) return;
  try {
    const res = await fetch(`/api/radios/${stationId}/health`);
    if (res.ok) {
      const data = await res.json();
      const h = data.health || {};
      if (elements.playerHealthBadge) {
        elements.playerHealthBadge.style.display = 'inline-block';
        if (h.status === 'online') {
          elements.playerHealthBadge.style.color = '#10b981';
          elements.playerHealthBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          elements.playerHealthBadge.textContent = `🟢 ${h.latencyMs}ms (${state.audioQuality})`;
        } else {
          elements.playerHealthBadge.style.color = '#f59e0b';
          elements.playerHealthBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
          elements.playerHealthBadge.textContent = `🟡 Instável (${state.audioQuality})`;
        }
      }
    }
  } catch (err) {
    // Silencioso
  }
}

/* ==========================================================================
   9. SELETOR DE QUALIDADE & MODO POUPANÇA DE DADOS (Data Saver)
   ========================================================================== */
elements.btnQualityMode?.addEventListener('click', () => {
  if (state.audioQuality === 'HQ') {
    state.audioQuality = 'LQ';
    elements.qualityLabel.textContent = 'Poupança';
    showToast('Modo Poupança de Dados Ativado (até 70% menos dados móveis).');
  } else {
    state.audioQuality = 'HQ';
    elements.qualityLabel.textContent = 'HQ';
    showToast('Modo Alta Fidelidade (HQ) Ativado.');
  }
  if (state.currentStation) {
    checkCurrentStationHealth(state.currentStation.id);
  }
});

/* ==========================================================================
   10. TOP 40 DAS MÚSICAS MAIS TOCADAS NAS RÁDIOS (Airplay Charts)
   ========================================================================== */
async function openTopChartsModal() {
  elements.chartsModal.style.display = 'flex';
  elements.chartsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">A calcular as músicas mais tocadas nas emissoras...</p>';

  try {
    const res = await fetch('/api/charts/top-tracks?limit=40');
    if (res.ok) {
      const data = await res.json();
      const chart = data.chart || [];
      if (chart.length === 0) {
        elements.chartsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Ainda sem dados suficientes para gerar o Top 40.</p>';
        return;
      }

      elements.chartsList.innerHTML = chart.map(c => `
        <div class="chart-row">
          <div class="chart-rank ${c.rank <= 3 ? 'top-3' : ''}">#${c.rank}</div>
          <div class="chart-meta">
            <div class="chart-title">${c.title}</div>
            <div class="chart-artist">${c.artist}</div>
          </div>
          <div class="chart-spins">${c.spins} rotações</div>
          <div class="track-actions">
            <button class="btn-track-service btn-lyrics" data-artist="${c.artist}" data-title="${c.title}" title="Ver Letra da Música">📝</button>
            <a href="${c.spotifyUrl}" target="_blank" rel="noopener noreferrer" class="btn-track-service btn-spotify" title="Ouvir no Spotify">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            </a>
            <a href="${c.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn-track-service btn-youtube" title="Pesquisar vídeo no YouTube">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>
      `).join('');

      // Listener para botões de letra dentro do Top 40
      elements.chartsList.querySelectorAll('.btn-lyrics').forEach(b => {
        b.addEventListener('click', (e) => {
          const artist = e.currentTarget.dataset.artist;
          const title = e.currentTarget.dataset.title;
          showLyrics(artist, title);
        });
      });
    }
  } catch (err) {
    elements.chartsList.innerHTML = '<p style="color: #f87171; text-align: center;">Erro ao carregar o Top 40.</p>';
  }
}

elements.btnTopCharts?.addEventListener('click', openTopChartsModal);
elements.btnCloseCharts?.addEventListener('click', () => {
  elements.chartsModal.style.display = 'none';
});
elements.chartsModal?.addEventListener('click', (e) => {
  if (e.target === elements.chartsModal) elements.chartsModal.style.display = 'none';
});

/* ==========================================================================
   11. LETRAS DE MÚSICAS EM TEMPO REAL (Lyrics Finder)
   ========================================================================== */
async function showLyrics(artist, title) {
  if (!title) return;
  elements.lyricsModal.style.display = 'flex';
  elements.lyricsTitle.textContent = title;
  elements.lyricsArtist.textContent = artist || 'Artista desconhecido';
  elements.lyricsContent.textContent = 'A procurar letra oficial da música...';

  try {
    const res = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist || '')}&title=${encodeURIComponent(title)}`);
    if (res.ok) {
      const data = await res.json();
      elements.lyricsContent.textContent = data.lyrics;
    } else {
      elements.lyricsContent.textContent = `Não foi possível encontrar a letra para "${artist ? artist + ' - ' : ''}${title}".`;
    }
  } catch (err) {
    elements.lyricsContent.textContent = 'Erro ao conectar ao serviço de letras.';
  }
}

elements.npLyricsBtn?.addEventListener('click', () => {
  if (state.currentTrackTitle) {
    const parts = state.currentTrackTitle.split('—').map(s => s.trim());
    const artist = parts.length > 1 ? parts[0] : '';
    const title = parts.length > 1 ? parts[1] : parts[0];
    showLyrics(artist, title);
  } else {
    showToast('Aguarde pela deteção da música que está a tocar.');
  }
});

elements.btnCloseLyrics?.addEventListener('click', () => {
  elements.lyricsModal.style.display = 'none';
});
elements.lyricsModal?.addEventListener('click', (e) => {
  if (e.target === elements.lyricsModal) elements.lyricsModal.style.display = 'none';
});

/* ==========================================================================
   12. DESPERTADOR RÁDIO INTELIGENTE (Radio Alarm Clock)
   ========================================================================== */
function openAlarmModal() {
  elements.alarmModal.style.display = 'flex';
  if (state.currentStation && elements.alarmStationName) {
    elements.alarmStationName.textContent = state.currentStation.name;
    state.alarmStation = state.currentStation;
  }
}

function toggleAlarm() {
  if (!state.alarmEnabled) {
    state.alarmEnabled = true;
    state.alarmTime = elements.alarmTimeInput.value || '07:30';
    state.alarmFadeSeconds = parseInt(elements.alarmFadeSelect.value, 10) || 30;
    state.alarmStation = state.currentStation || state.loadedStations[0];

    elements.btnToggleAlarm.textContent = 'Desativar Despertador';
    elements.btnToggleAlarm.classList.remove('btn-accent');
    elements.btnToggleAlarm.classList.add('btn-secondary');
    elements.alarmStatusBanner.style.display = 'flex';
    elements.alarmStatusText.textContent = `Despertador ativo para as ${state.alarmTime} com ${state.alarmStation?.name || 'rádio'}`;
    showToast(`⏰ Despertador programado para as ${state.alarmTime}!`);

    startAlarmChecker();
  } else {
    state.alarmEnabled = false;
    elements.btnToggleAlarm.textContent = 'Ativar Despertador';
    elements.btnToggleAlarm.classList.remove('btn-secondary');
    elements.btnToggleAlarm.classList.add('btn-accent');
    elements.alarmStatusBanner.style.display = 'none';
    showToast('Despertador desativado.');
  }
}

function startAlarmChecker() {
  if (state.alarmCheckInterval) clearInterval(state.alarmCheckInterval);
  state.alarmCheckInterval = setInterval(() => {
    if (!state.alarmEnabled) return;

    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (currentHHMM === state.alarmTime && !state.alarmTriggeredToday) {
      state.alarmTriggeredToday = true;
      triggerAlarm();
    }

    if (currentHHMM !== state.alarmTime) {
      state.alarmTriggeredToday = false;
    }
  }, 1000);
}

function triggerAlarm() {
  const stationToPlay = state.alarmStation || state.currentStation || state.loadedStations[0];
  if (!stationToPlay) return;

  showToast(`⏰ ACORDE! A iniciar ${stationToPlay.name}...`);
  elements.audioPlayer.volume = 0;
  elements.volumeSlider.value = 0;
  playStation(stationToPlay);

  const fadeSecs = state.alarmFadeSeconds || 30;
  if (fadeSecs > 0) {
    const targetVol = 0.8;
    const stepIntervalMs = 500;
    const totalSteps = (fadeSecs * 1000) / stepIntervalMs;
    const volStep = targetVol / totalSteps;

    let currentStep = 0;
    const fadeTimer = setInterval(() => {
      currentStep++;
      const nextVol = Math.min(targetVol, elements.audioPlayer.volume + volStep);
      elements.audioPlayer.volume = nextVol;
      elements.volumeSlider.value = nextVol;

      if (currentStep >= totalSteps || nextVol >= targetVol) {
        clearInterval(fadeTimer);
      }
    }, stepIntervalMs);
  } else {
    elements.audioPlayer.volume = 0.8;
    elements.volumeSlider.value = 0.8;
  }
}

elements.btnAlarm?.addEventListener('click', openAlarmModal);
elements.btnToggleAlarm?.addEventListener('click', toggleAlarm);
elements.btnCloseAlarm?.addEventListener('click', () => {
  elements.alarmModal.style.display = 'none';
});
elements.alarmModal?.addEventListener('click', (e) => {
  if (e.target === elements.alarmModal) elements.alarmModal.style.display = 'none';
});

/**
 * Experiência Móvel Otimizada (iOS & Ecrãs Pequenos)
 */
function setupMobileExperience() {
  const btnMobileMenu = document.getElementById('btn-mobile-menu');
  const mobileMenuModal = document.getElementById('mobile-menu-modal');
  const btnCloseMobileMenu = document.getElementById('btn-close-mobile-menu');
  const btnPlayerOptionsMobile = document.getElementById('btn-player-options-mobile');
  const playerOptionsModal = document.getElementById('player-options-modal');
  const btnClosePlayerOptions = document.getElementById('btn-close-player-options');
  const sheetStationName = document.getElementById('sheet-station-name');

  const btnToggleFilters = document.getElementById('btn-toggle-filters');
  const filtersCollapsible = document.getElementById('filters-collapsible');
  const activeFiltersBadge = document.getElementById('active-filters-badge');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const mobileFavCounter = document.getElementById('mobile-fav-counter');

  // 1. Alternar barra de filtros colapsáveis
  btnToggleFilters?.addEventListener('click', () => {
    const isExpanded = filtersCollapsible?.classList.toggle('expanded');
    btnToggleFilters.classList.toggle('active', isExpanded);
  });

  // 2. Atualizar contagem de filtros ativos
  function updateFilterBadge() {
    let count = 0;
    if (elements.continentSelect?.value) count++;
    if (elements.countrySelect?.value) count++;
    if (elements.sourceSelect?.value && elements.sourceSelect.value !== 'curated') count++;
    if (elements.sortSelect?.value && elements.sortSelect.value !== 'votes') count++;
    if (state.selectedGenre) count++;

    if (activeFiltersBadge) {
      activeFiltersBadge.textContent = count;
      activeFiltersBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    if (btnResetFilters) {
      btnResetFilters.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  elements.continentSelect?.addEventListener('change', updateFilterBadge);
  elements.countrySelect?.addEventListener('change', updateFilterBadge);
  elements.sourceSelect?.addEventListener('change', updateFilterBadge);
  elements.sortSelect?.addEventListener('change', updateFilterBadge);

  btnResetFilters?.addEventListener('click', () => {
    if (elements.continentSelect) elements.continentSelect.value = '';
    if (elements.countrySelect) elements.countrySelect.value = '';
    if (elements.sourceSelect) elements.sourceSelect.value = 'curated';
    if (elements.sortSelect) elements.sortSelect.value = 'votes';
    state.selectedGenre = '';
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', !c.dataset.genre));
    updateFilterBadge();
    fetchStations();
    showToast('Filtros repostos.');
  });

  // 3. Abrir e fechar Menu Mobile Sheet
  btnMobileMenu?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'flex';
  });
  btnCloseMobileMenu?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
  });
  mobileMenuModal?.addEventListener('click', (e) => {
    if (e.target === mobileMenuModal) mobileMenuModal.style.display = 'none';
  });

  // 4. Ações rápidas dentro do Menu Mobile Sheet
  document.getElementById('m-action-top40')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    document.getElementById('btn-top-charts')?.click();
  });
  document.getElementById('m-action-radar')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    document.getElementById('btn-artist-radar')?.click();
  });
  document.getElementById('m-action-alarm')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    document.getElementById('btn-alarm')?.click();
  });
  document.getElementById('m-action-car')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    openCarMode();
  });
  document.getElementById('m-action-m3u')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    document.getElementById('btn-export-m3u')?.click();
  });
  document.getElementById('m-action-random')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    document.getElementById('btn-random-radio')?.click();
  });
  document.getElementById('m-action-docs')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    window.open('/docs', '_blank');
  });
  document.getElementById('m-action-install')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'none';
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
    } else {
      showToast('No Safari do iPhone, toque em Partilhar ⬆️ e depois em "Adicionar ao Ecrã Principal".');
    }
  });

  // Seletor de Idioma no Sheet
  document.querySelectorAll('.sheet-lang-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
      document.querySelectorAll('.sheet-lang-opt').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
      mobileMenuModal.style.display = 'none';
      showToast(`🌐 Idioma alterado para ${lang.toUpperCase()}`);
    });
  });

  // Botão Rádio Aleatória Mobile no Header
  document.getElementById('btn-mobile-random')?.addEventListener('click', () => {
    document.getElementById('btn-random-radio')?.click();
  });

  // 5. Abrir e fechar Opções de Áudio do Player Mobile
  btnPlayerOptionsMobile?.addEventListener('click', () => {
    if (state.currentStation) {
      if (sheetStationName) sheetStationName.textContent = state.currentStation.name;
    } else {
      if (sheetStationName) sheetStationName.textContent = 'Opções de Áudio';
    }
    playerOptionsModal.style.display = 'flex';
  });
  btnClosePlayerOptions?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
  });
  playerOptionsModal?.addEventListener('click', (e) => {
    if (e.target === playerOptionsModal) playerOptionsModal.style.display = 'none';
  });

  // Ações dentro do Player Options Sheet
  document.getElementById('m-player-eq')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-equalizer')?.click();
  });
  document.getElementById('m-player-sleep')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-sleep-timer')?.click();
  });
  document.getElementById('m-player-rec')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-record')?.click();
  });
  document.getElementById('m-player-shazam')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-identify')?.click();
  });
  document.getElementById('m-player-info')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-player-info')?.click();
  });
  document.getElementById('m-player-share')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-share')?.click();
  });
  document.getElementById('m-player-quality')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-quality-mode')?.click();
  });
  document.getElementById('m-player-copy')?.addEventListener('click', () => {
    playerOptionsModal.style.display = 'none';
    document.getElementById('btn-copy-stream')?.click();
  });

  // 6. iOS Bottom Tab Bar Navigation
  document.querySelectorAll('.mobile-bottom-nav .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.dataset.tab;
      if (tabType) {
        document.querySelectorAll('.mobile-bottom-nav .nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Sincronizar com as abas do topo de desktop
        document.querySelectorAll('.view-tab').forEach(vt => {
          vt.classList.toggle('active', vt.dataset.tab === tabType);
        });

        state.currentTab = tabType;
        state.currentPage = 1;
        fetchStations();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  document.getElementById('nav-btn-top-charts')?.addEventListener('click', () => {
    document.getElementById('btn-top-charts')?.click();
  });

  document.getElementById('nav-btn-mobile-more')?.addEventListener('click', () => {
    mobileMenuModal.style.display = 'flex';
  });

  // Observador para sincronizar contagem de favoritas com o badge da barra móvel
  const favCounterEl = document.getElementById('fav-counter');
  if (favCounterEl && mobileFavCounter) {
    const observer = new MutationObserver(() => {
      mobileFavCounter.textContent = favCounterEl.textContent;
      mobileFavCounter.style.display = favCounterEl.textContent !== '0' ? 'inline-block' : 'none';
    });
    observer.observe(favCounterEl, { childList: true, characterData: true, subtree: true });
  }
}

// Iniciar aplicação
init();
setupPWA();
setupMobileExperience();


