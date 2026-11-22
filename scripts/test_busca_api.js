async function test() {
  const qList = ['saude', 'unai', 'duraes', 'roberto sales', 'boi preto'];
  for (const q of qList) {
    const res = await fetch(`http://localhost:8088/api/dados/busca-global?q=${encodeURIComponent(q)}`);
    const d = await res.json();
    console.log(`\n=== Busca: "${d.query}" (${d.tempo_execucao_ms}ms) - Total Geral: ${d.total_geral} ===`);
    for (const [k, v] of Object.entries(d.categorias)) {
      if (v.total > 0) {
        console.log(`  ${v.icone} ${v.nome} (${v.total}):`);
        v.itens.slice(0, 2).forEach(it => {
          console.log(`     • [${it.badge}] ${it.titulo} - ${it.subtitulo.slice(0, 75)}`);
        });
      }
    }
  }
}

test();
