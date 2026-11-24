/**
 * ==============================================================================
 * MÓDULO DE CÁLCULO PERICIAL DE PERÍODOS E INTERVALOS (GAPS) — V3
 * Identifica início, fim, tempo efetivo, férias, 13º e afastamentos reais no vínculo
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

/**
 * Processa o histórico cronológico de contracheques de um servidor,
 * diferenciando com precisão pericial os períodos de:
 * 1) Férias regulamentares e recessos legais anuais (computados como efetivo exercício por lei - Art. 102 da Lei 8.112/90)
 * 2) Décimo terceiro salário (13º salário / gratificação natalina quitada)
 * 3) Rupturas reais de vínculo / afastamentos não remunerados (gaps prolongados)
 */
function processarHistoricoEPeriodos(contracheques) {
  if (!contracheques || contracheques.length === 0) {
    return {
      dataInicio: null,
      dataFim: null,
      tempoBrutoExtenso: '0 meses',
      totalMesesBruto: 0,
      totalMesesEfetivos: 0,
      tempoTotalExtenso: '0 meses',
      totalMesesFeriasRecesso: 0,
      tempoFeriasRecessoExtenso: '0 meses',
      total13Salarios: 0,
      totalIntervalos: 0,
      totalMesesIntervalos: 0,
      tempoIntervalosExtenso: '0 meses',
      temIntervalos: false,
      timeline: []
    };
  }

  // Ordena cronologicamente por ano e mês crescente
  const ordenados = [...contracheques].sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes));

  const mapMes = new Map();
  let total13Salarios = 0;

  for (const c of ordenados) {
    const key = `${c.ano}-${String(c.mes).padStart(2, '0')}`;
    if (!mapMes.has(key)) {
      mapMes.set(key, { 
        ano: c.ano, 
        mes: c.mes, 
        cargo: c.cargo, 
        lotacao: c.lotacao, 
        tem13: false,
        temFerias: false,
        items: [] 
      });
    }
    const mObj = mapMes.get(key);
    mObj.items.push(c);

    // Identificação de rubricas de 13º e férias nas tabelas JSON da folha
    const jsonStr = (c.tabelas_json || '') + (c.campos_json || '');
    if (jsonStr) {
      if (/13\s*Sal[áa]rio|Inss\s*13|Decimo|D[ée]cimo|0132\.\d+|0403\.02|0404\.02/i.test(jsonStr)) {
        if (!mObj.tem13) {
          mObj.tem13 = true;
          total13Salarios++;
        }
      }
      if (/f[ée]rias|0121\.\d+|0122\.\d+|0163\.\d+/i.test(jsonStr)) {
        mObj.temFerias = true;
      }
    }
  }

  const mesesUnicos = Array.from(mapMes.values());
  const primeiroMes = mesesUnicos[0];
  const ultimoMes = mesesUnicos[mesesUnicos.length - 1];

  const seqPrimeiro = primeiroMes.ano * 12 + (primeiroMes.mes - 1);
  const seqUltimo = ultimoMes.ano * 12 + (ultimoMes.mes - 1);
  const totalMesesBruto = seqUltimo - seqPrimeiro + 1;

  const timeline = [];
  let periodoAtual = null;
  let totalIntervalosReais = 0;
  let totalMesesIntervalosReais = 0;
  let totalMesesFeriasRecesso = 0;

  for (let i = 0; i < mesesUnicos.length; i++) {
    const atual = mesesUnicos[i];
    const seqMesAtual = atual.ano * 12 + (atual.mes - 1);

    if (!periodoAtual) {
      periodoAtual = {
        inicio: atual,
        fim: atual,
        mesesEfetivos: 1,
        mesesFeriasRecesso: 0,
        cargos: new Set(atual.cargo ? [atual.cargo] : [])
      };
    } else {
      const seqMesAnterior = periodoAtual.fim.ano * 12 + (periodoAtual.fim.mes - 1);
      const diffMeses = seqMesAtual - seqMesAnterior;

      if (diffMeses === 1) {
        // Mês contínuo consecutivo
        periodoAtual.fim = atual;
        periodoAtual.mesesEfetivos++;
        if (atual.cargo) periodoAtual.cargos.add(atual.cargo);
      } else if (diffMeses === 0) {
        // Mesmo mês (rubrica ou pagamento adicional, ex: 13º salário)
        if (atual.cargo) periodoAtual.cargos.add(atual.cargo);
      } else {
        const gapMeses = diffMeses - 1;
        const seqGapInicio = seqMesAnterior + 1;
        const seqGapFim = seqMesAtual - 1;
        const gapInicioMes = (seqGapInicio % 12) + 1;
        const gapFimMes = (seqGapFim % 12) + 1;
        const gapInicioAno = Math.floor(seqGapInicio / 12);
        const gapFimAno = Math.floor(seqGapFim / 12);

        // ==============================================================================
        // AUDITORIA PERICIAL DE FÉRIAS, 13º SALÁRIO E RECESSO REGULAMENTAR:
        // 1) Gap de até 2 meses iniciando em Janeiro (mês 01) ou Julho (mês 07) — Férias e Recesso Escolar
        // 2) Mês anterior (Dezembro) teve 13º ou Férias antecipadas (ou fechamento regular de exercício)
        // 3) Gap isolado de 1 mês entre períodos ativos no mesmo vínculo (férias regulamentares de 30 dias)
        // ==============================================================================
        const ehRecessoJaneiro = (gapInicioMes === 1 && gapMeses <= 2);
        const ehRecessoJulho = (gapInicioMes === 7 && gapMeses <= 1);
        const mesAnteriorTeve13OuFerias = periodoAtual.fim.tem13 || periodoAtual.fim.temFerias || periodoAtual.fim.mes === 12;
        const gapCurtoContinuo = (gapMeses === 1);

        const ehFeriasOuRecesso = ehRecessoJaneiro || ehRecessoJulho || (mesAnteriorTeve13OuFerias && gapMeses <= 2) || gapCurtoContinuo;

        if (ehFeriasOuRecesso) {
          // Férias e Recesso Legal contam integralmente como EFETIVO EXERCÍCIO (Lei 8.112/90, Art. 102)
          periodoAtual.mesesEfetivos += gapMeses;
          periodoAtual.mesesFeriasRecesso += gapMeses;
          totalMesesFeriasRecesso += gapMeses;
          periodoAtual.fim = atual;
          periodoAtual.mesesEfetivos++; // mês atual ativo
          if (atual.cargo) periodoAtual.cargos.add(atual.cargo);
        } else {
          // RUPTURA REAL DE VÍNCULO (Afastamento não remunerado, vacância, exoneração temporária)
          timeline.push({
            tipo: 'periodo_ativo',
            inicio: { ano: periodoAtual.inicio.ano, mes: periodoAtual.inicio.mes },
            fim: { ano: periodoAtual.fim.ano, mes: periodoAtual.fim.mes },
            meses: periodoAtual.mesesEfetivos,
            mesesFeriasRecesso: periodoAtual.mesesFeriasRecesso,
            tempo_formatado: formatarMascaraAnoMeses(periodoAtual.mesesEfetivos),
            cargos: Array.from(periodoAtual.cargos).join(' • ') || 'Servidor Municipal',
            inicioFormatado: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano}`,
            fimFormatado: `${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano}`,
            descricao: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano} a ${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano} (${formatarMascaraAnoMeses(periodoAtual.mesesEfetivos)})`
          });

          totalIntervalosReais++;
          totalMesesIntervalosReais += gapMeses;

          timeline.push({
            tipo: 'intervalo_gap',
            meses: gapMeses,
            inicio: { ano: gapInicioAno, mes: gapInicioMes },
            fim: { ano: gapFimAno, mes: gapFimMes },
            inicioFormatado: `${String(gapInicioMes).padStart(2, '0')}/${gapInicioAno}`,
            fimFormatado: `${String(gapFimMes).padStart(2, '0')}/${gapFimAno}`,
            tempo_formatado: formatarMascaraAnoMeses(gapMeses),
            descricao: `Ruptura/Afastamento sem vínculo: ${String(gapInicioMes).padStart(2, '0')}/${gapInicioAno} a ${String(gapFimMes).padStart(2, '0')}/${gapFimAno} (${formatarMascaraAnoMeses(gapMeses)})`
          });

          periodoAtual = {
            inicio: atual,
            fim: atual,
            mesesEfetivos: 1,
            mesesFeriasRecesso: 0,
            cargos: new Set(atual.cargo ? [atual.cargo] : [])
          };
        }
      }
    }
  }

  if (periodoAtual) {
    timeline.push({
      tipo: 'periodo_ativo',
      inicio: { ano: periodoAtual.inicio.ano, mes: periodoAtual.inicio.mes },
      fim: { ano: periodoAtual.fim.ano, mes: periodoAtual.fim.mes },
      meses: periodoAtual.mesesEfetivos,
      mesesFeriasRecesso: periodoAtual.mesesFeriasRecesso,
      tempo_formatado: formatarMascaraAnoMeses(periodoAtual.mesesEfetivos),
      cargos: Array.from(periodoAtual.cargos).join(' • ') || 'Servidor Municipal',
      inicioFormatado: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano}`,
      fimFormatado: `${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano}`,
      descricao: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano} a ${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano} (${formatarMascaraAnoMeses(periodoAtual.mesesEfetivos)})`
    });
  }

  const totalMesesEfetivos = totalMesesBruto - totalMesesIntervalosReais;

  return {
    dataInicio: `${String(primeiroMes.mes).padStart(2, '0')}/${primeiroMes.ano}`,
    dataFim: `${String(ultimoMes.mes).padStart(2, '0')}/${ultimoMes.ano}`,
    totalMesesBruto,
    tempoBrutoExtenso: formatarMascaraAnoMeses(totalMesesBruto),
    totalMesesEfetivos,
    tempoTotalExtenso: formatarMascaraAnoMeses(totalMesesEfetivos),
    totalMesesFeriasRecesso,
    tempoFeriasRecessoExtenso: formatarMascaraAnoMeses(totalMesesFeriasRecesso),
    total13Salarios,
    totalIntervalos: totalIntervalosReais,
    totalMesesIntervalos: totalMesesIntervalosReais,
    tempoIntervalosExtenso: formatarMascaraAnoMeses(totalMesesIntervalosReais),
    temIntervalos: totalIntervalosReais > 0,
    timeline
  };
}

module.exports = {
  formatarMascaraAnoMeses,
  processarHistoricoEPeriodos
};
