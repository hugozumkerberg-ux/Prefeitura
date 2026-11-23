async function testar() {
  const urls = [
    'http://localhost:8088/api/dados/inconsistencias',
    'http://localhost:8088/api/dados/contracheques?q=832-7&limit=3',
    'http://localhost:8088/api/dados/contracheques?q=832&limit=3',
    'http://localhost:8088/api/dados/funcionarios?busca=Maria%20Pereira&limit=3'
  ];
  for (const url of urls) {
    const t0 = Date.now();
    const res = await fetch(url);
    const data = await res.json();
    const elapsed = Date.now() - t0;
    console.log('[HTTP ' + res.status + '] ' + elapsed + 'ms | ' + url);
    if (data.inconsistencias) {
      console.log('  -> Inconsistências catalogadas: ' + data.inconsistencias.length + ' categorias.');
    }
    if (data.registros && data.registros[0]) {
      const r = data.registros[0];
      console.log('  -> Primeiro registro: ' + (r.nome || r.nome_exibicao) + ' | Matr: ' + (r.matricula_limpa || (r.matriculas ? r.matriculas.join(',') : '-')));
    }
  }
}
testar().catch(console.error);
