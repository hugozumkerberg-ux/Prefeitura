/**
 * ==============================================================================
 * APLICADOR DE V2 COM SIDE MENU, INFORMAÇÕES PROFISSIONAIS E ANIMAÇÕES
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');

const htmlFiles = [
  'index.html',
  'tabelas.html',
  'administrativo.html',
  'mandatos.html',
  'empresas.html',
  'cidade.html',
  'vereadores.html',
  'eleicoes.html',
  'mapa.html'
];

console.log('--- Aplicando V2 Side Menu e Assets em todas as páginas centrais ---');

htmlFiles.forEach(file => {
  const filePath = path.join(BASE_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Página não encontrada: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Injetar CSS do Side Menu V2 no <head> se não presente
  if (!content.includes('/components/side_menu_v2.css')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="/components/side_menu_v2.css">\n</head>');
    changed = true;
  }

  // 2. Injetar Script do Side Menu V2 antes de </body> se não presente
  if (!content.includes('/components/side_menu_v2.js')) {
    content = content.replace('</body>', '  <script src="/components/side_menu_v2.js"></script>\n</body>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Injetado Side Menu V2 assets em: ${file}`);
  } else {
    console.log(`ℹ Já possui Side Menu V2 assets: ${file}`);
  }
});

// 3. Atualizar index.html com Topbar V2 elegante
const indexPath = path.join(BASE_DIR, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');

  // Atualizar o header do index.html para não duplicar os botões do side menu
  const oldHeaderActionsRegex = /<div class="header-actions"[\s\S]*?<\/div>\s*<\/header>/;
  const newHeaderActions = `<div class="header-actions" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <span class="badge-live" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.35); color: #34d399;">
          <span class="pulse"></span> V2 Pro • Side Menu Ativo
        </span>
        <button onclick="document.getElementById('global-search-input').focus()" class="nav-btn" style="padding: 7px 14px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #e2e8f0; border-radius: 9999px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
          🔍 Buscar ( / )
        </button>
        <button onclick="openVoterModal('modalAuditoriaTecnica')" class="nav-btn" style="padding: 7px 14px; font-size: 12px; font-weight: 700; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; border-radius: 9999px; cursor: pointer; transition: all 0.2s;">
          ⚙️ Auditoria Forense
        </button>
        <a href="mapa.html" class="nav-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #10b981; transition: all 0.2s;">
          🗺️ Mapa
        </a>
      </div>
    </header>`;

  if (oldHeaderActionsRegex.test(indexContent)) {
    indexContent = indexContent.replace(oldHeaderActionsRegex, newHeaderActions);
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log('✔ Header de index.html atualizado para Topbar V2 elegante.');
  }
}

// 4. Atualizar tabelas.html com painel e badges profissionais
const tabelasPath = path.join(BASE_DIR, 'tabelas.html');
if (fs.existsSync(tabelasPath)) {
  let tabContent = fs.readFileSync(tabelasPath, 'utf8');

  // Adicionar painel de perfil profissional dentro do abrirModalPessoa
  const modalPessoaTarget = "let htmlCorpo = `";
  const modalPessoaReplacement = `
        const painelProfissionalHtml = window.gerarPainelPerfilProfissional ? window.gerarPainelPerfilProfissional(p, data) : '';
        let htmlCorpo = \`
          \${painelProfissionalHtml}
  `;

  if (tabContent.includes(modalPessoaTarget) && !tabContent.includes('painelProfissionalHtml')) {
    tabContent = tabContent.replace(modalPessoaTarget, modalPessoaReplacement);
    console.log('✔ Ficha Profissional inserida no modal de tabelas.html');
  }

  // Adicionar badges profissionais na renderização da tabela de pessoas
  const oldTrPessoas = `<span class="px-2 py-0.5 rounded-full text-xs font-medium border \${badgeTipo}">\${r.perfil_tipo}</span>`;
  const newTrPessoas = `<span class="px-2 py-0.5 rounded-full text-xs font-medium border \${badgeTipo}">\${r.perfil_tipo}</span>
                <div class="mt-1">\${window.gerarBadgesProfissionais ? window.gerarBadgesProfissionais(r) : ''}</div>`;

  if (tabContent.includes(oldTrPessoas) && !tabContent.includes('gerarBadgesProfissionais(r)')) {
    tabContent = tabContent.replace(oldTrPessoas, newTrPessoas);
    console.log('✔ Badges profissionais inseridos na tabela de pessoas em tabelas.html');
  }

  fs.writeFileSync(tabelasPath, tabContent, 'utf8');
}

console.log('--- Concluído com sucesso! ---');
