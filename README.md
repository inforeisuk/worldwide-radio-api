# 🌍 Worldwide Radio API & RadioTop Premium Integration

Uma API REST moderna, rápida e resiliente construída em **Node.js (Express)** para pesquisa, descoberta, streaming contínuo sem quebras de emissoras de rádio de todo o mundo, com **módulo de integração nativo para a aplicação móvel RadioTop Premium**.

---

## 🌟 Principais Destaques

1. **Streaming Contínuo & Anti-Quedas**:
   - **Watchdog Inteligente**: Monitoriza ativamente o áudio e efetua reconexão automática e transparente se o buffer congelar.
   - **Background Tab Keepalive**: `navigator.mediaSession` impede que o navegador congele o separador quando este fica em segundo plano.
   - **Suporte HLS (`Hls.js`)**: Transmissão ininterrupta para emissoras em formato `.m3u8`.
   - **Proxy Resiliente sem Timeout** (`/api/radios/:id/proxy`): Retransmissão com cabeçalhos CORS limpos e conexões ilimitadas.
2. **📱 Integração Nativa com a App RadioTop Premium**:
   - Módulo `/api/radiotop/*` que entrega estações formatadas **exatamente no modelo `RadioStation`** da aplicação móvel (Android Kotlin / iOS Swift).
   - Sincronização e backup de **Favoritos na Nuvem (Cloud Sync)** entre a aplicação móvel e a versão Web.
   - Endpoint **Now Playing** ultraleve para notificações e ecrã de bloqueio no telemóvel.
3. **Catálogo Híbrido Mundial**:
   - Catálogo curado local de alta performance com rádios emblemáticas mundiais.
   - Rede global descentralizada Radio-Browser com mais de 60.000 rádios e múltiplos mirrors de contingência.
4. **Web Player Avançado**:
   - Separadores rápidos para **Todas as Estações**, **⭐ Minhas Favoritas** e **🕒 Ouvidas Recentemente**.
   - **Sleep Timer (Temporizador de Desligamento)** para desligar o som automaticamente.
   - Informação em tempo real da música e artista que estão a tocar (**Now Playing**).
5. **Documentação Swagger UI**:
   - Especificação OpenAPI 3.0 completa acessível em `/docs`.

---

## 🚀 Como Executar

```bash
# Entrar na pasta do projeto
cd "/Users/renatoreis/Library/CloudStorage/GoogleDrive-rcprpt@gmail.com/O meu disco/API/Mundial"

# Instalar dependências
npm install

# Iniciar o servidor (Porta 3001)
npm start

# Modo de desenvolvimento (com hot-reload):
npm run dev

# Executar testes automatizados (20 testes):
npm test
```

---

## 🧭 Acesso Rápido

