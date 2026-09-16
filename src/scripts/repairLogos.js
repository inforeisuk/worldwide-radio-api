import { LogoService } from '../services/logoService.js';

console.log('🚀 Iniciando rotina de verificação e auto-reparação de logótipos...\n');

try {
  const result = await LogoService.repairAllCuratedLogos();

  console.log('📊 Resumo da Execução:');
  console.log(`- Total de rádios analisadas: ${result.totalChecked}`);
  console.log(`- Total de logótipos reparados: ${result.totalRepaired}`);

  if (result.repairedStations && result.repairedStations.length > 0) {
    console.log('\n✨ Emissoras que tiveram logótipo atualizado/reparado:');
    result.repairedStations.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.country}] ${r.name} (${r.id})`);
      console.log(`     Antigo: ${r.oldLogo || '(nenhum)'}`);
      console.log(`     Novo:   ${r.newLogo}`);
    });
  } else {
    console.log('\n✅ Todos os logótipos já se encontram 100% funcionais e acessíveis.');
  }

  console.log('\n🎉 Processo concluído com sucesso!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Erro durante a reparação de logótipos:', err);
  process.exit(1);
}
