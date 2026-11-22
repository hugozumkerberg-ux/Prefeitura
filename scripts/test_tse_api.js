async function testTse() {
  const tests = [
    'https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/buscar/2024',
    'https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/eleicoes',
    'https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/listar/municipios/2045202024/MG/municipios',
    'https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2024/40894/2045202024/11/candidatos',
    'https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2024/40894/2045202024/13/candidatos'
  ];

  for (const u of tests) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      console.log(`[${res.status}] ${u}`);
      if (res.ok) {
        const text = await res.text();
        console.log('   Tamanho:', text.length, '| Preview:', text.slice(0, 150));
      }
    } catch (e) {
      console.log(`[ERR] ${u} -> ${e.message}`);
    }
  }
}

testTse();