- 📻 **Web Player & Explorer**: [http://localhost:3001](http://localhost:3001)
- 📖 **Documentação Swagger UI**: [http://localhost:3001/docs](http://localhost:3001/docs)
- 📡 **Endpoint Geral de Rádios**: [http://localhost:3001/api/radios](http://localhost:3001/api/radios)
- 📱 **Catálogo RadioTop Premium**: [http://localhost:3001/api/radiotop/stations](http://localhost:3001/api/radiotop/stations)
- 📊 **Estatísticas da API**: [http://localhost:3001/api/stats](http://localhost:3001/api/stats)

---

## 📱 Módulo de Integração RadioTop Premium (`/api/radiotop`)

Este módulo foi desenhado para comunicar diretamente com o pacote `com.inforeis.radiotop`:

### 1. Obter Catálogo para a App
`GET /api/radiotop/stations?country=Portugal`

Retorna estações prontas para desserialização direta na classe `RadioStation`:
```json
{
  "app": "RadioTop Premium",
  "version": "1.0.0",
  "total": 40,
  "stations": [
    {
      "id": "antena1_pt",
      "originalId": "antena1-pt",
      "name": "Antena 1",
      "frequencyOrSlogan": "A rádio pública portuguesa com notícias, atualidade, cultura e informação.",
      "genre": "News / Talk / Public / Culture",
      "country": "Portugal",
      "countryCode": "PT",
      "city": "Lisboa",
      "streamUrl": "https://radiocast.rtp.pt/antena180a.mp3",
      "backupStreamUrl": "",
      "proxyStreamUrl": "/api/radios/antena1-pt/proxy",
      "logoUrl": "https://images.seeklogo.com/logo-png/1/1/antena-1-logo-png_seeklogo-15638.png",
      "logoColorHex": "0xFF0072CE",
      "bitRateKbps": 128,
      "isFavorite": false,
      "isFeatured": true,
      "isAutoPreset": true,
      "appTarget": "RadioTop Premium"
    }
  ]
}
```

### 2. Sincronização de Favoritos na Nuvem (Cloud Sync)
- **Salvar Favoritos**:
  `POST /api/radiotop/favorites`
  ```json
  {
    "deviceId": "meu-telemovel-ou-token-usuario",
    "stationIds": ["antena1-pt", "rfm-pt", "comercial-pt"]
  }
  ```
- **Recuperar Favoritos**:
  `GET /api/radiotop/favorites?deviceId=meu-telemovel-ou-token-usuario`

### 3. Now Playing para Notificações Móveis
`GET /api/radiotop/now-playing/:id`

Resposta instantânea e leve:
```json
{
  "stationId": "antena1-pt",
  "stationName": "Antena 1",
  "songTitle": "Nome da Música",
  "artist": "Nome do Artista",
  "fullTitle": "Artista - Música",
  "logoUrl": "..."
}
```

---

## 📡 Endpoints Gerais da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/radios/playlist.m3u` | Exportação de playlist M3U/M3U8 para VLC, IPTV e Smart TVs |
| `GET` | `/api/radios/nearby` | Rádios próximas de si por geolocalização ou código de país |
| `GET` | `/api/radios` | Listagem com filtros de país, continente, género e paginação |
| `GET` | `/api/radios/:id` | Detalhes de uma estação por ID ou UUID |
| `GET` | `/api/radios/:id/stream` | Redirecionamento 302 direto para o áudio |
| `GET` | `/api/radios/:id/proxy` | Streaming retransmitido sem timeout (Anti-Quedas) |
| `GET` | `/api/radios/:id/now-playing`| Metadados ao vivo (música e artista atual) |
| `GET` | `/api/radios/:id/info` | Perfil completo (frequências, programas, locutores, contactos, músicas) |
| `GET` | `/api/radios/:id/history` | Histórico das últimas músicas tocadas (Playlist History) |
| `GET` | `/api/radios/:id/frequencies` | Tabela de frequências FM/AM por distrito e cidade |
| `GET` | `/api/radios/random` | Rádio aleatória com filtros opcionais |
| `GET` | `/api/radios/top` | Rádios mais votadas mundialmente |
| `GET` | `/api/search` | Pesquisa unificada global |
| `GET` | `/api/countries` | Lista de países com contagens e bandeiras |
| `GET` | `/api/continents` | Continentes e respetivos países |
| `GET` | `/api/genres` | Géneros e categorias musicais mais populares |
| `GET` | `/api/stats` | Status e contagens operacionais em tempo real |
| `GET` | `/api/radiotop/stations/:id/info` | Informações formatadas para os ecrãs móveis do RadioTop |

---

## 🎛️ Novas Funcionalidades Multimédia (Web Player PRO)

1. **📥 Exportador M3U / M3U8 (`/api/radios/playlist.m3u`)**:
   - Permite descarregar as emissoras com metadados `#EXTINF` para importar diretamente no **VLC Player**, **Kodi**, **Smart TVs** ou reprodutores de IPTV.
2. **🎚️ Equalizador Web Audio API de 5 Bandas**:
   - Ajuste em tempo real de graves, médios e agudos (60Hz, 250Hz, 1kHz, 4kHz, 12kHz).
   - Presets prontos com 1 clique: *Plano (Flat)*, *Bass Boost*, *Voz Clara (Talk/News)*, *Pop*, *Rock*, *Eletrónica*, *Acústico*.
3. **🔴 Gravador de Áudio ao Vivo (Live Stream Recorder)**:
   - Grava a transmissão em direto diretamente no navegador através da `MediaRecorder` API.
   - Gera ficheiros `.webm` com timestamp prontos para ouvir offline.
4. **🎧 Ações Rápidas Spotify & YouTube**:
   - Botões de pesquisa direta na barra de reprodução e em cada faixa do histórico de músicas tocadas.
5. **🚗 Modo Carro (Car Mode)**:
   - Interface em ecrã completo com fundo OLED de alto contraste.
   - Relógio digital grande, metadados bem visíveis e botões táteis extragrandes para condução segura.
6. **📱 Progressive Web App (PWA)**:
   - Suporte a instalação como aplicação nativa no computador e telemóvel com `manifest.json` e `sw.js` (Service Worker).
7. **📍 Rádios Próximas de Mim (`/api/radios/nearby`)**:
   - Deteção inteligente de localização para oferecer imediatamente as rádios locais com 1 toque.
8. **🏆 Top 40 Airplay Charts (`/api/charts/top-tracks`)**:
   - Agregação consolidada das músicas mais rodadas nas emissoras em tempo real, com contagem de execuções (*spins*), estatísticas e atalhos diretos para Spotify, YouTube e Letras.
9. **🎙️ Podcasts e Rádio Gravada (`/api/radios/:id/podcasts` e `/api/podcasts/:podcastId`)**:
   - Módulo completo de *Catch-up Radio* com episódios, sinopses e reprodução direta com controlos de áudio dedicados.
10. **⏰ Despertador Rádio Inteligente**:
    - Permite definir a hora e dias de repetição para acordar ao som da rádio favorita, com aumento progressivo suave de volume (*fade-in*) ao longo de 60 segundos.
11. **📶 Seletor de Qualidade e Modo Poupança de Dados (HQ vs LQ)**:
    - Alternância dinâmica entre streams de alta fidelidade e modo económico (ótimo para consumo reduzido de dados móveis 3G/4G/5G).
12. **🩺 Monitor de Saúde e Latência em Tempo Real (`/api/radios/:id/health`)**:
    - Sonda ativamente a integridade do stream e reporta a latência em ms, com badge visual dinâmico no reprodutor (🟢 <300ms, 🟡 300-800ms, 🔴 offline).
13. **🎤 Letras de Música em Tempo Real (`/api/lyrics`)**:
    - Pesquisa automática de letras sincronizadas/texto simples através de integração LRCLIB e lyrics.ovh com cache de memória.

---

## 🚀 Guia de Implementação em Produção: Proxmox LXC + Cloudflare Tunnel

Esta arquitetura é a mais recomendada porque:
- **Zero Port-Forwarding:** Não precisas de abrir nenhuma porta (80/443) no router de tua casa (imune a bloqueios de CGNAT da MEO, NOS, Vodafone).
- **HTTPS e Certificado SSL Automático:** Gerido gratuitamente pela Cloudflare Edge.
- **Proteção contra ataques DDoS e WAF Gratuito.**
- **Consumo Mínimo no Proxmox:** Um contentor LXC Debian/Ubuntu consome apenas cerca de 128MB a 256MB de RAM.

### Passo 1: Criar o Contentor LXC no Proxmox
1. No painel do teu Proxmox VE, clica em **Create CT**.
2. **Template:** Escolhe `debian-12-standard` ou `ubuntu-22.04-standard`.
3. **Disks:** 8 GB são mais do que suficientes.
4. **CPU:** 1 ou 2 Cores.
5. **Memory:** 512 MB RAM (ou 1024 MB).
6. **Network:** Configura em modo DHCP ou com um IP estático na tua rede local (ex: `192.168.1.150/24`, Gateway: `192.168.1.1`).
7. Inicia o contentor LXC.

### Passo 2: Instalar Node.js e PM2 no Contentor
No terminal do teu LXC (Console do Proxmox), executa:

```bash
# Atualizar repositórios do sistema
apt update && apt upgrade -y
apt install -y curl git build-essential

# Instalar Node.js 20 LTS ou 22
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar o gestor de processos PM2 globalmente
npm install -g pm2
```

### Passo 3: Clonar e Iniciar o Servidor da API
```bash
# Criar diretoria para a aplicação
mkdir -p /var/www/radio-api
cd /var/www/radio-api

# Copia os ficheiros do teu projeto para esta pasta (ou faz git clone)
# Executa a instalação de dependências
npm install --production

# Iniciar a API com PM2 em modo de produção
pm2 start src/index.js --name "radio-api"

# Configurar o PM2 para arrancar automaticamente se o Proxmox reiniciar
pm2 startup
pm2 save
```

Para verificar o estado do servidor:
```bash
pm2 status
pm2 logs radio-api
curl http://localhost:3001/api/stats
```

### Passo 4: Conectar ao Cloudflare Tunnel (cloudflared)
Como já tens um domínio configurado na Cloudflare:

1. Acede ao painel **Cloudflare Zero Trust** (ou no dashboard do teu domínio -> **Access** / **Tunnels**).
2. Vai a **Networks** > **Tunnels** > **Create a tunnel**.
3. Seleciona o tipo **Cloudflare (cloudflared)** e atribui um nome (ex: `radio-home-server`).
4. A Cloudflare fornecerá um comando pronto para instalar o conector no Debian/Ubuntu. Executa-o no terminal do LXC:
   ```bash
   # Exemplo do comando fornecido pela Cloudflare:
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   dpkg -i cloudflared.deb
   cloudflared service install <O_TEU_TOKEN_SECRETO_CLOUDFLARE>
   ```
5. No separador **Public Hostnames** da Cloudflare:
   - **Subdomínio:** `radio` (ou `api-radio`)
   - **Domínio:** seleciona o teu domínio configurado na Cloudflare (ex: `oteudominio.com`)
   - **Type:** `HTTP`
   - **URL:** `localhost:3001`
6. Clica em **Save hostname**.

🎉 **Pronto!** A tua API e o teu Web Player estarão online mundialmente em `https://radio.oteudominio.com` com HTTPS de alta velocidade, cache inteligente da Cloudflare e alta disponibilidade.

