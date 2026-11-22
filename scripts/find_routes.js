const fs = require('node:fs');

async function main() {
  const chunks = ['main-2OUB5MAG.js', 'chunk-7HVLWCAS.js', 'chunk-SDADDVUP.js', 'chunk-G22VBIU7.js'];
  for (const chunk of chunks) {
    const res = await fetch('https://mgcidades.redemunicipal.com.br/' + chunk);
    const text = await res.text();
    
    // search for path: "..."
    const routes = text.match(/path:\s*["'][^"']+["']/g) || [];
    if (routes.length > 0) {
      console.log(`Routes in ${chunk}:`, routes);
    }
  }
}

main();
