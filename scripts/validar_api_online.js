async function testar() {
  const urls = [
    'http://localhost:8088/api/dados/funcionarios?busca=funcionarios',
    'http://localhost:8088/api/dados/pessoas-unificadas?busca=funcionarios',
    'http://localhost:8088/api/dados/busca-global?q=funcionarios',
    'http://localhost:8088/api/dados/contracheques?q=professor&limit=5',
    'http://localhost:8088/api/dados/funcionarios?busca=maria&limit=5'
  ];
  for (const url of urls) {
    const t0 = Date.now();
    const res = await fetch(url);
    const data = await res.json();
    const elapsed = Date.now() - t0;
    const total = data.total || (data.paginacao ? data.paginacao.total_filtrado : (data.total_geral || 0));
    console.log('[HTTP ' + res.status + '] ' + elapsed + 'ms | Total: ' + total + ' | ' + url);
  }
}
testar().catch(console.error);
