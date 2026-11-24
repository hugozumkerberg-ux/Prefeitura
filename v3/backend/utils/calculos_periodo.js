/**
 * ==============================================================================
 * MÓDULO DE CÁLCULO PERICIAL DE PERÍODOS E INTERVALOS (GAPS) — V3
 * Identifica início, fim, tempo efetivo e intervalos de afastamento no vínculo
 * ==============================================================================
 */

function formatarMascaraAnoMeses(totalMeses) {
  const m = parseInt(totalMeses, 10) || 0;
  if (m <= 0) return '0 meses';
  const anos = Math.floor(m / 12);
  const mesesRestantes = m % 12;
  const partes = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (mesesRestantes > 0) partes.push(`${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`);
  return partes.join(' e ') || '0 meses';
}

function processarHistoricoEPeriodos(contracheques) {
  if (!contracheques || contracheques.length === 0) {
    return {
      dataInicio: null,
      dataFim: null,
      tempoBrutoExtenso: '0 meses',
      totalMesesBruto: 0,
      totalMesesEfetivos: 0,
      tempoTotalExtenso: '0 meses',
      totalIntervalos: 0,
      totalMesesIntervalos: 0,
      temIntervalos: false,
      timeline: []
    };
  }

  // Ordena cronologicamente por ano e mês crescente
  const ordenados = [...contracheques].sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes));

  const mesesUnicos = [];
  const mapMes = new Map();
  for (const c of ordenados) {
    const key = `${c.ano}-${String(c.mes).padStart(2, '0')}`;
    if (!mapMes.has(key)) {
      mapMes.set(key, { ano: c.ano, mes: c.mes, cargo: c.cargo, lotacao: c.lotacao, items: [] });
      mesesUnicos.push(mapMes.get(key));
    }
    mapMes.get(key).items.push(c);
  }

  const primeiroMes = mesesUnicos[0];
  const ultimoMes = mesesUnicos[mesesUnicos.length - 1];

  const seqPrimeiro = primeiroMes.ano * 12 + (primeiroMes.mes - 1);
  const seqUltimo = ultimoMes.ano * 12 + (ultimoMes.mes - 1);
  const totalMesesBruto = seqUltimo - seqPrimeiro + 1;

  const timeline = [];
  let periodoAtual = null;
  let totalIntervalos = 0;
  let totalMesesIntervalos = 0;

  for (let i = 0; i < mesesUnicos.length; i++) {
    const atual = mesesUnicos[i];
    const seqMesAtual = atual.ano * 12 + (atual.mes - 1);

    if (!periodoAtual) {
      periodoAtual = {
        inicio: atual,
        fim: atual,
        mesesCount: 1,
        cargos: new Set(atual.cargo ? [atual.cargo] : [])
      };
    } else {
      const seqMesAnterior = periodoAtual.fim.ano * 12 + (periodoAtual.fim.mes - 1);
      const diffMeses = seqMesAtual - seqMesAnterior;

      if (diffMeses === 1) {
        // Mês contínuo consecutivo
        periodoAtual.fim = atual;
        periodoAtual.mesesCount++;
        if (atual.cargo) periodoAtual.cargos.add(atual.cargo);
      } else if (diffMeses === 0) {
        // Mesmo mês (rubrica ou pagamento adicional)
        if (atual.cargo) periodoAtual.cargos.add(atual.cargo);
      } else {
        // GAP / INTERVALO IDENTIFICADO NO MEIO
        timeline.push({
          tipo: 'periodo_ativo',
          inicio: { ano: periodoAtual.inicio.ano, mes: periodoAtual.inicio.mes },
          fim: { ano: periodoAtual.fim.ano, mes: periodoAtual.fim.mes },
          meses: periodoAtual.mesesCount,
          tempo_formatado: formatarMascaraAnoMeses(periodoAtual.mesesCount),
          cargos: Array.from(periodoAtual.cargos).join(' • ') || 'Servidor Municipal',
          inicioFormatado: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano}`,
          fimFormatado: `${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano}`,
          descricao: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano} a ${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano} (${formatarMascaraAnoMeses(periodoAtual.mesesCount)})`
        });

        const gapMeses = diffMeses - 1;
        totalIntervalos++;
        totalMesesIntervalos += gapMeses;

        const seqGapInicio = seqMesAnterior + 1;
        const seqGapFim = seqMesAtual - 1;
        const gapInicioAno = Math.floor(seqGapInicio / 12);
        const gapInicioMes = (seqGapInicio % 12) + 1;
        const gapFimAno = Math.floor(seqGapFim / 12);
        const gapFimMes = (seqGapFim % 12) + 1;

        timeline.push({
          tipo: 'intervalo_gap',
          meses: gapMeses,
          inicio: { ano: gapInicioAno, mes: gapInicioMes },
          fim: { ano: gapFimAno, mes: gapFimMes },
          inicioFormatado: `${String(gapInicioMes).padStart(2, '0')}/${gapInicioAno}`,
          fimFormatado: `${String(gapFimMes).padStart(2, '0')}/${gapFimAno}`,
          tempo_formatado: formatarMascaraAnoMeses(gapMeses),
          descricao: `Intervalo sem vínculo: ${String(gapInicioMes).padStart(2, '0')}/${gapInicioAno} a ${String(gapFimMes).padStart(2, '0')}/${gapFimAno} (${formatarMascaraAnoMeses(gapMeses)})`
        });

        periodoAtual = {
          inicio: atual,
          fim: atual,
          mesesCount: 1,
          cargos: new Set(atual.cargo ? [atual.cargo] : [])
        };
      }
    }
  }

  if (periodoAtual) {
    timeline.push({
      tipo: 'periodo_ativo',
      inicio: { ano: periodoAtual.inicio.ano, mes: periodoAtual.inicio.mes },
      fim: { ano: periodoAtual.fim.ano, mes: periodoAtual.fim.mes },
      meses: periodoAtual.mesesCount,
      tempo_formatado: formatarMascaraAnoMeses(periodoAtual.mesesCount),
      cargos: Array.from(periodoAtual.cargos).join(' • ') || 'Servidor Municipal',
      inicioFormatado: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano}`,
      fimFormatado: `${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano}`,
      descricao: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano} a ${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano} (${formatarMascaraAnoMeses(periodoAtual.mesesCount)})`
    });
  }

  const totalMesesEfetivos = mesesUnicos.length;

  return {
    dataInicio: `${String(primeiroMes.mes).padStart(2, '0')}/${primeiroMes.ano}`,
    dataFim: `${String(ultimoMes.mes).padStart(2, '0')}/${ultimoMes.ano}`,
    totalMesesBruto,
    tempoBrutoExtenso: formatarMascaraAnoMeses(totalMesesBruto),
    totalMesesEfetivos,
    tempoTotalExtenso: formatarMascaraAnoMeses(totalMesesEfetivos),
    totalIntervalos,
    totalMesesIntervalos,
    temIntervalos: totalIntervalos > 0,
    timeline
  };
}

module.exports = {
  formatarMascaraAnoMeses,
  processarHistoricoEPeriodos
};
