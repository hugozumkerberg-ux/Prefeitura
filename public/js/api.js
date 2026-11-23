/**
 * Cliente de API Unificado — Requisições REST
 * Portal da Transparência de Arinos / MG
 * 
 * Centraliza todas as chamadas HTTP (fetch) com tratamento de erro e tipagem padronizada.
 */

export async function fetchResumoKpis() {
  const res = await fetch('/api/dados/resumo');
  if (!res.ok) throw new Error(`Falha ao obter resumo de KPIs: status ${res.status}`);
  return await res.json();
}

export async function fetchTabelaDados(aba, { pagina = 1, limite = 25, busca = '', filtros = {} } = {}) {
  let url = '';

  if (aba === 'pessoas') {
    const params = new URLSearchParams({
      page: String(pagina),
      limit: String(limite),
      tipo: filtros.tipoPessoa || 'todos',
      ordenar: filtros.ordenarPessoa || 'dinheiro',
      busca: busca || ''
    });
    url = `/api/dados/pessoas-unificadas?${params.toString()}`;
  } else {
    const params = new URLSearchParams({
      page: String(pagina),
      limit: String(limite),
      q: busca || '',
      ano: filtros.ano || '',
      mes: filtros.mes || '',
      entidade: filtros.entidade || ''
    });
    url = `/api/dados/${encodeURIComponent(aba)}?${params.toString()}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar tabela ${aba}: status ${res.status}`);
  return await res.json();
}

export async function fetchPerfilPessoa(id) {
  const res = await fetch(`/api/dados/perfil-pessoa?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Falha ao carregar perfil do cidadão #${id}`);
  return await res.json();
}

export async function fetchContrachequeDetalhe(id) {
  const res = await fetch(`/api/dados/contracheque-detalhe?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Falha ao carregar detalhes do contracheque #${id}`);
  return await res.json();
}

export async function fetchRankings() {
  const res = await fetch('/api/dados/rankings');
  if (!res.ok) throw new Error(`Falha ao carregar rankings`);
  return await res.json();
}

export default {
  fetchResumoKpis,
  fetchTabelaDados,
  fetchPerfilPessoa,
  fetchContrachequeDetalhe,
  fetchRankings
};
