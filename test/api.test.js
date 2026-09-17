import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/index.js';

describe('Worldwide Radio API Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Iniciar servidor em porta efêmera para testes
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /api/radios deve retornar lista de emissoras curadas paginadas', async () => {
    const res = await fetch(`${baseUrl}/api/radios?limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.total > 0, 'Total deve ser superior a zero');
    assert.ok(Array.isArray(body.data), 'Data deve ser um array');
    assert.equal(body.data.length, 10);
    assert.ok(body.data[0].id);
    assert.ok(body.data[0].name);
    assert.ok(body.data[0].streamUrl);
  });

  test('GET /api/radios com filtro de país deve retornar apenas emissoras daquele país', async () => {
    const res = await fetch(`${baseUrl}/api/radios?country=Portugal`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.data.length > 0);
    for (const radio of body.data) {
      assert.equal(radio.country, 'Portugal');
      assert.equal(radio.countryCode, 'PT');
    }
  });

  test('GET /api/radios com filtro de género musical', async () => {
    const res = await fetch(`${baseUrl}/api/radios?genre=News`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.data.length > 0);
    for (const radio of body.data) {
      assert.ok(radio.genres.some(g => g.toLowerCase().includes('news')));
    }
  });

  test('GET /api/radios/:id retorna detalhes de uma rádio existente', async () => {
    const res = await fetch(`${baseUrl}/api/radios/antena1-pt`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.data.id, 'antena1-pt');
    assert.equal(body.data.name, 'Antena 1');
    assert.equal(body.data.countryCode, 'PT');
  });

  test('GET /api/radios/:id retorna 404 para ID inexistente', async () => {
    const res = await fetch(`${baseUrl}/api/radios/estacao-que-nao-existe-99999`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Not Found');
  });

  test('GET /api/radios/:id/stream deve responder com 302 Redirect', async () => {
    const res = await fetch(`${baseUrl}/api/radios/antena1-pt/stream`, {
      redirect: 'manual'
    });
    assert.equal(res.status, 302);
    const location = res.headers.get('location');
    assert.ok(location, 'Deve conter cabeçalho Location');
    assert.ok(location.startsWith('http'), 'Location deve ser um URL válido');
  });

  test('GET /api/radios/random retorna uma rádio aleatória', async () => {
    const res = await fetch(`${baseUrl}/api/radios/random`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.ok(body.data.name);
    assert.ok(body.data.streamUrl);
  });

  test('GET /api/radios/top retorna rádios ordenadas por popularidade', async () => {
    const res = await fetch(`${baseUrl}/api/radios/top?limit=5`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  test('GET /api/search pesquisa estações por palavra-chave', async () => {
    const res = await fetch(`${baseUrl}/api/search?q=BBC`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.data);
    assert.ok(body.data.curated.length > 0);
    assert.ok(body.data.curated.some(r => r.name.includes('BBC')));
  });

  test('GET /api/countries retorna lista de países com contagens', async () => {
    const res = await fetch(`${baseUrl}/api/countries`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total > 0);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.some(c => c.code === 'PT'));
  });

  test('GET /api/continents retorna agrupamento por continentes', async () => {
    const res = await fetch(`${baseUrl}/api/continents`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total > 0);
    assert.ok(body.data.some(c => c.continent === 'Europe'));
  });

  test('GET /api/genres retorna lista de categorias e géneros', async () => {
    const res = await fetch(`${baseUrl}/api/genres?limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total > 0);
    assert.ok(Array.isArray(body.data));
  });

  test('GET /api/languages retorna lista de línguas', async () => {
    const res = await fetch(`${baseUrl}/api/languages`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total > 0);
    assert.ok(body.data.some(l => l.code === 'pt'));
  });

  test('GET /api/stats retorna status e métricas operacionais', async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'online');
    assert.ok(body.stats.curatedStationsCount > 0);
    assert.ok(body.stats.supportedCountriesCount > 0);
  });

  test('GET /api/radios/:id/now-playing retorna metadados da rádio', async () => {
    const res = await fetch(`${baseUrl}/api/radios/antena1-pt/now-playing`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, 'antena1-pt');
    assert.ok(body.nowPlaying);
    assert.ok(body.nowPlaying.raw);
  });

  test('GET /api/radios/:id/proxy conecta ao fluxo sem erro', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${baseUrl}/api/radios/antena1-pt/proxy`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      assert.ok(res.status === 200 || res.status === 302);
    } catch (err) {
      clearTimeout(timeout);
      // O abort é normal pois é um stream contínuo infinito
      assert.ok(err.name === 'AbortError' || err.name === 'TypeError');
    }
  });

  test('GET /api/radiotop/stations retorna modelo nativo RadioStation', async () => {
    const res = await fetch(`${baseUrl}/api/radiotop/stations?country=Portugal`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.app, 'RadioTop Premium');
    assert.ok(Array.isArray(body.stations));
    assert.ok(body.stations.length > 0);

    const station = body.stations[0];
    assert.ok(station.id);
    assert.ok(station.name);
    assert.ok(station.frequencyOrSlogan);
    assert.ok(station.logoColorHex);
    assert.equal(station.appTarget, 'RadioTop Premium');
  });

  test('GET /api/radiotop/countries retorna lista de países com contagens', async () => {
    const res = await fetch(`${baseUrl}/api/radiotop/countries`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total > 0);
    assert.ok(Array.isArray(body.countries));
  });

  test('POST e GET /api/radiotop/favorites sincroniza favoritos na nuvem', async () => {
    const testDeviceId = 'test-device-123';
    const favIds = ['antena1-pt', 'rfm-pt'];

    // 1. Salvar favoritos
    const postRes = await fetch(`${baseUrl}/api/radiotop/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: testDeviceId,
        stationIds: favIds
      })
    });
    assert.equal(postRes.status, 200);
    const postBody = await postRes.json();
    assert.equal(postBody.success, true);
    assert.equal(postBody.savedCount, 2);

    // 2. Recuperar favoritos salvos
    const getRes = await fetch(`${baseUrl}/api/radiotop/favorites?deviceId=${testDeviceId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.deviceId, testDeviceId);
    assert.equal(getBody.total, 2);
    assert.ok(getBody.favorites.some(s => s.originalId === 'antena1-pt'));
  });

  test('GET /api/radiotop/now-playing/:id retorna título simplificado para a app móvel', async () => {
    const res = await fetch(`${baseUrl}/api/radiotop/now-playing/antena1-pt`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.stationId, 'antena1-pt');
    assert.ok(body.songTitle);
  });

  test('GET /api/radios/:id/info retorna perfil completo da emissora (estilo radios-online.pt)', async () => {
    const res = await fetch(`${baseUrl}/api/radios/radio-comercial-pt/info`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.id, 'radio-comercial-pt');
    assert.equal(body.name, 'Rádio Comercial');
    assert.ok(body.slogan, 'Deve conter slogan');
    assert.ok(body.about, 'Deve conter descrição detalhada');
    assert.ok(Array.isArray(body.frequencies), 'Deve conter frequências');
    assert.ok(body.frequencies.some(f => f.city === 'Lisboa'));
    assert.ok(body.contacts.phone, 'Deve conter telefone');
    assert.ok(body.contacts.website, 'Deve conter website');
    assert.ok(Array.isArray(body.recentTracks), 'Deve conter histórico recente');
    assert.ok(body.recentTracks.length > 0);
  });

  test('GET /api/radios/:id/history retorna histórico de faixas tocadas', async () => {
    const res = await fetch(`${baseUrl}/api/radios/radio-comercial-pt/history?limit=10`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.stationId, 'radio-comercial-pt');
    assert.ok(Array.isArray(body.tracks));
    assert.equal(body.tracks.length, 10);
    assert.ok(body.tracks[0].playedAt);
    assert.ok(body.tracks[0].artist);
    assert.ok(body.tracks[0].title);
  });

  test('GET /api/radios/:id/frequencies retorna lista de frequências FM por cidade', async () => {
    const res = await fetch(`${baseUrl}/api/radios/radio-comercial-pt/frequencies`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.stationId, 'radio-comercial-pt');
    assert.ok(Array.isArray(body.frequencies));
    assert.ok(body.frequencies.some(f => f.city.includes('Porto')));
  });

  test('GET /api/radiotop/stations/:id/info retorna dados formatados para a app RadioTop', async () => {
    const res = await fetch(`${baseUrl}/api/radiotop/stations/radio-comercial-pt/info`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.appTarget, 'RadioTop Premium');
    assert.ok(body.id.includes('comercial'));
    assert.ok(Array.isArray(body.frequencies));
    assert.ok(body.contacts.website);
    assert.ok(Array.isArray(body.recentTracks));
  });

  test('GET /api/radios/playlist.m3u gera ficheiro M3U válido para VLC e Smart TVs', async () => {
    const res = await fetch(`${baseUrl}/api/radios/playlist.m3u?limit=10`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('audio/x-mpegurl'));
    assert.ok(res.headers.get('content-disposition').includes('attachment; filename="radios.m3u"'));

    const text = await res.text();
    assert.ok(text.startsWith('#EXTM3U'), 'Deve começar com a tag padrão #EXTM3U');
    assert.ok(text.includes('#EXTINF:-1'), 'Deve conter metadados de estações #EXTINF');
    assert.ok(text.includes('http'), 'Deve conter URLs diretos de áudio');
  });

  test('GET /api/radios/playlist.m3u com filtro por país exporta apenas emissoras desse país', async () => {
    const res = await fetch(`${baseUrl}/api/radios/playlist.m3u?country=Portugal`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Antena 1') || text.includes('Comercial'));
    assert.ok(text.includes('Portugal'));
  });

  test('GET /api/radios/nearby retorna emissoras próximas com base no país', async () => {
    const res = await fetch(`${baseUrl}/api/radios/nearby?countrycode=PT&limit=5`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.detectedCountryCode, 'PT');
    assert.ok(Array.isArray(body.stations));
    assert.ok(body.total > 0);
    assert.ok(body.stations[0].countryCode === 'PT');
  });
  test('GET /api/charts/top-tracks retorna ranking Top 40 consolidado', async () => {
    const res = await fetch(`${baseUrl}/api/charts/top-tracks?limit=20`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(Array.isArray(body.chart));
    assert.ok(body.chart.length > 0);
    assert.ok(body.total > 0);

    const first = body.chart[0];
    assert.equal(first.rank, 1);
    assert.ok(first.artist);
    assert.ok(first.title);
    assert.ok(first.spins > 0);
    assert.ok(first.spotifyUrl);
    assert.ok(first.youtubeUrl);
  });

  test('GET /api/radios/:id/podcasts retorna podcasts associados à rádio', async () => {
    const res = await fetch(`${baseUrl}/api/radios/radio-comercial-pt/podcasts`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.stationId, 'radio-comercial-pt');
    assert.ok(Array.isArray(body.podcasts));
    assert.ok(body.podcasts.length > 0);

    const pod = body.podcasts[0];
    assert.ok(pod.id);
    assert.ok(pod.title);
    assert.ok(Array.isArray(pod.episodes));
    assert.ok(pod.episodes.length > 0);
    assert.ok(pod.episodes[0].audioUrl);
  });

  test('GET /api/podcasts/:podcastId retorna episódios de um podcast específico', async () => {
    const res = await fetch(`${baseUrl}/api/podcasts/homem-mordeu-cao`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.id, 'homem-mordeu-cao');
    assert.ok(body.title.includes('Homem'));
    assert.ok(Array.isArray(body.episodes));
    assert.ok(body.episodes.length > 0);
  });

  test('GET /api/podcasts/episodes/latest retorna novidades de podcasts', async () => {
    const res = await fetch(`${baseUrl}/api/podcasts/episodes/latest?limit=5`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.total > 0);
    assert.ok(Array.isArray(body.episodes));
    assert.ok(body.episodes.length > 0);
    assert.ok(body.episodes[0].podcastTitle);
  });

  test('GET /api/radios/:id/health retorna status de latência e stream online', async () => {
    const res = await fetch(`${baseUrl}/api/radios/antena1-pt/health`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.id, 'antena1-pt');
    assert.ok(body.health);
    assert.ok(['online', 'offline'].includes(body.health.status));
    assert.ok(typeof body.health.latencyMs === 'number');
    assert.ok(body.health.checkedAt);
  });

  test('GET /api/lyrics busca letra da música ou retorna 404 com info amigável', async () => {
    const res = await fetch(`${baseUrl}/api/lyrics?artist=Coldplay&title=Yellow`);
    const body = await res.json();
    assert.ok([200, 404].includes(res.status));
    assert.equal(body.title, 'Yellow');
    if (res.status === 200) {
      assert.ok(body.lyrics);
    } else {
      assert.ok(body.message);
    }
  });

  test('GET /api/radios/:id/identify identifica música em direto estilo Shazam', async () => {
    const res = await fetch(`${baseUrl}/api/radios/radio-comercial-pt/identify`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.equal(body.stationId, 'radio-comercial-pt');
    assert.ok(body.identification);
    assert.ok(body.identification.track);
    assert.ok(body.identification.artist);
    assert.ok(body.identification.streamingLinks);
    assert.ok(body.identification.streamingLinks.spotify);
    assert.ok(body.identification.streamingLinks.youtube);
  });

  test('GET /api/radiotop/artists/now-playing retorna artistas a tocar nas rádios principais', async () => {
    const res = await fetch(`${baseUrl}/api/radiotop/artists/now-playing`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.ok(Array.isArray(body.nowPlaying));
    assert.ok(body.totalStationsChecked > 0);
  });

  test('POST /api/radiotop/artists/radar pesquisa artistas em direto nas emissoras', async () => {
    const res = await fetch(`${baseUrl}/api/radiotop/artists/radar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artists: ['Coldplay', 'Dua Lipa', 'Bárbara'] })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'success');
    assert.ok(Array.isArray(body.matches));
    assert.ok(Array.isArray(body.searchedArtists));
  });

  test('GET /api/radiotop/car/browse retorna árvore de navegação para Android Auto e Apple CarPlay', async () => {
    const rootRes = await fetch(`${baseUrl}/api/radiotop/car/browse`);
    assert.equal(rootRes.status, 200);
    const rootBody = await rootRes.json();
    assert.equal(rootBody.status, 'success');
    assert.equal(rootBody.nodeId, 'root');
    assert.ok(Array.isArray(rootBody.items));
    assert.ok(rootBody.items.length >= 3);

    // Navegar para o nó 'countries'
    const countriesRes = await fetch(`${baseUrl}/api/radiotop/car/browse?nodeId=countries`);
    assert.equal(countriesRes.status, 200);
    const countriesBody = await countriesRes.json();
    assert.equal(countriesBody.nodeId, 'countries');
    assert.ok(countriesBody.items.length > 0);
  });

  test('GET /api/radios/:id/logo resolve logótipo de rádio com redirecionamento 302 ou SVG', async () => {
    const res = await fetch(`${baseUrl}/api/radios/antena1-pt/logo`, { redirect: 'manual' });
    assert.ok(res.status === 302 || res.status === 200);
    if (res.status === 302) {
      assert.ok(res.headers.get('location'));
    } else {
      const ct = res.headers.get('content-type');
      assert.ok(ct.includes('svg'));
    }
  });

  test('GET /api/radios/:id/logo para emissora desconhecida retorna SVG badge elegante com 200', async () => {
    const res = await fetch(`${baseUrl}/api/radios/estacao-inexistente-12345/logo`);
    assert.equal(res.status, 200);
    const ct = res.headers.get('content-type');
    assert.ok(ct.includes('svg'));
    const svgText = await res.text();
    assert.ok(svgText.includes('<svg'));
  });

  test('PUT /api/radios/:id/logo permite atualizar manualmente logótipo', async () => {
    const testUrl = 'https://www.google.com/s2/favicons?domain=antena1.rtp.pt&sz=128';
    const res = await fetch(`${baseUrl}/api/radios/antena1-pt/logo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: testUrl })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.station.logo, testUrl);
  });

  test('POST /api/radios/repair-logos executa a rotina de auto-cura em lote', async () => {
    const res = await fetch(`${baseUrl}/api/radios/repair-logos`, { method: 'POST' });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.totalChecked > 0);
    assert.ok(typeof body.totalRepaired === 'number');
  });

  test('GET /api/diagnostics retorna telemetria do sistema, memória e status saudável', async () => {
    const res = await fetch(`${baseUrl}/api/diagnostics`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'healthy');
    assert.ok(body.memory.heapUsedMB > 0);
    assert.ok(body.system.nodeVersion);
    assert.ok(typeof body.traffic.activeStreamListeners === 'number');
    assert.equal(body.catalog.multiStreamFailover, 'active');
  });

  test('Headers de Segurança HTTP e Rate Limiting presentes na resposta', async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok(res.headers.get('ratelimit-limit'), 'Deve conter header de rate limit');
  });
});



