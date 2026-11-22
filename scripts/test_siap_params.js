async function main() {
  const tests = [
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?exercicio=2025&page=0&size=2',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?ano=2025&page=0&size=2',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?anoExercicio=2025&page=0&size=2',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?dataInicio=2025-01-01&dataFim=2025-12-31&page=0&size=2',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?dtInicio=2025-01-01&dtFim=2025-12-31&page=0&size=2',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?dtReceitaInicio=2025-01-01&dtReceitaFim=2025-12-31&page=0&size=2',
    'https://contaspublicassiap.redemunicipal.com.br/pub/27/receita?dtInicial=2025-01-01&dtFinal=2025-12-31&page=0&size=2'
  ];

  for (const u of tests) {
    try {
      const res = await fetch(u);
      const json = await res.json();
      const first = json.content?.[0];
      console.log(`URL: ${u}`);
      console.log(`   Total: ${json.page?.totalElements} | First item year: ${first?.ano} | Date: ${first?.dtreceita}`);
    } catch (e) {
      console.log(`ERR: ${u} -> ${e.message}`);
    }
  }
}

main();
