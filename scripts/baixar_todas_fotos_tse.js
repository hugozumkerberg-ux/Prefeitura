const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const BASE_DIR = path.resolve(__dirname, '..');
const ELEICOES_JSON = path.join(BASE_DIR, 'dados/eleicoes/eleicoes_master.json');
const FOTOS_DIR = path.join(BASE_DIR, 'dados/eleicoes/fotos');
const DB_PATH = path.join(BASE_DIR, 'dados/arinos_transparencia_master.sqlite3');

fs.mkdirSync(FOTOS_DIR, { recursive: true });

async function baixarUmaFoto(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    return true;
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuditoriaPublica/1.0',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > 500) {
        fs.writeFileSync(destPath, buffer);
        return true;
      }
    }
  } catch (err) {
    // console.log(`Erro ao baixar ${url}: ${err.message}`);
  }
  return false;
}

async function main() {
  console.log('--- INICIANDO DOWNLOAD DE 100% DAS FOTOS DOS CANDIDATOS TSE ---');
  const data = JSON.parse(fs.readFileSync(ELEICOES_JSON, 'utf-8'));
  const candidatos = data.candidatos || [];

  let baixados = 0;
  let jaExistiam = 0;
  let falhas = 0;

  for (let i = 0; i < candidatos.length; i++) {
    const c = candidatos[i];
    const nomeArq = `cand_${c.ano}_${c.id_candidato}.jpg`;
    const destPath = path.join(FOTOS_DIR, nomeArq);
    const localRel = `/dados/eleicoes/fotos/${nomeArq}`;

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      jaExistiam++;
      c.foto_local = localRel;
      continue;
    }

    const urlTse = c.foto_tse || `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${c.ano === 2020 ? '2030402020' : '2045202024'}/${c.id_candidato}/40894`;
    process.stdout.write(`[${i + 1}/${candidatos.length}] Baixando foto de ${c.nome_urna} (${c.cargo})... `);

    const ok = await baixarUmaFoto(urlTse, destPath);
    if (ok) {
      c.foto_local = localRel;
      baixados++;
      console.log('OK');
    } else {
      falhas++;
      console.log('FALHA');
    }

    // Se tiver vice, baixa a foto do vice também
    if (c.vice_nome && c.id_candidato) {
      const viceArq = `vice_${c.ano}_${c.id_candidato}.jpg`;
      const destVice = path.join(FOTOS_DIR, viceArq);
      if (c.vice_foto && c.vice_foto.startsWith('http')) {
        await baixarUmaFoto(c.vice_foto, destVice);
        if (fs.existsSync(destVice)) {
          c.vice_foto = `/dados/eleicoes/fotos/${viceArq}`;
        }
      }
    }
  }

  // Atualiza o JSON Master com as fotos locais
  fs.writeFileSync(ELEICOES_JSON, JSON.stringify(data, null, 2), 'utf-8');

  // Atualiza o SQLite Master se existir
  if (fs.existsSync(DB_PATH)) {
    try {
      const db = new DatabaseSync(DB_PATH);
      const stmt = db.prepare('UPDATE eleicoes_candidatos SET foto_local = ?, vice_foto = ? WHERE id_candidato = ? AND ano = ?');
      for (const c of candidatos) {
        if (c.foto_local) {
          stmt.run(c.foto_local, c.vice_foto || null, c.id_candidato, c.ano);
        }
      }
      console.log('Banco de dados SQLite atualizado com fotos locais!');
    } catch (e) {
      console.log('Erro ao atualizar SQLite:', e.message);
    }
  }

  console.log(`\nConcluído! ${jaExistiam} já existiam, ${baixados} novas fotos baixadas, ${falhas} falhas.`);
}

main().catch(console.error);
