const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const BASE = path.resolve(__dirname, '../dados');
const dbs = [
  'arinos_transparencia_master.sqlite3',
  'contracheques_detalhados_master.sqlite3',
  'auditoria/arinos_auditoria_master.sqlite3'
];

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║       RELATÓRIO DIAGNÓSTICO DOS BANCOS DE DADOS — ARINOS / MG                ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

for (const dbRel of dbs) {
  const fullPath = path.join(BASE, dbRel);
  console.log('================================================================================');
  console.log('ARQUIVO:', dbRel);
  
  if (!fs.existsSync(fullPath)) {
    console.log('  ❌ Arquivo não encontrado!');
    continue;
  }

  const stat = fs.statSync(fullPath);
  console.log('  Tamanho em Disco:', (stat.size / (1024 * 1024)).toFixed(2), 'MB (' + stat.size.toLocaleString('pt-BR') + ' bytes)');

  // Verificar se há arquivos WAL ou SHM
  const walPath = fullPath + '-wal';
  const shmPath = fullPath + '-shm';
  if (fs.existsSync(walPath)) {
    const walStat = fs.statSync(walPath);
    console.log('  Arquivo WAL:', (walStat.size / (1024 * 1024)).toFixed(2), 'MB');
  }
  if (fs.existsSync(shmPath)) {
    const shmStat = fs.statSync(shmPath);
    console.log('  Arquivo SHM:', (shmStat.size / 1024).toFixed(2), 'KB');
  }

  try {
    const db = new DatabaseSync(fullPath, { readOnly: true });
    
    // 1. Integridade
    const check = db.prepare('PRAGMA quick_check').get();
    const statusIntegridade = check ? (check.quick_check || Object.values(check)[0]) : 'desconhecido';
    console.log('  Integridade Física (quick_check):', statusIntegridade === 'ok' ? '✔ 100% ÍNTEGRO (ok)' : '⚠ ' + statusIntegridade);

    // 2. Pragmas de desempenho
    try {
      const jMode = db.prepare('PRAGMA journal_mode').get();
      console.log('  Modo Journal:', Object.values(jMode)[0]);
    } catch {}

    // 3. Tabelas e Contagens
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    console.log(`\n  TABELAS EXISTENTES (${tables.length}):`);
    
    let totalLinhasDb = 0;
    for (const t of tables) {
      try {
        const count = db.prepare(`SELECT count(*) as c FROM "${t.name}"`).get().c;
        totalLinhasDb += count;
        
        // Detalhes adicionais para tabelas com valores financeiros
        let extraInfo = '';
        if (t.name === 'contracheques') {
          const fin = db.prepare('SELECT sum(total_proventos) as s, min(ano) as a1, max(ano) as a2 FROM contracheques').get();
          extraInfo = ` | R$ ${(fin.s || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${fin.a1} a ${fin.a2})`;
        } else if (t.name === 'despesas') {
          const fin = db.prepare('SELECT sum(valor) as s, min(ano) as a1, max(ano) as a2 FROM despesas').get();
          extraInfo = ` | R$ ${(fin.s || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${fin.a1} a ${fin.a2})`;
        } else if (t.name === 'diarias') {
          const fin = db.prepare('SELECT sum(valor) as s, min(ano) as a1, max(ano) as a2 FROM diarias').get();
          extraInfo = ` | R$ ${(fin.s || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${fin.a1} a ${fin.a2})`;
        } else if (t.name === 'contratos') {
          const fin = db.prepare('SELECT sum(valor) as s FROM contratos').get();
          extraInfo = ` | R$ ${(fin.s || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (t.name === 'receitas') {
          const fin = db.prepare('SELECT sum(valor) as s FROM receitas').get();
          extraInfo = ` | R$ ${(fin.s || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (t.name === 'convenios') {
          const fin = db.prepare('SELECT sum(valor_convenio) as s FROM convenios').get();
          extraInfo = ` | R$ ${(fin.s || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        console.log(`    • ${t.name.padEnd(28)}: ${count.toLocaleString('pt-BR').padStart(9)} registros${extraInfo}`);
      } catch (err) {
        console.log(`    • ${t.name.padEnd(28)}: erro (${err.message})`);
      }
    }
    console.log(`\n  Total de Linhas no Banco: ${totalLinhasDb.toLocaleString('pt-BR')}`);

    // 4. Índices
    const indices = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'").get().c;
    console.log(`  Índices de Performance Criados: ${indices}`);

    db.close();
  } catch (err) {
    console.log('  ❌ Erro ao abrir banco:', err.message);
  }
}

// Verificar processo externo do scraper de contracheques detalhados
console.log('\n================================================================================');
console.log('STATUS DO SCRAPER EM SEGUNDO PLANO:');
const { execSync } = require('child_process');
try {
  const pList = execSync('powershell -Command "Get-Process -Id 20764 -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU, WorkingSet64"').toString().trim();
  if (pList) {
    console.log('  ✔ Processo PID 20764 ATIVO:', pList);
  } else {
    console.log('  ℹ Processo PID 20764 não está mais em execução.');
  }
} catch {
  console.log('  ℹ Processo PID 20764 finalizado ou não localizado.');
}

console.log('================================================================================\n');
