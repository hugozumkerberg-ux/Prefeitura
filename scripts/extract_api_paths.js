const fs = require('node:fs');

async function main() {
  const chunks = ['chunk-ZDSLXVIR.js', 'chunk-SDADDVUP.js', 'chunk-G22VBIU7.js', 'chunk-IZ4YTHJP.js', 'chunk-PO6WMD2N.js', 'main-2OUB5MAG.js'];
  const apis = new Set();
  
  for (const c of chunks) {
    const res = await fetch('https://mgcidades.redemunicipal.com.br/' + c);
    const text = await res.text();
    // match strings like "/algo" or '/algo'
    const matches = text.match(/["']\/([a-z0-9_\-]+(?:\/[a-z0-9_\-]+)*)["']/gi) || [];
    for (const m of matches) {
      const clean = m.replace(/["']/g, '');
      if (clean.length > 3 && clean.length < 35 && !clean.includes('woff') && !clean.includes('assets') && !clean.includes('IBM')) {
        apis.add(clean);
      }
    }
  }

  console.log('Detected URL paths (sample 100):');
  console.log(Array.from(apis).filter(p => !p.startsWith('/IBM')).slice(0, 100));
}

main();
