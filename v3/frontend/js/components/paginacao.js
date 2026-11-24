/**
 * Componente Modular de Paginação (ES6)
 * Totalmente desacoplado, emite eventos para troca de página
 */
export function renderPaginacao({ total, page, limit, totalPages }, onPageChange) {
  const container = document.createElement('div');
  container.className = 'pagination';

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  const info = document.createElement('div');
  info.innerHTML = `Mostrando <strong>${startRecord}</strong> a <strong>${endRecord}</strong> de <strong>${total.toLocaleString('pt-BR')}</strong> registros`;

  const btnGroup = document.createElement('div');
  btnGroup.style.display = 'flex';
  btnGroup.style.gap = '0.5rem';

  const btnPrev = document.createElement('button');
  btnPrev.className = 'page-btn';
  btnPrev.innerText = '← Anterior';
  btnPrev.disabled = page <= 1;
  btnPrev.onclick = () => onPageChange(page - 1);

  const pageIndicator = document.createElement('span');
  pageIndicator.style.alignSelf = 'center';
  pageIndicator.style.padding = '0 0.5rem';
  pageIndicator.style.fontWeight = 'bold';
  pageIndicator.innerText = `${page} / ${totalPages || 1}`;

  const btnNext = document.createElement('button');
  btnNext.className = 'page-btn';
  btnNext.innerText = 'Próxima →';
  btnNext.disabled = page >= totalPages;
  btnNext.onclick = () => onPageChange(page + 1);

  btnGroup.appendChild(btnPrev);
  btnGroup.appendChild(pageIndicator);
  btnGroup.appendChild(btnNext);

  container.appendChild(info);
  container.appendChild(btnGroup);

  return container;
}
