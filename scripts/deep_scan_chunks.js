const fs = require('node:fs');

async function main() {
  const baseUrl = 'https://mgcidades.redemunicipal.com.br/';
  const chunks = [
    'main-2OUB5MAG.js',
    'chunk-7HVLWCAS.js',
    'chunk-PO6WMD2N.js',
    'chunk-SDADDVUP.js',
    'chunk-ZDSLXVIR.js',
    'chunk-IZ4YTHJP.js',
    'chunk-G22VBIU7.js'
  ];

  for (const chunk of chunks) {
    const res = await fetch(baseUrl + chunk);
    const text = await res.text();
    
    // find all occurrences of http/endpoints
    const matches = text.match(/[a-zA-Z0-9_\-\.\/]+(?:siap|folha|servercad|contaspublicas)[a-zA-Z0-9_\-\.\/]*/gi) || [];
    const httpCalls = text.match(/this\.http\.[a-z]+\([^)]+\)/gi) || [];
    const getCalls = text.match(/get<[^>]+>\([^)]+\)/gi) || [];
    
    console.log(`=== Chunk ${chunk} ===`);
    console.log('Matches:', Array.from(new Set(matches)));
    if (httpCalls.length > 0) console.log('HTTP calls:', httpCalls.slice(0, 10));
    if (getCalls.length > 0) console.log('GET calls:', getCalls.slice(0, 10));
  }
}

main().catch(console.error);
