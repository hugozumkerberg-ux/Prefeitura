const fs = require('node:fs');

async function main() {
  const baseUrl = 'https://mgcidades.redemunicipal.com.br/';
  const chunks = [
    'main-2OUB5MAG.js',
    'chunk-7HVLWCAS.js',
    'chunk-GGOQSKW7.js',
    'chunk-PO6WMD2N.js',
    'chunk-2E3OL7FU.js',
    'chunk-SDADDVUP.js',
    'chunk-ZDSLXVIR.js',
    'chunk-IZ4YTHJP.js',
    'chunk-G22VBIU7.js'
  ];

  const foundEndpoints = new Set();
  const foundUrls = new Set();
  const routes = new Set();

  for (const chunk of chunks) {
    try {
      const res = await fetch(baseUrl + chunk);
      const text = await res.text();
      console.log(`Chunk ${chunk}: ${text.length} bytes`);

      // Look for endpoints
      const siapRegex = /["']([^"']*(?:contrato|receita|despesa|empenho|folha|servidor|convenio|licita|diaria|almoxarifado|patrimonio|pagamento|liquidacao|decreto|lei|orgao|funcao|subfuncao)[^"']*)["']/gi;
      let m;
      while ((m = siapRegex.exec(text)) !== null) {
        if (m[1].length < 60 && !m[1].includes('<') && !m[1].includes('{')) {
          foundEndpoints.add(m[1]);
        }
      }

      const urlRegex = /https?:\/\/[a-zA-Z0-9_\-\.]+\/?[a-zA-Z0-9_\-\.\/]*/g;
      while ((m = urlRegex.exec(text)) !== null) {
        if (m[0].includes('siap') || m[0].includes('redemunicipal') || m[0].includes('api')) {
          foundUrls.add(m[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching', chunk, e.message);
    }
  }

  console.log('\n--- FOUND URLS ---');
  for (const u of foundUrls) console.log(u);

  console.log('\n--- FOUND ENDPOINTS & KEYWORDS ---');
  for (const ep of Array.from(foundEndpoints).slice(0, 50)) console.log(ep);
}

main().catch(console.error);
