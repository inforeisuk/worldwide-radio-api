import { Server } from 'socket.io';
import { StreamService } from './streamService.js';
import { MetadataService } from './metadataService.js';
import { DBService } from '../db/dbService.js';

export class SocketService {
  static io = null;
  static activeStations = new Set();
  static pollInterval = null;
  static lastPlayedCache = new Map(); // stationId -> { rawTitle, artist, song, albumArt }

  /**
   * Inicializa o servidor WebSockets
   */
  static init(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Permitir de qualquer origem (Apps móveis, web)
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Novo cliente Socket.io ligado: ${socket.id}`);

      // Quando o cliente escolhe uma estação, entra na "sala" dessa rádio
      socket.on('join_station', (stationId) => {
        // Sai de outras salas para não receber lixo
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.leave(room);
          }
        }
        
        socket.join(stationId);
        console.log(`🎧 Cliente ${socket.id} sintonizou na estação: ${stationId}`);
        
        // Atualiza a lista de estações ativas para o polling
        this.updateActiveStations();

        // Envia imediatamente a última música conhecida em cache para não esperar
        const lastMetadata = this.lastPlayedCache.get(stationId);
        if (lastMetadata) {
          socket.emit('now_playing', lastMetadata);
        }
      });

      // Quando o cliente sai (desliga a rádio)
      socket.on('leave_station', (stationId) => {
        socket.leave(stationId);
        this.updateActiveStations();
      });

      socket.on('disconnect', () => {
        console.log(`❌ Cliente Socket.io desligado: ${socket.id}`);
        this.updateActiveStations();
      });
    });

    // Inicia o motor que procura músicas novas a cada 10 segundos
    this.startPollingEngine();
  }

  /**
   * Varre todas as salas para saber quais as rádios que têm pessoas ativamente a ouvir
   */
  static updateActiveStations() {
    if (!this.io) return;
    
    const newActiveSet = new Set();
    const rooms = this.io.sockets.adapter.rooms;
    
    for (const [roomName, clients] of rooms.entries()) {
      // Ignora salas que são o próprio ID do cliente (default socket.io behavior)
      if (!this.io.sockets.sockets.has(roomName)) {
        if (clients.size > 0) {
          newActiveSet.add(roomName);
        }
      }
    }
    
    this.activeStations = newActiveSet;
  }

  /**
   * Motor em loop: Só gasta CPU a consultar a música das rádios que estão a ser ouvidas AGORA.
   */
  static startPollingEngine() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      if (this.activeStations.size === 0) return;

      const catalog = await DBService.getAllRadios();

      for (const stationId of this.activeStations) {
        try {
          const radio = catalog.find(r => r.id === stationId);
          if (!radio || !radio.streamUrl) continue;

          // Lê o Now Playing atual usando o nosso MetadataService (com cache integrada)
          // Se a stream usar Icecast, o getNowPlaying faz fetch. Se for normal, usa metadata fallback
          const np = await StreamService.getNowPlaying(radio.streamUrl);
          
          // Verificar se a música mudou desde a última vez
          const last = this.lastPlayedCache.get(stationId);
          
          if (!last || last.rawTitle !== np.raw) {
            // Nova música detetada! Vamos buscar a capa ao iTunes através do MetadataService
            // Isto é um truque: o getNowPlaying normal não faz a magia da Apple por si só,
            // temos de usar o fetchAlbumArt
            let appleData = { albumArtUrl: null, trackUrl: null };
            
            if (np.artist && np.title) {
              appleData = await MetadataService.fetchAlbumArt(np.artist, np.title);
            }

            const payload = {
              stationId: radio.id,
              stationName: radio.name,
              rawTitle: np.raw,
              artist: np.artist,
              song: np.title,
              albumArt: appleData.albumArtUrl,
              appleMusicUrl: appleData.trackUrl,
              timestamp: Date.now()
            };

            // Guarda na cache para os próximos utilizadores
            this.lastPlayedCache.set(stationId, payload);

            // EMPURRA a nova música para todos os telemóveis a ouvir esta rádio (Tempo Real)
            this.io.to(stationId).emit('now_playing', payload);
            console.log(`🎶 [WebSocket] Nova música empurrada para ${stationId}: ${np.raw}`);
          }

        } catch (err) {
          console.error(`Erro no polling WebSocket da estação ${stationId}:`, err.message);
        }
      }
    }, 10000); // Poll a cada 10 segundos
  }
}
