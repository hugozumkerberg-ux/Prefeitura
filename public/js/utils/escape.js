/**
 * Utilitário de Escape HTML para Sanitização e Prevenção de XSS
 * Portal da Transparência de Arinos / MG
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default { escapeHtml };
