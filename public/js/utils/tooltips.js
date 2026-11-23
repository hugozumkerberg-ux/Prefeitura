/**
 * Dicionário de Tooltips & Metadados Educativos Cidadãos
 * Portal da Transparência de Arinos / MG
 * 
 * Centraliza todos os textos informativos como DADOS para fácil manutenção e auditoria.
 */

import { escapeHtml } from './escape.js';

export const TOOLTIPS_DATA = {
  kpiContracheques: {
    title: 'Folha de Pagamento',
    body: 'Total de registros de remuneração de servidores públicos.\n• Abrange servidores efetivos, comissionados e contratados.\n• Valores brutos antes das deduções de previdência e IRRF.',
    note: 'Base auditada: 2013 a 2026 (ADPM)'
  },
  kpiDespesas: {
    title: 'Despesas Empenhadas',
    body: 'Valores de pagamentos efetuados pelo município.\n• Prestação de serviços, compras, contratos e obras.\n• Classificação por credor, histórico e empenho.',
    note: 'Fonte: SIAP / ADPM Arinos'
  },
  kpiDiarias: {
    title: 'Diárias de Viagem',
    body: 'Indenizações para despesas de servidores fora de Arinos.\n• Alimentação e estada para compromissos públicos.\n• Deslocamentos a Brasília, Belo Horizonte, Unaí e região.',
    note: 'Verba de natureza indenizatória'
  },
  kpiContratos: {
    title: 'Contratos & Aditivos',
    body: 'Instrumentos contratuais firmados pela prefeitura.\n• Licitações públicas, dispensas e inexigibilidades.\n• Registro de fornecimento contínuo e serviços.',
    note: 'Vigências e aditivos registrados'
  },
  kpiReceitas: {
    title: 'Arrecadação Municipal',
    body: 'Entrada de receitas nos cofres públicos de Arinos.\n• Repasses constitucionais (FPM, FUNDEB, ICMS).\n• Tributos próprios municipais (IPTU, ISSQN, taxas).',
    note: 'Fonte: SIAP / Tesouro Municipal'
  },
  kpiGlobal: {
    title: 'Consolidação Global',
    body: 'Volume total de recursos públicos auditados.\n• Mais de 202.000 lançamentos oficiais cruzados.\n• Auditoria forense e rastreabilidade total de dados.',
    calc: 'Total = Folha + Contratos + Despesas'
  },
  filtrosPadrao: {
    title: 'Filtros de Competência e Órgão',
    body: 'Selecione o Ano e Mês para filtrar contracheques ou despesas por competência contábil (MM/AAAA).\n• Prefeitura: Administração Direta.\n• Saúde: Fundação Municipal de Saúde.'
  },
  filtrosPessoas: {
    title: 'Perfis de Pessoas & Dinheiro Público',
    body: 'Agrupamento inteligente com cruzamento de fontes:\n• Prefeitos, vereadores e secretários com vínculos.\n• Sócios de empresas contratadas pelo município.\n• Múltiplas matrículas e servidores públicos.'
  },
  infoSoma: {
    title: 'Soma dos Registros Filtrados',
    body: 'Totalizador financeiro da listagem ativa com base nos filtros selecionados.'
  },
  thCidadao: {
    title: 'Perfil Unificado do Cidadão',
    body: 'Registro individual com resolução de entidades.\n• Nome civil e dados biográficos consolidados.\n• Foto auditada pericialmente contra dados oficiais.\n• Clique na linha para abrir a Ficha 360°.'
  },
  thPerfilVinculo: {
    title: 'Classificação Institucional',
    body: 'Papel público do agente apurado na base:\n• Prefeito ou Vice-Prefeito de Arinos.\n• Vereador da Câmara Municipal.\n• Servidor Público Concursado ou Comissionado.\n• Sócio de Empresa Fornecedora da Prefeitura.'
  },
  thMatriculas: {
    title: 'Matrículas Identificadas',
    body: 'Quantidade de vínculos funcionais no histórico.\n• Servidores podem possuir múltiplas matrículas ao longo dos anos.\n• Acumulação legal prevista no art. 37 da CF/88 (saúde e magistério).'
  },
  thCargos: {
    title: 'Funções Públicas',
    body: 'Cargos, secretarias e atribuições exercidas na Prefeitura e na Fundação de Saúde.'
  },
  thSalariosAcumulados: {
    title: 'Remuneração Acumulada',
    body: 'Somatório histórico de todos os vencimentos:\n• Salário Bruto: Total integral apurado na folha.\n• Líquido Estimado: Poder de compra real após INSS e IRRF.\n• Tempo: Meses efetivos com contracheque emitido.',
    calc: 'Bruto = Base + Gratificações + Adicionais'
  },
  thDiarias: {
    title: 'Diárias e Viagens Oficiais',
    body: 'Indenizações para deslocamentos a serviço fora de Arinos:\n• Transporte, alimentação e hospedagem.\n• Viagens a Brasília, Belo Horizonte, Unaí e região.',
    note: 'Verba indenizatória que não compõe salário'
  },
  thTotalDinheiroPublico: {
    title: 'Consolidação Total Recebida',
    body: 'Todo o recurso público municipal pago ao cidadão:\n• Somatório de Salários Brutos + Diárias Oficiais.\n• Base histórica auditada de 2013 a 2026.',
    calc: 'Total = Salários Brutos + Diárias'
  },
  thCompetencia: {
    title: 'Competência Contábil',
    body: 'Mês e ano da folha de pagamento (MM/AAAA).'
  },
  thOrgaoEmissor: {
    title: 'Órgão Emissor',
    body: 'Unidade pagadora da folha:\n• Prefeitura Municipal de Arinos\n• Fundação Municipal de Saúde de Arinos.'
  },
  thNaturezaVinculo: {
    title: 'Natureza do Vínculo',
    body: 'Regime de contratação pública:\n• Concursado Efetivo\n• Comissionado / Recrutamento Amplo\n• Contratado por Designação Temporária\n• Agente Político (Prefeito, Secretário, Vereador).'
  },
  thSalarioBruto: {
    title: 'Remuneração Bruta (Proventos)',
    body: 'Valor total a que o servidor tem direito antes de deduções:\n• Vencimento base do cargo.\n• Gratificações de função, quinquênios e horas extras.\n• Adicionais de insalubridade e periculosidade.',
    calc: 'Bruto = Vencimento Base + Gratificações'
  },
  thDescontos: {
    title: 'Descontos Estatutários',
    body: 'Deduções legais obrigatórias retidas na fonte:\n• Previdência Oficial (INSS / RPPS Municipal).\n• Imposto de Renda Retido na Fonte (IRRF).\n• Alíquotas progressivas oficiais calculadas por faixa salarial.',
    calc: 'Descontos = INSS/RPPS + IRRF'
  },
  thSalarioLiquido: {
    title: 'Salário Líquido a Receber',
    body: 'Valor efetivamente creditado na conta bancária do servidor:\n• Calculado pela fórmula matemática: Salário Bruto − Descontos.\n• O valor que o trabalhador realmente recebe para consumo.',
    calc: 'Líquido = Bruto − Descontos'
  },
  thDataEmpenho: {
    title: 'Data e Número do Empenho',
    body: 'Ato emanado de autoridade competente que cria para o município a obrigação de pagamento (Lei 4.320/64).'
  },
  thValorEmpenho: {
    title: 'Valor da Despesa Empenhada',
    body: 'Recurso público reservado e liquidado para quitação do serviço ou produto fornecido ao município.'
  },
  thValorDiaria: {
    title: 'Valor Indenizatório',
    body: 'Custeio de viagem a serviço público para despesas de alimentação e pousada.'
  },
  thVigenciaContrato: {
    title: 'Período de Vigência',
    body: 'Data de início e data final de validade do instrumento contratual e aditivos.'
  },
  thValorContratado: {
    title: 'Valor Global do Contrato',
    body: 'Montante financeiro total homologado para a execução do contrato administrativo.'
  },
  thValorReceita: {
    title: 'Receita Pública Efetivada',
    body: 'Valor creditado nos cofres da Prefeitura (tributos municipais ou repasses estaduais/federais).'
  },
  thValorConvenio: {
    title: 'Montante do Convênio',
    body: 'Repasse firmado com o Estado ou União para obras e projetos com contrapartida municipal.'
  },
  tempoServico: {
    title: 'Tempo Efetivo de Trabalho',
    body: 'Cálculo pericial rigoroso de meses com vínculo ativo:\n• Conta estritamente os meses em que houve folha emitida.\n• Não soma períodos de afastamento, exoneração ou sem vínculo.\n• Evita distorções causadas pela simples diferença entre a data inicial e final.',
    note: 'Base: Folhas ativas mensais'
  },
  holeriteProventos: {
    title: 'Proventos & Vencimentos',
    body: 'Verbas creditadas em favor do servidor:\n• Vencimento-base do cargo efetivo ou comissionado.\n• Gratificações de função, produtividade e horas extras.\n• Adicionais de insalubridade, quinquênios e terço de férias.'
  },
  holeriteDescontos: {
    title: 'Deduções Oficiais Obrigatórias',
    body: 'Retenções estatutárias calculadas pela lei:\n• INSS / RPPS Municipal: Contribuição previdenciária progressiva.\n• IRRF: Imposto de Renda Retido na Fonte da Receita Federal.\n• Outras deduções legais (consignados, faltas ou pensões judiciais).'
  },
  holeriteCalculoLiquido: {
    title: 'Cálculo do Salário Líquido',
    body: 'Valor líquido final que cai na conta bancária do servidor:\n• Salário Bruto menos os Descontos Oficiais.',
    calc: 'Líquido = Bruto − Descontos'
  }
};

