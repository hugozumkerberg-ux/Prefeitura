/**
 * ==============================================================================
 * SISTEMA UNIVERSAL DE POPUPS INFORMATIVOS — PORTAL DA TRANSPARÊNCIA DE ARINOS
 * ==============================================================================
 * Substitui tooltips flutuantes (que quebram layouts e sofrem clipping de overflow)
 * por popups / caixas de diálogo modais centralizadas, acessíveis e limpas.
 * ==============================================================================
 */

(function() {
  function criarModalPopupGlobal() {
    if (document.getElementById('popup-dialog-global')) return;

    const modal = document.createElement('div');
    modal.id = 'popup-dialog-global';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 999999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    modal.innerHTML = `
      <div id="popup-dialog-card" style="
        background: #0f172a;
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 18px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(59, 130, 246, 0.15);
        max-width: 480px;
        width: 100%;
        overflow: hidden;
        transform: scale(0.95);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Plus Jakarta Sans', Inter, sans-serif;
      ">
        <div style="
          padding: 16px 20px;
          background: rgba(30, 41, 59, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">💡</span>
            <span id="popup-dialog-title" style="font-weight: 800; font-size: 14px; color: #ffffff; letter-spacing: -0.2px;">Explicação do Indicador</span>
          </div>
          <button id="popup-dialog-close" style="
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #94a3b8;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            transition: all 0.2s;
          ">✕</button>
        </div>
        <div id="popup-dialog-body" style="
          padding: 20px;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-line;
          max-height: 60vh;
          overflow-y: auto;
        "></div>
        <div style="
          padding: 12px 20px;
          background: rgba(15, 23, 42, 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        ">
          <button id="popup-dialog-ok" style="
            padding: 8px 18px;
            background: #2563eb;
            color: #ffffff;
            font-weight: 700;
            font-size: 12px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
          ">Entendi</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function fecharModal(e) {
      if (e && e.target !== modal && e.target !== document.getElementById('popup-dialog-close') && e.target !== document.getElementById('popup-dialog-ok')) {
        return;
      }
      modal.style.opacity = '0';
      const card = document.getElementById('popup-dialog-card');
      if (card) card.style.transform = 'scale(0.95)';
      setTimeout(() => { modal.style.display = 'none'; }, 200);
    }

    modal.addEventListener('click', fecharModal);
    document.getElementById('popup-dialog-close').addEventListener('click', fecharModal);
    document.getElementById('popup-dialog-ok').addEventListener('click', fecharModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') fecharModal();
    });

    window.abrirPopupExplicativo = function(titulo, texto) {
      document.getElementById('popup-dialog-title').textContent = titulo || 'Explicação do Indicador';
      document.getElementById('popup-dialog-body').innerHTML = texto || '';
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.style.opacity = '1';
        const card = document.getElementById('popup-dialog-card');
        if (card) card.style.transform = 'scale(1)';
      }, 10);
    };
  }

  // Intercepta todos os elementos .has-tooltip
  function interceptarTooltips() {
    criarModalPopupGlobal();

    document.querySelectorAll('.has-tooltip').forEach(el => {
      if (el.dataset.popupAttached) return;
      el.dataset.popupAttached = 'true';

      const box = el.querySelector('.tooltip-box');
      if (!box) return;

      const texto = box.innerHTML.trim();
      const parentLabel = el.closest('th, td, .section-title, .citizen-kpi-label, .quick-chip, h2, h3, div');
      let titulo = 'Informação Cidadã';
      if (parentLabel) {
        const cloned = parentLabel.cloneNode(true);
        cloned.querySelectorAll('.tooltip-box, .tooltip-icon').forEach(n => n.remove());
        const t = cloned.textContent.trim().replace(/\s+/g, ' ');
        if (t.length > 2 && t.length < 50) titulo = t;
      }

      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.abrirPopupExplicativo(titulo, texto);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptarTooltips);
  } else {
    interceptarTooltips();
  }

  const observer = new MutationObserver(() => {
    interceptarTooltips();
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
