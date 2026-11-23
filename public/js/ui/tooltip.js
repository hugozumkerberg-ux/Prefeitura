/**
 * Gerenciador de Tooltips & Popups Acessíveis
 * Portal da Transparência de Arinos / MG
 * 
 * Converte tooltips flutuantes em popups modais responsivos que nunca quebram o layout
 * em tabelas ou dispositivos móveis.
 */

let popupModalEl = null;

export function initTooltips() {
  // Cria o container do popup modal no DOM caso ainda não exista
  if (!popupModalEl) {
    popupModalEl = document.getElementById('tooltip-popup-modal');
    if (!popupModalEl) {
      popupModalEl = document.createElement('div');
      popupModalEl.id = 'tooltip-popup-modal';
      popupModalEl.className = 'fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4';
      popupModalEl.innerHTML = `
        <div class="glass-card bg-slate-900/95 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 id="tooltip-popup-title" class="font-bold text-white text-base flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span id="tooltip-popup-title-text">Informação</span>
            </h4>
            <button id="tooltip-popup-close" class="text-slate-400 hover:text-white text-xl font-bold px-2.5 py-0.5 rounded-lg hover:bg-slate-800 transition">&times;</button>
          </div>
          <div id="tooltip-popup-body" class="text-slate-300 text-sm leading-relaxed space-y-2"></div>
          <div class="pt-2 border-t border-slate-800/80 flex justify-end">
            <button id="tooltip-popup-ok" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition">Entendi</button>
          </div>
        </div>
      `;
      document.body.appendChild(popupModalEl);

      const fechar = () => popupModalEl.classList.add('hidden');
      popupModalEl.querySelector('#tooltip-popup-close').addEventListener('click', fechar);
      popupModalEl.querySelector('#tooltip-popup-ok').addEventListener('click', fechar);
      popupModalEl.addEventListener('click', (e) => {
        if (e.target === popupModalEl) fechar();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !popupModalEl.classList.contains('hidden')) fechar();
      });
    }
  }

  // Delegação de eventos para capturar cliques em ícones de interrogação / tooltips
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.tooltip-icon, .has-tooltip');
    if (!trigger) return;

    // Se o clique for dentro do popup modal aberto, não reabre
    if (e.target.closest('#tooltip-popup-modal')) return;

    const parentTooltip = trigger.closest('.has-tooltip');
    if (!parentTooltip) return;

    const box = parentTooltip.querySelector('.tooltip-box');
    if (!box) return;

    e.preventDefault();
    e.stopPropagation();

    abrirPopupTooltip(box);
  });
}

export function abrirPopupTooltip(tooltipBoxEl) {
  if (!popupModalEl) initTooltips();

  const titleEl = tooltipBoxEl.querySelector('.tooltip-title');
  const bodyEl = tooltipBoxEl.querySelector('.tooltip-body');
  const calcEl = tooltipBoxEl.querySelector('.tooltip-calc');
  const noteEl = tooltipBoxEl.querySelector('.tooltip-note');

  const popupTitleText = document.getElementById('tooltip-popup-title-text');
  const popupBody = document.getElementById('tooltip-popup-body');

  if (popupTitleText) {
    popupTitleText.innerText = titleEl ? titleEl.innerText : 'Detalhes Informativos';
  }

  if (popupBody) {
    let contentHtml = '';
    if (bodyEl) {
      contentHtml += `<div class="text-slate-200">${bodyEl.innerHTML}</div>`;
    }
    if (calcEl) {
      contentHtml += `<div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold mt-2">${calcEl.innerHTML}</div>`;
    }
    if (noteEl) {
      contentHtml += `<div class="text-[11px] text-slate-400 italic mt-1 font-mono">${noteEl.innerHTML}</div>`;
    }
    popupBody.innerHTML = contentHtml || '<p class="text-slate-400">Nenhum detalhe adicional disponível.</p>';
  }

  popupModalEl.classList.remove('hidden');
}

export default { initTooltips, abrirPopupTooltip };
