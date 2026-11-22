const fs = require('node:fs');

async function checkForm(tp) {
  const url = `http://177.69.246.155:8080/cidadao/servlet/appcidadao?idorg=236&tpformpdf=${tp}&exercicio=2026`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const text = await res.text();
    if (res.status === 200 && text.length > 500 && !text.includes('Erro de Sistema') && !text.includes('Não existem dados')) {
      // Extract title
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i) || text.match(/<h\d[^>]*>([^<]+)<\/h\d>/i) || text.match(/<b[^>]*>([^<]+)<\/b>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'sem titulo';
      return { tp, status: res.status, length: text.length, title };
    }
  } catch (e) {}
  return null;
}

async function main() {
  console.log('Varrendo tpformpdf de 1 a 70 no portal antigo da ADPMNET (idorg=236)...');
  const results = [];
  for (let tp = 1; tp <= 70; tp++) {
    const r = await checkForm(tp);
    if (r) {
      console.log(`[ACHOU tpformpdf=${r.tp}] Tam: ${r.length}b | Titulo: ${r.title}`);
      results.push(r);
    }
  }
  console.log('Varredura concluída. Total de relatórios ativos:', results.length);
}

main();
