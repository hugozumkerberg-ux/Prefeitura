/**
 * ==============================================================================
 * UTILITÁRIO DE FILTRO DE MANDATO OU ANO — V3
 * Suporta filtragem por mandato executivo (4 anos) ou ano individual
 * ==============================================================================
 */

function parsePeriodoFilter(query = {}) {
  let ano = query.ano ? parseInt(query.ano, 10) : null;
  let mandato = query.mandato ? String(query.mandato).trim() : null;
  const periodo = query.periodo ? String(query.periodo).trim() : null;

  if (periodo) {
    if (periodo.startsWith('mandato:')) {
      mandato = periodo.replace('mandato:', '');
      ano = null;
    } else if (periodo.startsWith('ano:')) {
      ano = parseInt(periodo.replace('ano:', ''), 10);
      mandato = null;
    } else if (/^\d{4}-\d{4}$/.test(periodo)) {
      mandato = periodo;
      ano = null;
    } else if (/^\d{4}$/.test(periodo)) {
      ano = parseInt(periodo, 10);
      mandato = null;
    }
  }

  let anoInicio = null;
  let anoFim = null;

  if (mandato) {
    const parts = mandato.split('-');
    if (parts.length === 2) {
      anoInicio = parseInt(parts[0], 10);
      anoFim = parseInt(parts[1], 10);
    }
  } else if (ano) {
    anoInicio = ano;
    anoFim = ano;
  }

  return {
    ano,
    mandato,
    anoInicio,
    anoFim,
    temFiltroAno: anoInicio !== null
  };
}

module.exports = { parsePeriodoFilter };
