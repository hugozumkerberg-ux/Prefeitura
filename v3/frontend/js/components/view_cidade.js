/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 CIDADE & INDICADORES (IBGE)
 * Memória, Geografia, Indicadores Socioeconômicos e Sagarana
 * ==============================================================================
 */

export function renderCidadesView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #f59e0b;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-amber">TERRITÓRIO & CULTURA</span>
            <span class="badge badge-blue">Código IBGE: 3104502</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">📍 Arinos / MG — Indicadores, História & Sagarana</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Conheça os dados geográficos, econômicos e históricos de Arinos, o coração do Vale do Urucuia imortalizado na literatura de João Guimarães Rosa.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- 4 Indicadores IBGE -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">População Estimada</div>
        <div style="font-size: 24px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">17.580 hab.</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Censo IBGE Oficial</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Área Territorial</div>
        <div style="font-size: 24px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">5.322 km²</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">8º Maior Município de MG</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Bioma Predominante</div>
        <div style="font-size: 24px; font-weight: 800; color: #fbbf24; margin-top: 4px;">Cerrado</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Veredas & Bacia do Urucuia</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Emancipação Política</div>
        <div style="font-size: 24px; font-weight: 800; color: #a78bfa; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">1963</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">63 Anos de História</div>
      </div>
    </div>

    <!-- Seções Temáticas -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 30px;">
      
      <!-- Card Sagarana & Guimarães Rosa -->
      <div class="card" style="background: #0f172a; padding: 22px; border-top: 4px solid #10b981;">
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 26px;">🌿</span>
          <div>
            <span class="badge badge-green" style="font-size: 10px;">LITERATURA & PATRIMÔNIO</span>
            <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin: 2px 0;">Distrito de Sagarana & Guimarães Rosa</h3>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px;">
          O distrito de Sagarana é um dos marcos culturais mais emblemáticos do Brasil. Inspirador da obra prima de Guimarães Rosa, abriga o Memorial e o Parque Estadual de Sagarana, com trilhas ecológicas, veredas preservadas e a riqueza do ecoturismo no Noroeste Mineiro.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; font-size: 11px; color: #34d399;">
          📍 Distância: 65 km da sede municipal • Acesso por estrada ecológica
        </div>
      </div>

      <!-- Card Bacia Hidrográfica do Rio Urucuia -->
      <div class="card" style="background: #0f172a; padding: 22px; border-top: 4px solid #3b82f6;">
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 26px;">🌊</span>
          <div>
            <span class="badge badge-blue" style="font-size: 10px;">RECURSOS HÍDRICOS</span>
            <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin: 2px 0;">O Majestoso Rio Urucuia</h3>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px;">
          "O Urucuia vem dos carizes do poente... Rio de águas claras, escuras e fundas". Afluente direto da margem esquerda do Rio São Francisco, o Rio Urucuia banha o município de Arinos, sustentando a pesca, a agricultura familiar e praias fluviais visitadas em períodos de veraneio.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; font-size: 11px; color: #60a5fa;">
          🚣 Bacia Federal • Monitoramento e Preservação de Matas Ciliares
        </div>
      </div>

      <!-- Card Economia & Produção Rural -->
      <div class="card" style="background: #0f172a; padding: 22px; border-top: 4px solid #f59e0b;">
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 26px;">🌾</span>
          <div>
            <span class="badge badge-amber" style="font-size: 10px;">AGRONEGÓCIO & PECUÁRIA</span>
            <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin: 2px 0;">Perfil Econômico e Rural</h3>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px;">
          A base produtiva de Arinos apoia-se na expressiva pecuária de corte e leiteira, na produção de grãos (soja, milho e feijão) nos platôs mecanizados, na fruticultura e no artesanato típico do Cerrado, impulsionando a arrecadação pública municipal.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; font-size: 11px; color: #fbbf24;">
          📈 Destaque regional no escoamento de safras e laticínios
        </div>
      </div>

    </div>
  `;
}
