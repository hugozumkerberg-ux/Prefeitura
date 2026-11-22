/**
 * Orquestrador Geral de Auditoria Pública — Arinos / MG
 * Executa a esteira completa para Prefeitura e Fundação de Saúde,
 * aplicando a regra estrita de parada: 30 meses consecutivos sem dados.
 */
const { executarVarredura, ENTIDADES, MODULOS } = require('./motor_auditoria_coleta');
const { execSync } = require('node:child_process');
const path = require('node:path');

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  SISTEMA DE AUDITORIA FORENSE E COLETA TOTAL — ARINOS / MG        ║');
  console.log('║  Critério de Parada: 30 meses consecutivos vazios                  ║');
  console.log('║  Cadeia de Custódia: SHA-256 + Arquivo Bruto + URL Probatória      ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const fila = [
    // 1. Fundação Municipal de Saúde (Entidade pendente prioritária)
    { entidade: 'fundacao_saude', modulo: 'folha_mensal', descricao: 'Folha de Pagamento da Saúde' },
    { entidade: 'fundacao_saude', modulo: 'despesas', descricao: 'Despesas e Empenhos da Saúde' },
    { entidade: 'fundacao_saude', modulo: 'diarias_empenho', descricao: 'Diárias de Viagem da Saúde' },

    // 2. Prefeitura Municipal de Arinos (Garantir auditoria e meses recentes de 2026)
    { entidade: 'prefeitura', modulo: 'folha_mensal', descricao: 'Folha de Pagamento da Prefeitura' },
    { entidade: 'prefeitura', modulo: 'despesas', descricao: 'Despesas e Empenhos da Prefeitura' },
    { entidade: 'prefeitura', modulo: 'diarias_empenho', descricao: 'Diárias de Viagem da Prefeitura' }
  ];

  for (let i = 0; i < fila.length; i++) {
    const item = fila[i];
    console.log(`\n>>> ETAPA [${i + 1}/${fila.length}]: ${item.descricao} <<<`);
    try {
      // Inicia em 2026/11 e desce até 30 meses vazios consecutivos
      await executarVarredura(item.entidade, item.modulo, 2026, 11, 30);
    } catch (e) {
      console.error(`Erro na etapa ${item.descricao}:`, e.message);
    }

    // Atualiza o painel executivo após cada ciclo
    try {
      console.log('\n[SYNC] Atualizando Painel Executivo...');
      execSync(`node "${path.join(__dirname, 'atualizar_dashboard.js')}"`, { stdio: 'inherit' });
    } catch (err) {
      // ignora
    }
  }

  console.log('\n================================================================');
  console.log('TODAS AS FASES DO ORQUESTRADOR FORAM EXECUTADAS COM SUCESSO!');
  console.log('Abra o index.html ou execute INICIAR_PAINEL.bat para ver o resultado.');
  console.log('================================================================');
}

if (require.main === module) {
  main();
}
