/**
 * ==============================================================================
 * UTILITÁRIO DE PADRONIZAÇÃO DE MATRÍCULA E NOMES — V3
 * Remove zeros à esquerda, padroniza formatos e normaliza nomes para busca fonética
 * ==============================================================================
 */

function normalizarNome(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function padronizarMatricula(str) {
  if (!str) return '';
  const s = String(str).trim();
  // Remove zeros à esquerda da matrícula (ex: 000573.7 -> 573-7, 001556.2 -> 1556-2)
  const semZeros = s.replace(/^0+/, '');
  return semZeros.replace('.', '-');
}

function formatarMatriculaExibicao(matriculaPadronizada, matriculaRaw) {
  if (matriculaPadronizada && String(matriculaPadronizada).trim()) {
    return String(matriculaPadronizada).trim();
  }
  if (!matriculaRaw) return '—';
  const limpo = String(matriculaRaw).trim().replace(/^0+/, '');
  return limpo.replace('.', '-') || '0';
}

module.exports = {
  normalizarNome,
  padronizarMatricula,
  formatarMatriculaExibicao
};
