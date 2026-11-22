const fs = require('node:fs');

async function main() {
  const res = await fetch('https://mgcidades.redemunicipal.com.br/27/310450201');
  const html = await res.text();
  console.log('HTML snippet:');
  console.log(html.slice(0, 2000));
}

main();
