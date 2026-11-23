/**
 * ==============================================================================
 * MÓDULO DE CÁLCULOS TRABALHISTAS & FORMATAÇÃO — ARINOS / MG
 * Alíquotas progressivas oficiais de INSS/RPPS e IRRF, salário líquido e máscaras
 * ==============================================================================
 */

/**
 * Calcula descontos estatutários oficiais progressivos (Previdência + IRRF)
 * @param {number} bruto Salário Bruto total
 * @param {number} ano Ano da competência
 * @returns {object} { inss, irrf, total_descontos, salario_liquido }
 */
function calcularDescontosEstatutarios(bruto, ano) {
  const b = Math.max(0, parseFloat(bruto) || 0);
  if (b === 0) {
    return { inss: 0, irrf: 0, total_descontos: 0, salario_liquido: 0 };
  }

  // 1. Previdência Oficial (Alíquotas progressivas)
  let inss = 0;
  if (b <= 1412.00) {
    inss = b * 0.075;
  } else if (b <= 2666.68) {
    inss = (1412.00 * 0.075) + ((b - 1412.00) * 0.09);
  } else if (b <= 4000.03) {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((b - 2666.68) * 0.12);
  } else if (b <= 7786.02) {
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((b - 4000.03) * 0.14);
  } else {
    // Teto previdenciário estatutário
    inss = (1412.00 * 0.075) + ((2666.68 - 1412.00) * 0.09) + ((4000.03 - 2666.68) * 0.12) + ((7786.02 - 4000.03) * 0.14);
  }

  // 2. Base de cálculo do IRRF (Bruto menos Previdência)
  const baseIR = Math.max(0, b - inss);
  let irrf = 0;

  if (baseIR <= 2259.20) {
    irrf = 0;
  } else if (baseIR <= 2826.65) {
    irrf = (baseIR * 0.075) - 169.44;
  } else if (baseIR <= 3751.05) {
    irrf = (baseIR * 0.15) - 381.44;
  } else if (baseIR <= 4664.68) {
    irrf = (baseIR * 0.225) - 662.77;
  } else {
    irrf = (baseIR * 0.275) - 896.00;
  }

  irrf = Math.max(0, irrf);
  const total_descontos = inss + irrf;
  const salario_liquido = Math.max(0, b - total_descontos);

  return {
    inss: Math.round(inss * 100) / 100,
    irrf: Math.round(irrf * 100) / 100,
    total_descontos: Math.round(total_descontos * 100) / 100,
    salario_liquido: Math.round(salario_liquido * 100) / 100
  };
}

/**
 * Converte quantidade de meses para a máscara legível 'X anos e Y meses'
 * @param {number} totalMeses Quantidade de meses
 * @returns {string} Máscara formatada
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
 * Formata moeda no padrão brasileiro BRL
 * @param {number} val Valor numérico
 * @returns {string} R$ 1.234,56
 */
function formatarMoeda(val) {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Processa histórico funcional de contracheques e identifica períodos ativos e intervalos (gaps)
 * @param {Array} contracheques Lista cronológica de contracheques
 * @returns {object} { totalMesesEfetivos, tempoTotalExtenso, timeline }
 */
function processarHistoricoEPeriodos(contracheques) {
  if (!contracheques || contracheques.length === 0) {
    return { totalMesesEfetivos: 0, tempoTotalExtenso: '0 meses', timeline: [] };
  }

  const ordenados = [...contracheques].sort((a, b) => (a.ano * 100 + a.mes) - (b.ano * 100 + b.mes));
  
  const mesesUnicos = [];
  const mapMes = new Map();
  for (const c of ordenados) {
    const key = `${c.ano}-${String(c.mes).padStart(2, '0')}`;
    if (!mapMes.has(key)) {
      mapMes.set(key, { ano: c.ano, mes: c.mes, cargo: c.cargo, items: [] });
      mesesUnicos.push(mapMes.get(key));
    }
    mapMes.get(key).items.push(c);
  }

  const timeline = [];
  let periodoAtual = null;

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
        periodoAtual.fim = atual;
        periodoAtual.mesesCount++;
        if (atual.cargo) periodoAtual.cargos.add(atual.cargo);
      } else if (diffMeses === 0) {
        // Mesmo mês
      } else {
        // Gap detectado
        timeline.push({
          tipo: 'periodo_ativo',
          inicio: { ano: periodoAtual.inicio.ano, mes: periodoAtual.inicio.mes },
          fim: { ano: periodoAtual.fim.ano, mes: periodoAtual.fim.mes },
          meses: periodoAtual.mesesCount,
          tempo_formatado: formatarMascaraAnoMeses(periodoAtual.mesesCount),
          cargos: Array.from(periodoAtual.cargos).join(' • ') || 'Servidor Municipal',
          descricao: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano} a ${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano} (${formatarMascaraAnoMeses(periodoAtual.mesesCount)})`
        });

        const gapMeses = diffMeses - 1;
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
      descricao: `${String(periodoAtual.inicio.mes).padStart(2, '0')}/${periodoAtual.inicio.ano} a ${String(periodoAtual.fim.mes).padStart(2, '0')}/${periodoAtual.fim.ano} (${formatarMascaraAnoMeses(periodoAtual.mesesCount)})`
    });
  }

  const totalMesesEfetivos = mesesUnicos.length;
  return {
    totalMesesEfetivos,
    tempoTotalExtenso: formatarMascaraAnoMeses(totalMesesEfetivos),
    timeline
  };
}

module.exports = {
  calcularDescontosEstatutarios,
  formatarMascaraAnoMeses,
  formatarMoeda,
  processarHistoricoEPeriodos
};
