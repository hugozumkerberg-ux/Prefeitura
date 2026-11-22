async function main() {
  const tests = [
    'https://api2.redemunicipal.com.br/servercad/pub/organizacao/310450201',
    'https://api2.redemunicipal.com.br/servercad/pub/organizacao/27',
    'https://api2.redemunicipal.com.br/servercad/pub/organizacao?dominio=27',
    'https://api2.redemunicipal.com.br/servercad/pub/27/organizacao',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/convenio?page=0&size=5',
    'https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/servidor?page=0&size=5',
    'https://contaspublicassiapfolha.redemunicipal.com.br/pub/27/folha?page=0&size=5',
    'https://contaspublicas.redemunicipal.com.br/pub/27/empenho?page=0&size=5'
  ];

  for (const url of tests) {
    try {
      const res = await fetch(url);
      const ct = res.headers.get('content-type') || '';
      console.log(`[${res.status}] (${ct}) ${url}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log('   Preview:', text.slice(0, 150));
      }
    } catch (e) {
      console.log(`[ERR] ${url} -> ${e.message}`);
    }
  }
}

main();
