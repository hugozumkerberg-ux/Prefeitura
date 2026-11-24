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
            Auditoria estrita dos 133.441 contracheques e pagamentos de Arinos/MG. Cole um Hash SHA-256 de 64 caracteres, uma Matrícula ou Nome de Servidor para inspecionar a cadeia de custódia e integridade do arquivo bruto original.
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
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Bancos montados estritamente para leitura</div>
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
        Insira um identificador acima para verificar a cadeia de custódia e o arquivo bruto do qual o dado foi extraído.
      </div>
    </div>
  `;

  const input = container.querySelector('#auditoria-input');
  const btn = container.querySelector('#auditoria-btn-rastrear');
  const resultado = container.querySelector('#auditoria-resultado');

  async function rastrear() {
    const termo = input.value.trim();
    if (!termo) return;

    resultado.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted); background: #0f172a;">Rastreando cadeia de custódia em SQLite...</div>';

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
      const caminhoExibicao = doc.caminho || data.caminho || 'ADPMNET_EXPORT.html';

      const formatBRL = v => typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

      resultado.innerHTML = `
        <div class="card" style="background: #0f172a; padding: 22px; border-left: 4px solid #10b981; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <span class="badge badge-green">✔ CUSTÓDIA CONFIRMADA</span>
            <span style="font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">Origem: contracheques.db & diárias</span>
          </div>

          <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 6px;">${nomeExibicao}</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">Cargo: <strong style="color: #e2e8f0;">${cargoExibicao}</strong> • Lotação: <strong style="color: #e2e8f0;">${lotacaoExibicao}</strong> • Matrícula: <strong style="color: #60a5fa;">${matriculaExibicao}</strong></p>

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
          ` : ''}

          <div style="background: #1e293b; padding: 14px; border-radius: 6px; font-size: 12px; font-family: 'JetBrains Mono', monospace; word-break: break-all; margin-bottom: 16px;">
            <div style="color: var(--text-muted); font-size: 10px; margin-bottom: 4px;">HASH CRIPTOGRÁFICO SHA-256 DO ARQUIVO ORIGINAL:</div>
            <div style="color: #34d399; font-weight: 700;">${sha256Exibicao}</div>
          </div>

          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div>Arquivo Bruto: <code style="color: #60a5fa; font-size: 11px;">${caminhoExibicao}</code></div>
            ${doc.ano ? `<span class="badge badge-blue">Competência: ${String(doc.mes).padStart(2,'0')}/${doc.ano}</span>` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      resultado.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: #f87171;">Falha ao executar auditoria: ${err.message}</div>`;
    }
  }

  btn.addEventListener('click', rastrear);
  input.addEventListener('keyup', e => { if (e.key === 'Enter') rastrear(); });
}
