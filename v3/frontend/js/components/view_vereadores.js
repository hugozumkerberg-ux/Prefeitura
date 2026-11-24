/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 VEREADORES & LEGISLAÇÃO (SAPL)
 * Dados oficiais de atuação legislativa e projetos de lei da Câmara Municipal
 * ==============================================================================
 */

let apenasAtivos = true;
let buscaTexto = '';

export async function renderVereadoresView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #6366f1;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-purple">PODER LEGISLATIVO MUNICIPAL</span>
            <span class="badge badge-blue">Câmara Municipal de Arinos (SAPL)</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">⚖️ Vereadores & Atuação Legislativa</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Acompanhe o que cada parlamentar fez por Arinos: projetos de lei apresentados, indicações, requerimentos, cargos na Mesa Diretora e textos originais em PDF.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="card" style="margin-bottom: 20px; background: #0f172a;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <div style="flex: 1; min-width: 250px;">
          <input type="text" id="vereador-busca-input" placeholder="🔍 Buscar por nome do parlamentar..." 
                 value="${buscaTexto}"
                 style="width: 100%; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="btn-ativos" class="btn-primary" style="background: ${apenasAtivos ? '#2563eb' : '#1f2937'}; font-size: 12px; padding: 8px 14px;">
            Bancada Atual (11 Vereadores)
          </button>
          <button id="btn-todos" class="btn-primary" style="background: ${!apenasAtivos ? '#2563eb' : '#1f2937'}; font-size: 12px; padding: 8px 14px;">
            Acervo Histórico Completo
          </button>
        </div>
      </div>
    </div>

    <!-- Grid de Vereadores -->
    <div id="vereadores-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 30px;">
      <div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
        Carregando dados dos parlamentares...
      </div>
    </div>

    <!-- Modal de Dossiê do Vereador -->
    <div id="vereador-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
      <div id="vereador-modal-content" class="card" style="max-width: 780px; width: 100%; max-height: 90vh; overflow-y: auto; background: #0f172a; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 24px; position: relative;">
      </div>
    </div>
  `;

  const grid = container.querySelector('#vereadores-grid');
  const buscaInput = container.querySelector('#vereador-busca-input');
  const btnAtivos = container.querySelector('#btn-ativos');
  const btnTodos = container.querySelector('#btn-todos');
  const overlay = container.querySelector('#vereador-modal-overlay');
  const modalContent = container.querySelector('#vereador-modal-content');

  btnAtivos.addEventListener('click', () => {
    apenasAtivos = true;
    btnAtivos.style.background = '#2563eb';
    btnTodos.style.background = '#1f2937';
    loadVereadores();
  });

  btnTodos.addEventListener('click', () => {
    apenasAtivos = false;
    btnTodos.style.background = '#2563eb';
    btnAtivos.style.background = '#1f2937';
    loadVereadores();
  });

  let searchTimeout = null;
  buscaInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      buscaTexto = e.target.value.trim();
      loadVereadores();
    }, 300);
  });

  async function loadVereadores() {
    grid.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Consultando acervo legislativo...</div>`;

    try {
      const q = new URLSearchParams({ ativos: apenasAtivos, busca: buscaTexto });
      const res = await fetch(`/api/vereadores?${q.toString()}`);
      const data = await res.json();

      if (!data.sucesso || !data.vereadores || data.vereadores.length === 0) {
        grid.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Nenhum vereador encontrado com os filtros aplicados.</div>`;
        return;
      }

      grid.innerHTML = data.vereadores.map(v => {
        const fotoHtml = v.fotografia 
          ? `<img src="${v.fotografia}" alt="${v.nomeParlamentar}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #6366f1;">`
          : `<div style="width: 56px; height: 56px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 2px solid #475569;">🏛️</div>`;

        const cargosHtml = v.cargosMesa && v.cargosMesa.length > 0
          ? v.cargosMesa.map(c => `<span class="badge badge-amber" style="font-size: 10px;">${c.cargo}</span>`).join(' ')
          : '';

        return `
          <div class="card" style="background: #0f172a; padding: 20px; border-top: 4px solid #6366f1;">
            <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
              ${fotoHtml}
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="badge ${v.ativo ? 'badge-green' : 'badge-amber'}" style="font-size: 10px;">${v.ativo ? 'Em Exercício' : 'Histórico'}</span>
                </div>
                <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin: 4px 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.nomeParlamentar}</h3>
                <p style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.nomeCompleto}</p>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              ${cargosHtml}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
              <div style="background: #1e293b; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">PROJETOS DE LEI</div>
                <div style="font-size: 15px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
                  ${v.projetosLei}
                </div>
              </div>
              <div style="background: #1e293b; padding: 8px 10px; border-radius: 6px;">
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TOTAL MATÉRIAS</div>
                <div style="font-size: 15px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
                  ${v.totalMaterias}
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
              <button class="btn btn-ver-vereador" data-id="${v.id}" style="background: #1e293b; border: 1px solid #334155; color: #60a5fa; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
                📜 Ver Atuação & Leis
              </button>
              <span style="font-size: 11px; color: var(--text-muted);">ID: #${v.id}</span>
            </div>
          </div>
        `;
      }).join('');

      // Eventos de clique para abrir dossiê
      grid.querySelectorAll('.btn-ver-vereador').forEach(btn => {
        btn.addEventListener('click', () => {
          abrirDossieVereador(btn.dataset.id);
        });
      });
    } catch (err) {
      grid.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: #f87171; grid-column: 1 / -1;">Erro ao carregar dados: ${err.message}</div>`;
    }
  }

  async function abrirDossieVereador(id) {
    overlay.style.display = 'flex';
    modalContent.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Carregando histórico do parlamentar...</div>`;

    try {
      const res = await fetch(`/api/vereadores?id=${id}`);
      const data = await res.json();

      if (!data.sucesso || !data.parlamentar) {
        modalContent.innerHTML = `<p style="color: #f87171;">Não foi possível encontrar o parlamentar.</p>`;
        return;
      }

      const p = data.parlamentar;
      const materias = p.materias || [];

      modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <span class="badge badge-purple" style="margin-bottom: 6px;">DOSSIÊ PARLAMENTAR (SAPL)</span>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 4px 0;">${p.nome_parlamentar}</h2>
            <p style="font-size: 12px; color: var(--text-muted);">${p.nome_completo} • ${p.locais_atuacao || 'Câmara de Arinos'}</p>
          </div>
          <button id="btn-close-vereador" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 4px 8px;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 18px;">
          <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">PROJETOS DE LEI</div>
            <div style="font-size: 18px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">${p.projetos_lei || 0}</div>
          </div>
          <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TOTAL DE MATÉRIAS</div>
            <div style="font-size: 18px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace;">${p.total_materias || 0}</div>
          </div>
          <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">STATUS ATUAL</div>
            <div style="font-size: 14px; font-weight: 800; color: ${p.ativo ? '#34d399' : '#fbbf24'}; margin-top: 4px;">${p.ativo ? 'Em Exercício' : 'Histórico'}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 10px;">Projetos de Lei & Matérias Legislativas (${materias.length})</h3>
        
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #334155; border-radius: 6px;">
          ${materias.length === 0 ? '<p style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum projeto de lei registrado individualmente neste acervo.</p>' : `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
              <thead>
                <tr style="background: #1e293b; color: var(--text-muted); border-bottom: 1px solid #334155;">
                  <th style="padding: 8px 12px; width: 100px;">Número</th>
                  <th style="padding: 8px 12px;">Ementa / Descrição</th>
                  <th style="padding: 8px 12px; text-align: center; width: 100px;">Apresentação</th>
                  <th style="padding: 8px 12px; text-align: center; width: 80px;">Ação</th>
                </tr>
              </thead>
              <tbody>
                ${materias.map(m => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 8px 12px; font-family: 'JetBrains Mono', monospace; color: #60a5fa; font-weight: 700;">
                      ${m.titulo || `PL nº ${m.numero}/${m.ano}`}
                    </td>
                    <td style="padding: 8px 12px; color: #cbd5e1;">
                      ${m.ementa}
                    </td>
                    <td style="padding: 8px 12px; text-align: center; color: var(--text-muted); white-space: nowrap;">
                      ${m.data_apresentacao || m.ano}
                    </td>
                    <td style="padding: 8px 12px; text-align: center;">
                      ${m.texto_original ? `
                        <a href="${m.texto_original}" target="_blank" style="background: #3b82f6; color: #fff; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600;">
                          PDF ➔
                        </a>
                      ` : '<span style="color: var(--text-muted);">—</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;

      modalContent.querySelector('#btn-close-vereador')?.addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    } catch (err) {
      modalContent.innerHTML = `<p style="color: #f87171;">Falha ao carregar dossiê: ${err.message}</p>`;
    }
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  loadVereadores();
}
