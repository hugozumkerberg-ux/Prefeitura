const fs = require('node:fs');

async function main() {
  const res = await fetch('https://mgcidades.redemunicipal.com.br/chunk-ZDSLXVIR.js');
  const text = await res.text();
  
  const keywords = ['servercontaspublicassiapfolha', 'servercontaspublicassiap', 'servercontaspublicas', 'servercad'];
  for (const kw of keywords) {
    console.log(`\n================ KEYWORD: ${kw} ================`);
    let idx = 0;
    while ((idx = text.indexOf(kw, idx)) !== -1) {
      const snippet = text.slice(Math.max(0, idx - 100), Math.min(text.length, idx + 250));
      console.log('--- snippet ---:\n' + snippet);
      idx += kw.length;
    }
  }
}

main().catch(console.error);
