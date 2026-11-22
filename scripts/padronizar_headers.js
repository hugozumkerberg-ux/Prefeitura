const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');

const navHtml = `      <!-- Links de Navegação Padronizados -->
      <nav class="flex items-center space-x-1 sm:space-x-1.5 text-xs font-semibold overflow-x-auto py-1">
        <a href="/" class="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
          Início
        </a>
        <a href="/mandatos.html" class="px-2.5 py-1.5 rounded-lg text-purple-300 hover:bg-purple-900/30 border border-purple-500/30 transition">
          Mandatos
        </a>
        <a href="/tabelas.html?tab=pessoas" class="px-2.5 py-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/30 border border-emerald-500/30 transition">
          Pessoas
        </a>
        <a href="/empresas.html" class="px-2.5 py-1.5 rounded-lg text-blue-300 hover:bg-blue-900/30 border border-blue-500/30 transition">
          Empresas
        </a>
        <a href="/tabelas.html?tab=rankings" class="px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-amber-900/30 border border-amber-500/30 transition">
          Rankings
        </a>
        <a href="/cidade.html" class="px-2.5 py-1.5 rounded-lg text-yellow-300 hover:bg-yellow-900/30 border border-yellow-500/30 transition">
          Cidade
        </a>
        <a href="/administrativo.html" class="px-2.5 py-1.5 rounded-lg text-blue-300 hover:bg-blue-900/30 border border-blue-500/30 transition">
          Administrativo
        </a>
        <a href="/mapa.html" class="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" title="Mapa do Site">
          🗺️ Mapa
        </a>
      </nav>`;

function updateNav(fileName) {
  const filePath = path.join(BASE_DIR, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old nav container inside header
  const regex = /(<!-- Links de Navegação[\s\S]*?-->\s*<div class="flex items-center space-x-1[\s\S]*?<\/div>)/;
  if (regex.test(content)) {
    content = content.replace(regex, navHtml);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Header padronizado em ${fileName}`);
  } else {
    console.log(`ℹ Padrão já atualizado ou não compatível em ${fileName}`);
  }
}

updateNav('vereadores.html');
updateNav('eleicoes.html');
updateNav('mapa.html');
