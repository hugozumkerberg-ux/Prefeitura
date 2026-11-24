/**
 * Componente Modular de Tabela de Dados (ES6)
 * Renderizador genérico e algorítmico, sem acoplamento com modelos específicos
 */

export function renderTabela(colunas, dados, formatadores = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';

  if (!dados || dados.length === 0) {
    wrapper.innerHTML = `
      <div class="empty-state">
        <h3>Nenhum registro encontrado</h3>
        <p>Tente ajustar os filtros de busca ou o período selecionado.</p>
      </div>
    `;
    return wrapper;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');

  colunas.forEach(col => {
    const th = document.createElement('th');
    th.innerText = col.titulo;
    if (col.align) th.style.textAlign = col.align;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  dados.forEach(item => {
    const tr = document.createElement('tr');
    colunas.forEach(col => {
      const td = document.createElement('td');
      if (col.align) td.style.textAlign = col.align;

      const valorBruto = item[col.chave];
      if (formatadores[col.chave]) {
        td.innerHTML = formatadores[col.chave](valorBruto, item);
      } else {
        td.innerText = valorBruto !== null && valorBruto !== undefined ? valorBruto : '—';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}
