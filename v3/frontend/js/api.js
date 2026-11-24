/**
 * Cliente de API Centralizado (v3)
 * Requisições com tratamento de erro e serialização de parâmetros
 */

export async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Falha ao carregar estatísticas oficiais.');
  return res.json();
}

export async function fetchFolha(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.mandato) query.set('mandato', params.mandato);
  if (params.ano) query.set('ano', params.ano);
  if (params.periodo) query.set('periodo', params.periodo);
  if (params.mes) query.set('mes', params.mes);
  if (params.busca) query.set('busca', params.busca);

  const res = await fetch(`/api/folha?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar folha de pagamento.');
  return res.json();
}

export async function fetchDespesas(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.mandato) query.set('mandato', params.mandato);
  if (params.ano) query.set('ano', params.ano);
  if (params.periodo) query.set('periodo', params.periodo);
  if (params.mes) query.set('mes', params.mes);
  if (params.busca) query.set('busca', params.busca);

  const res = await fetch(`/api/despesas?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar despesas.');
  return res.json();
}

export async function fetchDiarias(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.mandato) query.set('mandato', params.mandato);
  if (params.ano) query.set('ano', params.ano);
  if (params.periodo) query.set('periodo', params.periodo);
  if (params.mes) query.set('mes', params.mes);
  if (params.busca) query.set('busca', params.busca);

  const res = await fetch(`/api/diarias?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar diárias.');
  return res.json();
}

export async function fetchEmpresas(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.mandato) query.set('mandato', params.mandato);
  if (params.ano) query.set('ano', params.ano);
  if (params.periodo) query.set('periodo', params.periodo);
  if (params.mes) query.set('mes', params.mes);
  if (params.busca) query.set('busca', params.busca);
  if (params.ordenar) query.set('ordenar', params.ordenar);
  if (params.credor) query.set('credor', params.credor);

  const res = await fetch(`/api/empresas?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar empresas.');
  return res.json();
}

export async function fetchRankings(params = {}) {
  const query = new URLSearchParams();
  if (params.tipo) query.set('tipo', params.tipo);
  if (params.limit) query.set('limit', params.limit);
  if (params.mandato) query.set('mandato', params.mandato);
  if (params.ano) query.set('ano', params.ano);
  if (params.periodo) query.set('periodo', params.periodo);
  if (params.mes) query.set('mes', params.mes);

  const res = await fetch(`/api/rankings?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao consultar rankings.');
  return res.json();
}
