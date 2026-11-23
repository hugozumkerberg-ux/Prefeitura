/**
 * ==============================================================================
 * MÓDULO DE NORMALIZAÇÃO DE TEXTO E RESOLUÇÃO SEMÂNTICA — ARINOS / MG
 * Remoção de acentos, pontuações, tratamento de plurais e sinônimos do eleitor
 * ==============================================================================
 */

/**
 * Remove acentos, pontuações e converte para minúsculas
 * @param {string} str Texto original
 * @returns {string} Texto normalizado em caixa baixa sem acentos
 */
function normalizarTexto(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')     // Remove caracteres especiais
    .replace(/\s+/g, ' ')            // Remove múltiplos espaços
    .trim();
}

/**
 * Dicionário de Sinônimos e Mapeamento Semântico
 * Conecta termos populares do cidadão aos termos técnicos do banco de dados
 */
const SINONIMOS_SEMANTICOS = {
  // Sinônimos de Funcionários e Servidores Públicos
  'funcionario': 'servidor',
  'funcionarios': 'servidor',
  'funcionaria': 'servidor',
  'funcionarias': 'servidor',
  'servidores': 'servidor',
  'servidora': 'servidor',
  'servidoras': 'servidor',
  'trabalhador': 'servidor',
  'trabalhadores': 'servidor',
  'concursado': 'efetivo',
  'concursados': 'efetivo',
  'comissionado': 'comissao',
  'comissionados': 'comissao',

  // Cargos populares e variações
  'medico': 'medico',
  'medicos': 'medico',
  'doutor': 'medico',
  'doutores': 'medico',
  'enfermeiro': 'enfermeiro',
  'enfermeiros': 'enfermeiro',
  'enfermeira': 'enfermeiro',
  'enfermeiras': 'enfermeiro',
  'professor': 'professor',
  'professores': 'professor',
  'professora': 'professor',
  'professoras': 'professor',
  'motorista': 'motorista',
  'motoristas': 'motorista',
  'gari': 'servicos publicos',
  'garis': 'servicos publicos',
  'vigia': 'vigilante',
  'vigias': 'vigilante',
  'prefeito': 'prefeito',
  'prefeitos': 'prefeito',
  'vereador': 'vereador',
  'vereadores': 'vereador'
};

/**
 * Identifica se a busca do usuário refere-se genericamente ao quadro de funcionários
 * @param {string} termo Termo pesquisado
 * @returns {boolean} True se o usuário está procurando o quadro geral de funcionários
 */
function ehBuscaGenericaFuncionarios(termo) {
  const norm = normalizarTexto(termo);
  return ['funcionario', 'funcionarios', 'funcionaria', 'funcionarias', 'servidor', 'servidores', 'servidora', 'servidoras', 'quadro', 'folha', 'equipe'].includes(norm);
}

module.exports = {
  normalizarTexto,
  SINONIMOS_SEMANTICOS,
  ehBuscaGenericaFuncionarios
};
