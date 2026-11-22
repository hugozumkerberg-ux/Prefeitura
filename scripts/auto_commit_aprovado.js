/**
 * ==============================================================================
 * SISTEMA AUTOMATIZADO DE TESTES, COMMIT E PUBLICAÇÃO — ARINOS / MG
 * ==============================================================================
 * Executa uma bateria completa de testes de integridade e qualidade.
 * Somente quando 100% dos testes são APROVADOS, o sistema:
 *   1. Gera um commit automático detalhado no Git.
 *   2. Publica (push) as alterações no repositório privado configurado.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const DADOS_DIR = path.join(BASE_DIR, 'dados');
const MASTER_DB = path.join(DADOS_DIR, 'arinos_transparencia_master.sqlite3');

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║       SISTEMA DE TESTES, COMMIT AUTOMÁTICO E PUBLICAÇÃO — ARINOS / MG        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

const testResults = [];

function recordTest(name, passed, details) {
  testResults.push({ name, passed, details });
  const icon = passed ? '✔ [APROVADO]' : '❌ [REPROVADO]';
  console.log(`  ${icon} ${name} — ${details}`);
}

async function runTestSuite() {
  console.log('1. Executando Bateria de Testes de Integridade e Qualidade...\n');

  // TESTE 1: Integridade do Banco SQLite Master
  try {
    if (!fs.existsSync(MASTER_DB)) {
      recordTest('Banco SQLite Master', false, 'Arquivo arinos_transparencia_master.sqlite3 não encontrado.');
    } else {
      const db = new DatabaseSync(MASTER_DB, { readOnly: true });
      const check = db.prepare('PRAGMA quick_check').get();
      db.close();
      if (check && (check.quick_check === 'ok' || Object.values(check)[0] === 'ok')) {
        recordTest('Banco SQLite Master', true, 'Integridade física e estrutural verificada (quick_check = ok).');
      } else {
        recordTest('Banco SQLite Master', false, 'Falha no PRAGMA quick_check.');
      }
    }
  } catch (err) {
    recordTest('Banco SQLite Master', false, `Erro ao verificar banco: ${err.message}`);
  }

  // TESTE 2: Existência e Estrutura dos Arquivos HTML Centrais
  const requiredHtmls = [
    'index.html',
    'empresas.html',
    'vereadores.html',
    'mandatos.html',
    'cidade.html',
    'eleicoes.html',
    'tabelas.html',
    'mapa.html',
    'administrativo.html'
  ];

  let htmlsOk = true;
  const missingHtmls = [];
  for (const h of requiredHtmls) {
    const fullPath = path.join(BASE_DIR, h);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size < 500) {
      htmlsOk = false;
      missingHtmls.push(h);
    }
  }

  if (htmlsOk) {
    recordTest('Páginas HTML Centrais', true, `Todas as ${requiredHtmls.length} páginas do portal verificadas e íntegras.`);
  } else {
    recordTest('Páginas HTML Centrais', false, `Páginas ausentes ou corrompidas: ${missingHtmls.join(', ')}`);
  }

  // TESTE 3: Validação Sintática dos JSONs Master
  const requiredJsons = [
    'dados/resumo_geral.json',
    'dados/status_coleta.json',
    'dados/empresas/arinos_empresas_master.json',
    'dados/viagens/arinos_viagens_master.json',
    'dados/camara/arinos_camara_master.json',
    'dados/turismo/arinos_turismo_master.json',
    'dados/eleicoes/eleicoes_master.json'
  ];

  let jsonsOk = true;
  let jsonErrors = [];
  for (const j of requiredJsons) {
    const fullPath = path.join(BASE_DIR, j);
    if (!fs.existsSync(fullPath)) {
      jsonsOk = false;
      jsonErrors.push(`${j} (ausente)`);
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        JSON.parse(content);
      } catch (e) {
        jsonsOk = false;
        jsonErrors.push(`${j} (sintaxe inválida: ${e.message})`);
      }
    }
  }

  if (jsonsOk) {
    recordTest('Catálogos JSON Master', true, `Todos os ${requiredJsons.length} catálogos JSON validados sintaticamente.`);
  } else {
    recordTest('Catálogos JSON Master', false, `Erros nos arquivos JSON: ${jsonErrors.join(', ')}`);
  }

  // TESTE 4: Teste de API do Servidor Local (porta 8088)
  const apiTestPromise = new Promise((resolve) => {
    const req = http.get('http://localhost:8088/api/live', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.contracheques || parsed.despesas || parsed.dados_gerais) {
              resolve({ ok: true, details: 'API /api/live respondendo com sucesso (200 OK).' });
            } else {
              resolve({ ok: true, details: 'API /api/live respondendo (200 OK).' });
            }
          } catch {
            resolve({ ok: false, details: 'Resposta da API não é um JSON válido.' });
          }
        } else {
          resolve({ ok: false, details: `Servidor retornou status HTTP ${res.statusCode}.` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, details: `Servidor na porta 8088 não respondeu: ${err.message}` });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ ok: false, details: 'Timeout na requisição à API.' });
    });
  });

  const apiResult = await apiTestPromise;
  recordTest('API do Servidor Local (:8088)', apiResult.ok, apiResult.details);

  // TESTE 5: Validação da Resolução de Entidades e Tabela pessoas_unificadas
  try {
    const db = new DatabaseSync(MASTER_DB, { readOnly: true });
    const countPessoas = db.prepare('SELECT count(*) as total, sum(total_dinheiro_publico) as volume FROM pessoas_unificadas').get();
    db.close();

    if (countPessoas && countPessoas.total >= 2800 && countPessoas.volume > 300000000) {
      recordTest('Resolução de Entidades (pessoas_unificadas)', true, `${countPessoas.total.toLocaleString('pt-BR')} perfis consolidados com R$ ${(countPessoas.volume / 1e6).toFixed(2)} Mi de dinheiro público rastreado.`);
    } else {
      recordTest('Resolução de Entidades (pessoas_unificadas)', false, 'Tabela pessoas_unificadas ausente ou com contagem inconsistente.');
    }
  } catch (err) {
    recordTest('Resolução de Entidades (pessoas_unificadas)', false, `Erro ao verificar pessoas_unificadas: ${err.message}`);
  }

  // TESTE 6: Higiene do Repositório Git (Zero inclusão de dados/ e scripts *.bat)
  try {
    const porcelainStatus = execSync('git status --porcelain', { cwd: BASE_DIR }).toString();
    const illegalFiles = porcelainStatus.split('\n')
      .filter(line => /^[AM?]\s+/.test(line.trim()))
      .map(line => line.trim().replace(/^[AM?]+\s+/, ''))
      .filter(f => f.startsWith('dados/') || f.includes('/dados/') || f.endsWith('.bat'));

    if (illegalFiles.length === 0) {
      recordTest('Higiene Git (Exclusão de Dados e .BAT)', true, 'Repositório estritamente limpo: nenhum arquivo de dados/*.sqlite3, json ou scripts *.bat pendente de adição.');
    } else {
      recordTest('Higiene Git (Exclusão de Dados e .BAT)', false, `Arquivos restritos detectados para commit: ${illegalFiles.join(', ')}`);
    }
  } catch (err) {
    recordTest('Higiene Git (Exclusão de Dados e .BAT)', false, `Erro ao validar higiene do repositório: ${err.message}`);
  }

  // Avaliação Final da Bateria de Testes
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const allPassed = passedTests === totalTests;

  console.log(`\n================================================================================`);
  console.log(`RESULTADO DA BATERIA: ${passedTests}/${totalTests} TESTES APROVADOS (${allPassed ? '100% SUCESSO' : 'FALHA DETECTADA'})`);
  console.log(`================================================================================\n`);

  if (!allPassed) {
    console.error('❌ Operação abortada! Nem todos os testes foram aprovados.');
    console.error('Nenhum commit ou publicação foi realizado para evitar envio de código instável.\n');
    process.exit(1);
  }

  // TESTES APROVADOS -> PROCEDER COM COMMIT E PUBLICAÇÃO
  console.log('2. Verificando estado do repositório Git...');
  
  const nowIso = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  let gitStatusOutput = '';
  try {
    gitStatusOutput = execSync('git status --porcelain', { cwd: BASE_DIR }).toString().trim();
  } catch (err) {
    console.error('❌ Erro ao consultar git status:', err.message);
    process.exit(1);
  }

  let novoCommitCriado = false;
  if (!gitStatusOutput) {
    console.log('  ℹ Nenhuma modificação pendente para commit no momento (working tree clean).');
  } else {
    const lines = gitStatusOutput.split('\n').filter(Boolean);
    console.log(`  ✔ Foram detectados ${lines.length} arquivos modificados/novos para homologação.`);

    // Obter mensagem de commit a partir dos argumentos da linha de comando
    const userMsg = process.argv.slice(2).join(' ').trim();
    const commitTitle = userMsg || 'Ajustes, melhorias e dados validados no Portal de Transparência';
    const commitMsg = `[AUTO-COMMIT APROVADO] ${commitTitle} (${nowIso})\n\nBateria de Testes Aprovada:\n${testResults.map(t => `- ✔ ${t.name}: ${t.details}`).join('\n')}\n\nArquivos alterados: ${lines.length}`;

    console.log('\n3. Realizando Git Add e Commit Automático...');
    try {
      execSync('git add -A', { cwd: BASE_DIR });
      
      // Salvar mensagem de commit em arquivo temporário para evitar problemas de escape no shell
      const tempMsgFile = path.join(BASE_DIR, '.temp_commit_msg.txt');
      fs.writeFileSync(tempMsgFile, commitMsg, 'utf-8');
      execSync(`git commit -F "${tempMsgFile}"`, { cwd: BASE_DIR });
      if (fs.existsSync(tempMsgFile)) fs.unlinkSync(tempMsgFile);

      console.log('  ✔ Commit gerado com sucesso!');
      novoCommitCriado = true;
    } catch (err) {
      console.error('❌ Erro ao criar commit:', err.message);
      process.exit(1);
    }
  }

  // 4. Gerenciamento de Versão Estável e Tags Semânticas
  console.log('\n4. Gerenciando Versões Estáveis e Tags de Release...');
  let nextTag = 'v2.0.0-stable';
  try {
    const rawTags = execSync('git tag -l "v*"', { cwd: BASE_DIR }).toString().trim();
    if (rawTags) {
      const tagList = rawTags.split('\n').map(t => t.trim()).filter(Boolean);
      let maxPatch = -1;
      let maxMinor = 0;
      let maxMajor = 2;

      tagList.forEach(t => {
        const match = t.match(/^v(\d+)\.(\d+)\.(\d+)/);
        if (match) {
          const major = parseInt(match[1], 10);
          const minor = parseInt(match[2], 10);
          const patch = parseInt(match[3], 10);
          if (major > maxMajor || (major === maxMajor && minor > maxMinor) || (major === maxMajor && minor === maxMinor && patch > maxPatch)) {
            maxMajor = major;
            maxMinor = minor;
            maxPatch = patch;
          }
        }
      });

      if (maxPatch >= 0) {
        nextTag = `v${maxMajor}.${maxMinor}.${maxPatch + 1}-stable`;
      }
    }

    // Verificar se o commit atual já possui tag
    const commitAtualTag = execSync('git tag --points-at HEAD', { cwd: BASE_DIR }).toString().trim();
    if (!commitAtualTag) {
      console.log(`  ✔ Criando Tag de Versão Estável: ${nextTag}...`);
      execSync(`git tag -a "${nextTag}" -m "Versao Estavel Homologada (${nowIso}) - 100% Testes Aprovados"`, { cwd: BASE_DIR });
      console.log(`  ✔ Tag ${nextTag} criada e vinculada ao commit HEAD!`);
    } else {
      console.log(`  ℹ O commit atual já está tagueado como: ${commitAtualTag}`);
      nextTag = commitAtualTag;
    }
  } catch (errTag) {
    console.warn(`  ℹ Tag de versão estável: ${errTag.message}`);
  }

  // 5. Publicação no Repositório Remoto Privado (Branch main, Branch stable e Tags)
  console.log('\n5. Publicando no GitHub (main, stable e tags)...');
  let remotes = '';
  try {
    remotes = execSync('git remote -v', { cwd: BASE_DIR }).toString().trim();
  } catch {}

  if (remotes && remotes.includes('origin')) {
    console.log('  ✔ Remoto "origin" detectado. Sincronizando repositório remoto...');
    try {
      console.log('  -> Publicando branch principal: git push origin main');
      execSync('git push -u origin main', { cwd: BASE_DIR, stdio: 'inherit' });

      console.log('  -> Atualizando branch de versão estável: git push origin main:refs/heads/stable');
      execSync('git push origin main:refs/heads/stable --force', { cwd: BASE_DIR, stdio: 'inherit' });

      console.log('  -> Publicando tags de versão estável: git push origin --tags');
      execSync('git push origin --tags', { cwd: BASE_DIR, stdio: 'inherit' });

      console.log(`\n✅ Versão estável (${nextTag}) publicada com sucesso no GitHub!`);
    } catch (err) {
      console.warn(`  ⚠ Falha no git push: ${err.message}`);
    }
  } else {
    console.log('  ℹ Nenhum repositório remoto "origin" configurado ainda.');
    console.log('\n  Deseja criar automaticamente o repositório privado no GitHub?');
    
    // Testar se GitHub CLI está autenticado
    let ghAuthed = false;
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      ghAuthed = true;
    } catch {}

    if (ghAuthed) {
      console.log('  ✔ GitHub CLI autenticado! Criando repositório privado na sua conta...');
      try {
        execSync('gh repo create portal-transparencia-arinos --private --source=. --remote=origin --push', {
          cwd: BASE_DIR,
          stdio: 'inherit'
        });
        console.log('\n✅ Repositório privado criado e publicado com sucesso no GitHub!');
      } catch (err) {
        console.warn(`  ⚠ Erro ao criar repositório via GitHub CLI: ${err.message}`);
      }
    } else {
      console.log('\n  ╔══════════════════════════════════════════════════════════════════════╗');
      console.log('  ║  COMO CONECTAR O SEU REPOSITÓRIO PRIVADO:                            ║');
      console.log('  ║                                                                      ║');
      console.log('  ║  Opção 1 (GitHub CLI Automático - Recomendado):                      ║');
      console.log('  ║    1. Execute no terminal: gh auth login                             ║');
      console.log('  ║    2. Execute novamente este script para criar o repo privado!       ║');
      console.log('  ║                                                                      ║');
      console.log('  ║  Opção 2 (Adicionar URL Remota Existente):                           ║');
      console.log('  ║    git remote add origin https://github.com/SEU_USUARIO/REPO.git     ║');
      console.log('  ║    git push -u origin main                                           ║');
      console.log('  ╚══════════════════════════════════════════════════════════════════════╝\n');
    }
  }

  console.log('================================================================================');
  console.log('CICLO CONCLUÍDO COM SUCESSO! CÓDIGO HOMOLOGADO, TESTADO E REGISTRADO.');
  console.log('================================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Erro inesperado na execução:', err);
  process.exit(1);
});
