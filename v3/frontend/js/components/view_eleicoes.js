/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 ELEIÇÕES OFICIAIS TSE
 * Base completa extraída do TSE (Código 40894): Candidatos, Bens e Gastos
 * ==============================================================================
 */

let currentAnoEleicao = '2024';

export async function renderEleicoesView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #10b981;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-green">TRIBUNAL SUPERIOR ELEITORAL (TSE)</span>
            <span class="badge badge-blue">Código Município: 40894 (Arinos / MG)</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">🗳️ Eleições Municipais Oficiais do TSE</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Acervo oficial das eleições municipais de Arinos / MG. Dados extraídos diretamente da API do TSE com declaração patrimonial de bens e limites de gastos de campanha.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Seletor de Ano da Eleição -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;" id="eleicoes-seletor">
      <button class="btn-primary eleicao-ano-btn active" data-ano="2024" style="background: #2563eb;">🗳️ Eleição 2024</button>
      <button class="btn-primary eleicao-ano-btn" data-ano="2020" style="background: #1f2937;">🗳️ Eleição 2020</button>
      <button class="btn-primary eleicao-ano-btn" data-ano="2016" style="background: #1f2937;">🗳️ Eleição 2016</button>
      <button class="btn-primary eleicao-ano-btn" data-ano="2012" style="background: #1f2937;">🗳️ Eleição 2012</button>
    </div>

    <!-- Grid de Candidatos da Eleição -->
    <div id="eleicoes-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 30px;">
      <div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
        Carregando dados eleitorais do TSE...
      </div>
    </div>

    <!-- Modal de Bens Detalhados -->
    <div id="bens-modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
      <div id="bens-modal-content" class="card" style="max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; background: #0f172a; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); padding: 24px; position: relative;">
      </div>
    </div>
  `;

  const grid = container.querySelector('#eleicoes-grid');
  const btns = container.querySelectorAll('.eleicao-ano-btn');
  const overlay = container.querySelector('#bens-modal-overlay');
  const modalContent = container.querySelector('#bens-modal-content');

  btns.forEach(b => {
    b.addEventListener('click', () => {
      btns.forEach(x => {
        x.style.background = '#1f2937';
        x.classList.remove('active');
      });
      b.style.background = '#2563eb';
      b.classList.add('active');
      currentAnoEleicao = b.dataset.ano;
      loadEleicao();
    });
  });

  async function loadEleicao() {
    grid.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Consultando base TSE Arinos ${currentAnoEleicao}...</div>`;

    try {
      const res = await fetch(`/api/eleicoes?ano=${currentAnoEleicao}`);
      const data = await res.json();

      if (!data.sucesso || !data.dados || data.dados.length === 0) {
        grid.innerHTML = `<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Nenhum candidato encontrado no acervo para este ano.</div>`;
        return;
      }

      // Ordenar: Eleitos primeiro, depois por cargo (Prefeito antes de Vice)
      const ordenados = [...data.dados].sort((a, b) => {
        if (a.resultadoEleicao === 'Eleito' && b.resultadoEleicao !== 'Eleito') return -1;
        if (b.resultadoEleicao === 'Eleito' && a.resultadoEleicao !== 'Eleito') return 1;
        if (a.cargo === 'Prefeito' && b.cargo !== 'Prefeito') return -1;
        return 0;
      });

      grid.innerHTML = ordenados.map((c, index) => {
        const isEleito = c.resultadoEleicao === 'Eleito';
        const borderTop = isEleito ? 'border-top: 4px solid #10b981;' : 'border-top: 4px solid #475569;';
        const badgeTotalizacao = isEleito ? 'badge-green' : 'badge-amber';

        return `
          <div class="card" style="background: #0f172a; padding: 20px; ${borderTop}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span class="badge ${c.cargo === 'Prefeito' ? 'badge-blue' : 'badge-purple'}">${c.cargo}</span>
                <span class="badge" style="background: rgba(255,255,255,0.06); font-family: 'JetBrains Mono', monospace;">${c.partido} (${c.numero})</span>
              </div>
              <span class="badge ${badgeTotalizacao}">${c.resultadoEleicao}</span>
            </div>

            <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0;">${c.nomeUrna}</h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">${c.nomeCompleto}</p>

            <div style="background: rgba(30, 41, 59, 0.6); padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; font-size: 12px;">
              <div style="margin-bottom: 4px;"><strong>Coligação:</strong> <span style="color: #cbd5e1;">${c.coligacao}</span></div>
              <div><strong>Situação TSE:</strong> <span style="color: #34d399;">${c.situacaoCandidatura}</span></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
              <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">BENS DECLARADOS</div>
                <div style="font-size: 14px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
                  R$ ${Number(c.totalBensDeclarados || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style="background: #1e293b; padding: 10px; border-radius: 6px;">
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TETO DE GASTOS</div>
                <div style="font-size: 14px; font-weight: 800; color: #60a5fa; font-family: 'JetBrains Mono', monospace; margin-top: 2px;">
                  ${c.gastoCampanhaLimite > 0 ? 'R$ ' + Number(c.gastoCampanhaLimite).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Não aplicável'}
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
              <button class="btn btn-ver-bens" data-idx="${index}" style="background: #1e293b; border: 1px solid #334155; color: #60a5fa; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
                💰 Ver Bens Declarados (${c.bensDetalhados ? c.bensDetalhados.length : 0})
              </button>
              <span style="font-size: 11px; color: var(--text-muted);">TSE ID: #${c.idCandidatoTSE}</span>
            </div>
          </div>
        `;
      }).join('');

      // Evento de clique para ver bens detalhados
      grid.querySelectorAll('.btn-ver-bens').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const cand = ordenados[idx];
          if (!cand) return;

          let bensHtml = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <div>
                <span class="badge badge-green" style="margin-bottom: 6px;">DECLARAÇÃO PATRIMONIAL TSE</span>
                <h2 style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0;">${cand.nomeUrna} (${cand.partido})</h2>
                <p style="font-size: 12px; color: var(--text-muted);">${cand.nomeCompleto} • Eleição ${cand.anoEleicao}</p>
              </div>
              <button id="btn-close-bens" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 4px 8px;">✕</button>
            </div>

            <div style="background: #1e293b; padding: 12px; border-radius: 6px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 700;">TOTAL DE BENS DECLARADOS</div>
                <div style="font-size: 20px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">
                  R$ ${Number(cand.totalBensDeclarados || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span class="badge badge-blue">${cand.bensDetalhados ? cand.bensDetalhados.length : 0} item(ns)</span>
            </div>
          `;

          if (!cand.bensDetalhados || cand.bensDetalhados.length === 0) {
            bensHtml += `<p style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum bem declarado à Justiça Eleitoral para este pleito.</p>`;
          } else {
            bensHtml += `
              <div style="max-height: 400px; overflow-y: auto; border: 1px solid #334155; border-radius: 6px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                  <thead>
                    <tr style="background: #1e293b; color: var(--text-muted); border-bottom: 1px solid #334155;">
                      <th style="padding: 8px 12px; width: 40px;">#</th>
                      <th style="padding: 8px 12px;">Tipo / Descrição</th>
                      <th style="padding: 8px 12px; text-align: right;">Valor Declarado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cand.bensDetalhados.map((b, i) => `
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 8px 12px; color: var(--text-muted);">${i + 1}</td>
                        <td style="padding: 8px 12px; color: #cbd5e1;">
                          <strong>${b.descricao || 'Bem'}</strong>
                          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${b.detalhe || ''}</div>
                        </td>
                        <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #34d399; font-family: 'JetBrains Mono', monospace; white-space: nowrap;">
                          R$ ${Number(b.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }

          modalContent.innerHTML = bensHtml;
          overlay.style.display = 'flex';

          modalContent.querySelector('#btn-close-bens')?.addEventListener('click', () => {
            overlay.style.display = 'none';
          });
        });
      });
    } catch (err) {
      grid.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: #f87171; grid-column: 1 / -1;">Erro ao carregar dados do TSE: ${err.message}</div>`;
    }
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  loadEleicao();
}
