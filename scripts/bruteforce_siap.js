const dictionary = [
  'licitacao', 'licitacoes', 'edital', 'editais', 'processo', 'processos',
  'dispensa', 'inexigibilidade', 'pregao', 'chamamento',
  'despesa', 'despesas', 'empenho', 'empenhos', 'liquidacao', 'liquidacoes', 'pagamento', 'pagamentos',
  'obra', 'obras', 'projeto', 'projetos',
  'diaria', 'diarias', 'viagem', 'viagens',
  'folha', 'folhapagamento', 'servidor', 'servidores', 'funcionario', 'funcionarios', 'cargo', 'cargos',
  'remuneracao', 'salario', 'salarios', 'pessoal',
  'patrimonio', 'bens', 'imoveis', 'veiculo', 'veiculos', 'frota', 'almoxarifado', 'estoque',
  'lei', 'leis', 'decreto', 'decretos', 'portaria', 'portarias', 'legislacao',
  'orgao', 'orgaos', 'secretaria', 'secretarias', 'unidade', 'unidades', 'entidade', 'entidades',
  'repasse', 'repasses', 'transferencia', 'transferencias', 'subvencao', 'subvencoes',
  'tce', 'relatorio', 'relatorios', 'rreo', 'rgf', 'lrf',
  'exercicio', 'exercicios', 'ano', 'anos',
  'covid', 'emenda', 'emendas', 'conselho', 'conselhos',
  'contato', 'configuracao', 'versao', 'swagger', 'v2/api-docs', 'v3/api-docs', 'actuator', 'api-docs'
];

async function main() {
  console.log('Testing SIAP endpoints...');
  for (const word of dictionary) {
    try {
      const url = `https://contaspublicassiap.redemunicipal.com.br/pub/27/${word}?page=0&size=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const ct = res.headers.get('content-type') || '';
      if (res.status === 200 && (ct.includes('json') || ct.includes('text'))) {
        const text = await res.text();
        console.log(`[FOUND 200] /${word} (${ct}) -> Length: ${text.length} | Preview: ${text.slice(0, 80)}`);
      } else if (res.status !== 404 && res.status !== 400) {
        console.log(`[STATUS ${res.status}] /${word}`);
      }
    } catch (e) {}
  }
  console.log('Finished testing.');
}

main();
