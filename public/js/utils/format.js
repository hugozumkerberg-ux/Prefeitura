/**
 * Utilitários de Formatação de Dados, Moeda e Máscaras
 * Portal da Transparência de Arinos / MG
 */

export function formatMoeda(val) {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarMascaraAnoMeses(totalMeses) {
  const m = parseInt(totalMeses, 10) || 0;
  if (m <= 0) return '0 meses';
  const anos = Math.floor(m / 12);
  const mesesRestantes = m % 12;
  const partes = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (mesesRestantes > 0) partes.push(`${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`);
  return partes.join(' e ') || '0 meses';
}

export function formatNumber(val) {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR');
}

export function formatMatricula(mat) {
  if (!mat) return '-';
  return String(mat).replace(/^0+/, '').replace('.', '-') || '-';
}

export function formatCPF(cpf) {
  if (!cpf) return '-';
  const clean = String(cpf).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**');
  }
  return cpf;
}

export function formatCNPJ(cnpj) {
  if (!cnpj) return '-';
  const clean = String(cnpj).replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

export default {
  formatMoeda,
  formatarMascaraAnoMeses,
  formatNumber,
  formatMatricula,
  formatCPF,
  formatCNPJ
};
