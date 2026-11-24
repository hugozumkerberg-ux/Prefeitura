/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 MAPA DO SITE
 * Arquitetura de Informação e Navegação Unificada pelos 4 Eixos
 * ==============================================================================
 */

export function renderMapaView(container) {
  const EIXOS = [
    {
      titulo: '1. Painel do Cidadão & Pessoal',
      icone: '🏠',
      cor: '#3b82f6',
      descricao: 'Serviços essenciais de consulta pública rápida e informações de pessoal.',
      links: [
        { nome: 'Página Inicial (Painel do Cidadão)', hash: '#inicio', desc: 'Buscador sem acento, 4 cards de acesso rápido e destaques.' },
        { nome: 'Mandatos Executivos por Eleição', hash: '#mandatos', desc: 'Histórico de Prefeitos, Vices, bens declarados e folha por pleito.' },
        { nome: 'Servidores & Folha Salarial (133k)', hash: '#funcionarios', desc: 'Holerites desde 2013, busca por cargo, servidor e dossiê.' },
        { nome: 'Empresas, Fornecedores & Credores', hash: '#empresas', desc: '542 credores, 5.064 empenhos e contratos do sistema SIAP.' }
      ]
    },
    {
      titulo: '2. Execução Financeira & Orçamentária',
      icone: '💰',
      cor: '#10b981',
      descricao: 'Gastos públicos, empenhos, liquidações e rankings de pagamentos.',
      links: [
        { nome: 'Despesas & Empenhos SIAP', hash: '#despesas', desc: 'Detalhamento contábil de compras, serviços e obras públicas.' },
        { nome: 'Diárias & Viagens Oficiais', hash: '#diarias', desc: '41k+ registros de diárias concedidas a servidores municipais.' },
        { nome: 'Rankings Oficiais de Pagamentos', hash: '#rankings', desc: 'Maiores salários, maiores recebedores de diárias e credores de topo.' }
      ]
    },
    {
      titulo: '3. Institucional & Poderes Públicos',
      icone: '🏛️',
      cor: '#f59e0b',
      descricao: 'Estrutura administrativa municipal, legislativo e eleições.',
      links: [
        { nome: 'Estrutura Administrativa & Secretarias', hash: '#administrativo', desc: 'As 9 secretarias municipais, titulares e competências.' },
        { nome: 'Vereadores & Atuação Legislativa (SAPL)', hash: '#vereadores', desc: '11 parlamentares, projetos de lei, indicações e PDFs.' },
        { nome: 'Eleições Municipais TSE (Arinos 40894)', hash: '#eleicoes', desc: 'Resultados oficiais, patrimônio de bens declarados e tetos de gastos.' },
        { nome: 'Cidade, Indicadores & Sagarana', hash: '#cidade', desc: 'Dados IBGE, bioma Cerrado, Rio Urucuia e patrimônio literário.' }
      ]
    },
    {
      titulo: '4. Auditoria Forense & Administração',
      icone: '⚡',
      cor: '#8b5cf6',
      descricao: 'Controle de custódia de dados, telemetria e gerenciamento da migração.',
      links: [
        { nome: 'Auditoria Forense SHA-256', hash: '#auditoria', desc: 'Cadeia de custódia e rastreamento de integridade criptográfica.' },
        { nome: 'Painel Kanban de Migração V3', hash: '#kanban', desc: 'Acompanhamento do status de entrega e double-checks executados.' },
        { nome: 'Painel do Administrador (Hugo)', hash: '#admin', desc: 'Métricas de telemetria, latência de queries SQLite e logs de acesso.' }
      ]
    }
  ];

  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #10b981;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-green">ARQUITETURA DE INFORMAÇÃO</span>
            <span class="badge badge-blue">Navegação Unificada</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">🗺️ Mapa do Site & Estrutura de Transparência</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Visão arquitetural completa de todos os módulos, páginas e serviços disponibilizados no Portal da Transparência de Arinos / MG (Versão 3.0).
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Grid dos 4 Eixos -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-bottom: 30px;">
      ${EIXOS.map(eixo => `
        <div class="card" style="background: #0f172a; padding: 22px; border-top: 4px solid ${eixo.cor};">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 24px;">${eixo.icone}</span>
            <h2 style="font-size: 16px; font-weight: 800; color: #fff; margin: 0;">${eixo.titulo}</h2>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.4;">
            ${eixo.descricao}
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${eixo.links.map(l => `
              <a href="${l.hash}" style="background: rgba(30, 41, 59, 0.6); padding: 12px 14px; border-radius: 6px; text-decoration: none; border: 1px solid rgba(255,255,255,0.05); transition: all 0.15s ease; display: block;"
                 onmouseover="this.style.borderColor='${eixo.cor}'; this.style.transform='translateX(3px)';"
                 onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'; this.style.transform='translateX(0)';">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <strong style="color: #fff; font-size: 13px;">${l.nome}</strong>
                  <span style="color: ${eixo.cor}; font-size: 11px; font-weight: 700;">Acessar ➔</span>
                </div>
                <div style="font-size: 11px; color: var(--text-muted);">${l.desc}</div>
              </a>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
