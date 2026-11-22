const fs = require('node:fs');

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&iacute;/gi, 'í')
    .replace(/&Iacute;/gi, 'Í')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&Ccedil;/gi, 'Ç')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&Otilde;/gi, 'Õ')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&Atilde;/gi, 'Ã')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/gi, 'É')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&Oacute;/gi, 'Ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&Uacute;/gi, 'Ú')
    .replace(/&aacute;/gi, 'á')
    .replace(/&Aacute;/gi, 'Á')
    .replace(/&nbsp;/gi, ' ');
}

function parseMoney(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/R\$/g, '').trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function test() {
  const url = 'http://www.adpmnet.com.br/index2.php?option=com_contpubl&brasao=P310450.GIF&dsorg=Funda%C3%A7%C3%A3o+Municipal+de+Sa%C3%BAde+de+Arinos&titulo=Remunera%C3%A7%C3%A3o+Mensal+dos+Servidores+P%C3%BAblicos&idorg=241&dsufe=Estado de Minas Gerais&cnpj=18650424000167&tpformpdf=52&ano=2025&mes=2&idfun=392&idpcl=1&nome_mat=1&nao_proventos=0&nao_descontos=0&idgca=1';
  const res = await fetch(url);
  const rawHtml = await res.text();
  const html = decodeEntities(rawHtml);

  const rubricas = [];
  const eventRegex = /<tr[^>]*>\s*<td[^>]*colspan=["']2["'][^>]*>(.*?)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>(.*?)<\/td>\s*<td[^>]*class=["'][^"']*tdrigth[^"']*["'][^>]*>(.*?)<\/td>\s*<\/tr>/gi;
  let evMatch;
  while ((evMatch = eventRegex.exec(html)) !== null) {
    const desc = evMatch[1].replace(/<[^>]+>/g, '').trim();
    const remunStr = evMatch[2].replace(/<[^>]+>/g, '').trim();
    const descStr = evMatch[3].replace(/<[^>]+>/g, '').trim();

    if (desc && (remunStr || descStr)) {
      if (remunStr) {
        rubricas.push({ descricao: desc, tipo: 'PROVENTO', valor: parseMoney(remunStr) });
      }
      if (descStr) {
        rubricas.push({ descricao: desc, tipo: 'DESCONTO', valor: parseMoney(descStr) });
      }
    }
  }

  const provFromRubricas = rubricas.filter(r => r.tipo === 'PROVENTO').reduce((acc, r) => acc + (r.valor || 0), 0);
  const descFromRubricas = rubricas.filter(r => r.tipo === 'DESCONTO').reduce((acc, r) => acc + (r.valor || 0), 0);
  const liqFromRubricas = Math.round((provFromRubricas - descFromRubricas) * 100) / 100;

  // Regex para Valor Líquido explícito no HTML
  const liqMatch = html.match(/Valor\s+L[íi]quido[\s\S]*?tdrigth[^>]*>[\s\S]*?([0-9.,]+)/i);
  const liqExplicit = liqMatch ? parseMoney(liqMatch[1]) : null;

  console.log('Rubricas:', rubricas.length);
  console.log('Proventos calculados:', provFromRubricas);
  console.log('Descontos calculados:', descFromRubricas);
  console.log('Líquido calculado:', liqFromRubricas);
  console.log('Líquido explicit match:', liqExplicit);
}

test();
