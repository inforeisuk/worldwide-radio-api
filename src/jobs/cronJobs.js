import cron from 'node-cron';
import { LogoService } from '../services/logoService.js';

/**
 * Inicializa todas as tarefas agendadas (Cron Jobs) do servidor
 */
export function initCronJobs() {
  console.log('⏰ Inicializando Cron Jobs...');

  // Correr todos os dias às 03:00 da manhã
  cron.schedule('0 3 * * *', async () => {
    console.log('\n[CRON] 03:00 AM - Iniciando verificação diária de logótipos...');
    try {
      const result = await LogoService.repairAllCuratedLogos();
      console.log(`[CRON] Sucesso: Verificadas ${result.totalChecked} rádios.`);
      console.log(`[CRON] Reparados: ${result.totalRepaired} logótipos (conversão WebP).`);
      
      if (result.totalRepaired > 0) {
        console.log('[CRON] Logótipos atualizados:');
        result.repairedStations.forEach(r => {
          console.log(`  - ${r.name} -> ${r.newLogo}`);
        });
      }
    } catch (err) {
      console.error('[CRON] Erro na verificação noturna:', err);
    }
  });

  console.log('⏰ Cron Jobs ativos: Verificação de logos agendada para as 03:00 AM.');
}