/**
 * Renderiza o HTML do tooltip a partir dos dados do dicionário
 * @param {string} key - Chave no dicionário TOOLTIPS_DATA
 * @param {object} [options] - Opções de alinhamento e rótulo
 * @param {string} [options.label] - Rótulo opcional que precede o ícone
 * @param {string} [options.align] - 'left', 'right' ou '' (centro)
 * @param {string} [options.position] - 'bottom' ou 'top' (padrão: bottom)
 * @param {string} [options.customCalc] - Fórmula de cálculo customizada
 */
export function renderTooltip(key, options = {}) {
  const data = TOOLTIPS_DATA[key];
  if (!data) return options.label ? `<span>${escapeHtml(options.label)}</span>` : '';

  const positionClass = options.position === 'top' ? 'tooltip-top' : 'tooltip-bottom';
  const alignClass = options.align === 'left' ? 'tooltip-align-left' : (options.align === 'right' ? 'tooltip-align-right' : '');
  const calcText = options.customCalc || data.calc;

  const labelHtml = options.label ? `<span>${escapeHtml(options.label)}</span> ` : '';
  const bodyFormatted = escapeHtml(data.body).replace(/\n/g, '<br>');

  return `
    <span class="has-tooltip ${positionClass} ${alignClass}" tabindex="0">
      ${labelHtml}<span class="tooltip-icon">?</span>
      <div class="tooltip-box">
        <span class="tooltip-title">${escapeHtml(data.title)}</span>
        <span class="tooltip-body">${bodyFormatted}</span>
        ${calcText ? `<span class="tooltip-calc">${escapeHtml(calcText)}</span>` : ''}
        ${data.note ? `<span class="tooltip-note">${escapeHtml(data.note)}</span>` : ''}
      </div>
    </span>
  `.trim();
}

export default { TOOLTIPS_DATA, renderTooltip };
