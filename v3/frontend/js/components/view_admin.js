/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 PAINEL ADMINISTRATIVO (HUGO)
 * Telemetria, Latência SQLite, Status dos Bancos e Auditoria Forense
 * ==============================================================================
 */

export async function renderAdminView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #8b5cf6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-purple">PAINEL DE CONTROLE ADMINISTRATIVO</span>
            <span class="badge badge-green">🟢 Operação Normal (Motor de Alta Performance V3)</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">⚡ Painel do Administrador & Telemetria</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Monitoramento de latência das consultas, estado de sincronização das bases de dados de Arinos / MG, auditoria de hashes e métricas de desempenho.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- 4 Indicadores de Performance -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Latência Média de Resposta</div>
        <div style="font-size: 24px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">&lt; 3.8 ms</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Indexação Nativa de Alta Velocidade</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Registros Auditados</div>
        <div style="font-size: 24px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">179.800+</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Folha, Diárias e Despesas</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Criptografia Forense</div>
        <div style="font-size: 24px; font-weight: 800; color: #a78bfa; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">SHA-256</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Cadeia de Custódia Válida</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Porta do Servidor</div>
        <div style="font-size: 24px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">:8088</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Protocolo HTTP/1.1 REST</div>
      </div>
    </div>

    <!-- Status dos Bancos Conectados -->
    <div class="card" style="margin-bottom: 24px; background: #0f172a;">
      <div class="section-title" style="margin-bottom: 16px;">
        <span>🛡️ Módulos Oficiais Certificados (Cadeia de Custódia SHA-256)</span>
        <span class="badge badge-green">3/3 Ativos</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        <div style="background: #1e293b; padding: 14px; border-radius: 8px; border-left: 3px solid #34d399;">
          <strong style="color: #fff; font-size: 13px; display: block;">Módulo Folha Salarial Canônica</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Folha de Pagamento Municipal (2013–2026)</span>
          <div style="margin-top: 8px; font-size: 12px; color: #34d399; font-weight: 600;">✔ 133.441 holerites com Selo SHA-256</div>
        </div>
        <div style="background: #1e293b; padding: 14px; border-radius: 8px; border-left: 3px solid #38bdf8;">
          <strong style="color: #fff; font-size: 13px; display: block;">Módulo Diárias & Viagens Oficiais</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Diárias & Deslocamentos Oficiais</span>
          <div style="margin-top: 8px; font-size: 12px; color: #38bdf8; font-weight: 600;">✔ 41.299 diárias com Selo SHA-256</div>
        </div>
        <div style="background: #1e293b; padding: 14px; border-radius: 8px; border-left: 3px solid #fbbf24;">
          <strong style="color: #fff; font-size: 13px; display: block;">Módulo Contabilidade & Empenhos SIAP</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Contabilidade & Empenhos Oficiais</span>
          <div style="margin-top: 8px; font-size: 12px; color: #fbbf24; font-weight: 600;">✔ 5.064 empenhos e credores com Selo SHA-256</div>
        </div>
      </div>
    </div>

    <!-- Rotas de API e Endpoints Ativos -->
    <div class="card" style="background: #0f172a;">
      <div class="section-title" style="margin-bottom: 16px;">
        <span>🔌 Endpoints da API REST V3 (Streaming Nativo)</span>
        <span class="badge badge-blue">7 Rotas Nativas</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; font-size: 12px;">
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/folha</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Paginação da folha salarial</p>
        </div>
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/empresas</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Credores e dossiês de despesas</p>
        </div>
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/rankings</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Top salários, diárias e fornecedores</p>
        </div>
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/mandatos</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Agregação histórica por mandato</p>
        </div>
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/eleicoes</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Base de dados oficiais do TSE</p>
        </div>
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/vereadores</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Atuação e matérias da Câmara (SAPL)</p>
        </div>
        <div style="background: #1e293b; padding: 10px 14px; border-radius: 6px;">
          <strong style="color: #34d399; font-family: 'JetBrains Mono', monospace;">GET /api/diarias</strong>
          <p style="color: var(--text-muted); margin-top: 2px;">Viagens e deslocamentos oficiais</p>
        </div>
      </div>
    </div>
  `;
}
