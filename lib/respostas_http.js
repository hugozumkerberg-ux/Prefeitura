/**
 * ==============================================================================
 * PADRÃO DE RESPOSTAS HTTP & API REST — ARINOS / MG
 * Envio padronizado de JSON em streaming, CORS, headers e tratamento de erros
 * ==============================================================================
 */

/**
 * Envia uma resposta JSON com headers corretos e CORS
 * @param {ServerResponse} res Resposta HTTP do Node.js
 * @param {object} data Objeto a ser serializado em JSON
 * @param {number} statusCode Código HTTP (default 200)
 */
function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

/**
 * Envia uma resposta de erro padronizada
 * @param {ServerResponse} res Resposta HTTP
 * @param {string} mensagem Mensagem do erro
 * @param {number} statusCode Código de erro (default 400 ou 500)
 */
function sendError(res, mensagem, statusCode = 400) {
  sendJson(res, { erro: true, mensagem, timestamp: new Date().toISOString() }, statusCode);
}

/**
 * Extrai e valida parâmetros defensivos de paginação
 * @param {URLSearchParams} searchParams Parâmetros da query string
 * @param {number} defaultLimit Limite padrão (default 25)
 * @param {number} maxLimit Limite máximo permitido (default 100)
 * @returns {object} { page, limit, offset }
 */
function extrairPaginacao(searchParams, defaultLimit = 25, maxLimit = 100) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = {
  sendJson,
  sendError,
  extrairPaginacao
};
