/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 AUDITORIA FORENSE SHA-256
 * Rastreamento de linhagem, árvore de custódia e validação criptográfica
 * ==============================================================================
 */

export function renderAuditoriaView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #8b5cf6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-purple">AUDITORIA CRIPTOGRÁFICA</span>
            <span class="badge badge-green">100% Hashes SHA-256</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">🛡️ Rastreador Forense de Linhagem & Custódia</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Auditoria estrita dos 133.441 contracheques e pagamentos de Arinos/MG. Cole um Hash SHA-256 de 64 caracteres, uma Matrícula ou Nome de Servidor para inspecionar a cadeia de custódia e autenticidade pericial do registro público oficial.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Barra de Rastreamento -->
    <div class="card" style="margin-bottom: 20px; background: #0f172a;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <input type="text" id="auditoria-input" placeholder="Cole o Hash SHA-256 (64 hex), Matrícula (ex: 001572.8) ou Nome do Servidor..." 
               style="flex: 1; min-width: 320px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 12px 14px; border-radius: 6px; font-size: 13px; font-family: 'JetBrains Mono', monospace;">
        <button id="auditoria-btn-rastrear" class="btn-primary" style="padding: 12px 24px; font-size: 13px; font-weight: 700;">
          🔍 Rastrear Dado
        </button>
      </div>
    </div>

    <!-- 3 KPIs de Integridade -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Assinatura Criptográfica</div>
        <div style="font-size: 20px; font-weight: 800; color: #10b981; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">100% SHA-256</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Cada holerite possui hash imutável</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Modo de Segurança</div>
        <div style="font-size: 20px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">Read-Only</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Bases oficiais montadas estritamente para leitura</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Holerites na Custódia</div>
        <div style="font-size: 20px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">133.441</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Zeros à esquerda padronizados</div>
      </div>
    </div>

    <!-- Área de Resultados do Rastreamento -->
    <div id="auditoria-resultado">
      <div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); background: #0f172a;">
        Insira um identificador acima para verificar a cadeia de custódia e o selo digital que autentica o registro pericial.
      </div>
    </div>
  `;

  const input = container.querySelector('#auditoria-input');
  const btn = container.querySelector('#auditoria-btn-rastrear');
  const resultado = container.querySelector('#auditoria-resultado');

  async function rastrear() {
    const termo = input.value.trim();
    if (!termo) return;

    resultado.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); background: #0f172a;">Rastreando cadeia de custódia pericial...</div>';

    try {
      const res = await fetch(`/api/auditoria/rastrear?termo=${encodeURIComponent(termo)}`);
      const data = await res.json();

      if (!data.sucesso) {
        resultado.innerHTML = `
          <div class="card" style="text-align: center; padding: 30px; background: #0f172a; border-left: 4px solid #f87171;">
            <h4 style="color: #f87171; margin-bottom: 8px; font-size: 16px;">Registro não localizado</h4>
            <p style="color: var(--text-muted); font-size: 12px;">${data.erro || 'O termo informado não corresponde a nenhum hash ou matrícula existente.'}</p>
          </div>
        `;
        return;
      }

      const doc = data.documentoConsultado || {};
      const serv = data.servidor || {};
      const nomeExibicao = doc.nome || serv.nome || 'Registro Auditado';
      const cargoExibicao = doc.cargo || (serv.cargos && serv.cargos.join(', ')) || '—';
      const lotacaoExibicao = doc.lotacao || '—';
      const matriculaExibicao = doc.matricula || (serv.matriculas && serv.matriculas.join(', ')) || '—';
      const sha256Exibicao = doc.sha256 || data.sha256 || '—';

      const formatBRL = v => typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

      const pol = serv.passado_politico || {};
      const temPol = pol.tem_passado_politico;
      const venceu = pol.venceu;
      const fotoUrl = serv.foto_url;

      const fotoHtml = fotoUrl ? `
        <img 
          src="${fotoUrl}" 
          alt="${nomeExibicao}" 
          style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 3px solid ${venceu ? '#10b981' : (temPol ? '#f59e0b' : '#3b82f6')}; flex-shrink: 0;"
          onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(nomeExibicao)}&background=1e293b&color=93c5fd&size=120';"
        >
      ` : `
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #1e293b; border: 3px solid ${temPol ? (venceu ? '#10b981' : '#f59e0b') : '#334155'}; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #93c5fd; font-size: 20px; flex-shrink: 0;">
          ${(nomeExibicao || '?').slice(0, 2).toUpperCase()}
        </div>
      `;

      resultado.innerHTML = `
        <div class="card" style="background: #0f172a; padding: 22px; border-left: 4px solid #10b981; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <span class="badge badge-green">✔ CUSTÓDIA CONFIRMADA</span>
              <span class="badge" style="background: rgba(192, 132, 252, 0.2); color: #c084fc; border: 1px solid #a855f7; font-weight: 700; font-size: 11px;">
                ID ÚNICO CANÔNICO #${serv.pessoa_id || '—'}
              </span>
              ${temPol ? `<span class="badge ${venceu ? 'badge-green' : 'badge-amber'}">${venceu ? '🏛️ Mandato Eleito' : '🗳️ Candidato TSE'}</span>` : ''}
            </div>
            <span style="font-size: 11px; color: #94a3b8;"><strong style="color: #60a5fa;">Fonte Oficial:</strong> Portal da Transparência / SIAP — Arinos/MG</span>
          </div>

          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px; flex-wrap: wrap;">
            ${fotoHtml}
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 4px;">${nomeExibicao}</h3>
              <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Cargo: <strong style="color: #e2e8f0;">${cargoExibicao}</strong> • Lotação: <strong style="color: #e2e8f0;">${lotacaoExibicao}</strong> • Matrícula: <strong style="color: #60a5fa;">${matriculaExibicao}</strong></p>
            </div>
          </div>

          ${temPol ? `
            <!-- 🏛️ Card Político e Eleitoral Oficial TSE / Câmara -->
            <div style="background: #0b1120; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 16px;">${venceu ? '🏛️' : '🗳️'}</span>
                  <strong style="color: #fff; font-size: 12px; text-transform: uppercase;">Registro Político & Eleitoral (TSE / Câmara de Arinos)</strong>
                </div>
                <span class="badge" style="background: ${venceu ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${venceu ? '#34d399' : '#fbbf24'}; border: 1px solid ${venceu ? '#10b981' : '#f59e0b'}; font-size: 11px; font-weight: 700;">
                  ${pol.tag_texto || (venceu ? 'Mandato Político Oficial' : 'Candidato TSE')}
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 10px;">
                <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                  <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Status Eleitoral</div>
                  <div style="font-size: 13px; font-weight: 700; color: ${venceu ? '#34d399' : '#fbbf24'};">${venceu ? '✔ Eleito (Venceu)' : `Não Eleito (${pol.status_eleicao || 'Suplente'})`}</div>
                </div>
                <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                  <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Cargo Disputado</div>
                  <div style="font-size: 13px; font-weight: 700; color: #60a5fa;">${pol.cargo_politico || '—'}</div>
                </div>
                <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                  <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Partido / Coligação</div>
                  <div style="font-size: 13px; font-weight: 700; color: #cbd5e1;">${pol.partido_politico || '—'}</div>
                </div>
                <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                  <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Bens Declarados TSE</div>
                  <div style="font-size: 13px; font-weight: 700; color: #34d399;">${pol.bens_declarados_tse ? formatBRL(pol.bens_declarados_tse) : 'Nenhum'}</div>
                </div>
              </div>

              ${(pol.historico_disputas && pol.historico_disputas.length > 0) ? `
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                  ${pol.historico_disputas.map(d => `
                    <div style="padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center;">
                      <span><strong>${d.ano}</strong> — ${d.cargo} (${d.partido || '—'}${d.numero ? ` Nº ${d.numero}` : ''})</span>
                      <span class="badge ${d.eleito ? 'badge-green' : 'badge-amber'}">${d.resultado || (d.eleito ? 'Eleito' : 'Não Eleito')}${d.votos ? ` • ${d.votos.toLocaleString('pt-BR')} votos` : ''}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${serv.totalContracheques ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
            <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Total de Contracheques</div>
              <div style="font-size: 15px; font-weight: 700; color: #60a5fa; margin-top: 2px;">${serv.totalContracheques} folhas</div>
            </div>
            <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Salários Brutos Acumulados</div>
              <div style="font-size: 15px; font-weight: 700; color: #34d399; margin-top: 2px;">${formatBRL(serv.totalSalarios)}</div>
            </div>
            <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
              <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Diárias Concedidas</div>
              <div style="font-size: 15px; font-weight: 700; color: #fbbf24; margin-top: 2px;">${serv.totalDiarias || 0} (${formatBRL(serv.totalDiariasValor || 0)})</div>
            </div>
          </div>

          <!-- ⏱️ Períodos Reais e Intervalos no Meio -->
          <div style="background: #0b1120; border: 1px solid #1e293b; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span>⏱️</span>
                <strong style="color: #fff; font-size: 12px; text-transform: uppercase;">Período Funcional & Auditoria de Vínculo</strong>
              </div>
              <span class="badge badge-green" style="font-size: 11px;">Tempo Efetivo: ${serv.tempoEfetivo || '—'} (${serv.totalMesesEfetivos || 0} meses ativos)</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 10px;">
              <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Data Inicial</div>
                <div style="font-size: 13px; font-weight: 700; color: #60a5fa;">${serv.dataInicio || '—'}</div>
              </div>
              <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Data Final</div>
                <div style="font-size: 13px; font-weight: 700; color: #60a5fa;">${serv.dataFim || '—'}</div>
              </div>
              <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Tempo Bruto</div>
                <div style="font-size: 13px; font-weight: 700; color: #cbd5e1;">${serv.tempoBruto || '—'}</div>
              </div>
              <div style="background: #1e293b; padding: 6px 10px; border-radius: 4px;">
                <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Tempo Efetivo</div>
                <div style="font-size: 13px; font-weight: 700; color: #34d399;">${serv.tempoEfetivo || '—'}</div>
              </div>
            </div>

            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 4px; padding: 8px 10px; margin-bottom: 8px; font-size: 11px; line-height: 1.4;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <span style="color: #93c5fd; font-weight: 700;">⚖️ Férias e 13º Salário (Art. 102 da Lei 8.112/90)</span>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${serv.totalMesesFeriasRecesso ? `<span class="badge badge-green" style="font-size: 10px;">🏖️ ${serv.totalMesesFeriasRecesso}m Férias/Recesso computados</span>` : ''}
                  ${serv.total13Salarios ? `<span class="badge badge-blue" style="font-size: 10px;">🎁 ${serv.total13Salarios} 13º salários</span>` : ''}
                </div>
              </div>
              <div style="color: #cbd5e1; font-size: 10px; margin-top: 2px;">
                Férias anuais regulamentares, recessos de Janeiro e 13º salário são considerados <strong>efetivo exercício</strong> e não configuram quebra de vínculo.
              </div>
            </div>

            ${serv.temIntervalos ? `
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 4px; padding: 8px 10px; font-size: 11px; color: #fbbf24; margin-bottom: 8px;">
                ⚠️ <strong>Afastamento Real Detectado:</strong> ${serv.totalIntervalos} intervalo(s) de ruptura de vínculo entre ${serv.dataInicio} e ${serv.dataFim} (totalizando ${serv.totalMesesIntervalos} meses). Férias legais e 13º salário foram preservados e computados no tempo efetivo.
              </div>
            ` : `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 4px; padding: 6px 10px; font-size: 11px; color: #34d399; margin-bottom: 8px;">
                ✔ Vínculo Contínuo: Sem interrupções de vínculo no período (${serv.tempoEfetivo}). Férias e 13º preservados integralmente.
              </div>
            `}

            <div style="display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto;">
              ${(serv.periodosTimeline || []).map(item => `
                <div style="padding: 6px 10px; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; ${item.tipo === 'periodo_ativo' ? 'background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); color: #fff;' : 'background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24;'}">
                  <span>${item.tipo === 'periodo_ativo' ? '✔ ' : '⏸️ '}${item.descricao}</span>
                  <span style="font-size: 10px; opacity: 0.8;">${item.tipo === 'periodo_ativo' ? (item.cargos || 'Servidor') : 'Sem Vínculo'}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div style="background: #1e293b; padding: 16px; border-radius: 8px; font-size: 12px; font-family: 'JetBrains Mono', monospace; word-break: break-all; margin-bottom: 16px; border: 1px solid rgba(52, 211, 153, 0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <div style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; font-family: sans-serif;">
                🛡️ IDENTIFICADOR ÚNICO DE CUSTÓDIA (HASH SHA-256)
              </div>
              <button class="btn btn-outline" style="padding: 4px 10px; font-size: 11px; cursor: pointer; color: #34d399; border-color: rgba(52, 211, 153, 0.4);" onclick="navigator.clipboard.writeText('${sha256Exibicao}').then(() => alert('Hash SHA-256 copiado com sucesso!'))">
                📋 Copiar Hash
              </button>
            </div>
            <div style="color: #34d399; font-weight: 700; font-size: 13px; line-height: 1.5; background: #0f172a; padding: 10px 12px; border-radius: 6px; border: 1px solid #334155;">
              ${sha256Exibicao}
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #94a3b8; font-family: sans-serif; line-height: 1.4;">
              ℹ️ <strong>Auditoria Pericial:</strong> Este Hash SHA-256 acumula e certifica a URL pública oficial do SIAP, a competência e a integralidade de todos os dados do registro, dispensando a exposição de estruturas ou caminhos internos de armazenamento.
            </div>
          </div>

          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div><strong style="color: #cbd5e1;">Protocolo de Autenticidade:</strong> <span style="color: #60a5fa;">Certificação Digital Ativa (64 dígitos hexadecimais)</span></div>
            ${doc.ano ? `<span class="badge badge-blue">Competência Auditada: ${String(doc.mes).padStart(2,'0')}/${doc.ano}</span>` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      resultado.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: #f87171;">Falha ao executar auditoria: ${err.message}</div>`;
    }
  }

  btn.addEventListener('click', rastrear);
  input.addEventListener('keyup', e => { if (e.key === 'Enter') rastrear(); });

  // Suporte a parâmetro na URL: #auditoria?termo=... ou #auditoria?hash=...
  const urlParts = window.location.hash.split('?');
  if (urlParts.length > 1) {
    const params = new URLSearchParams(urlParts[1]);
    const termoInicial = params.get('termo') || params.get('hash');
    if (termoInicial) {
      input.value = termoInicial;
      setTimeout(rastrear, 100);
    }
  }
}
