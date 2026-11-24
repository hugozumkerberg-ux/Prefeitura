/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 GESTÃO ADMINISTRATIVA
 * Secretarias Municipais, Órgãos Públicos e Estrutura do Executivo
 * ==============================================================================
 */

export const SECRETARIAS = [
  {
    nome: 'Secretaria Municipal de Saúde',
    icone: '🏥',
    titular: 'Gestão da Saúde Pública',
    competencia: 'Atenção primária, vigilância sanitária, gestão do Hospital Municipal, postos de saúde da zona rural e urbana, e Fundação Municipal de Saúde.',
    orcamento: 'R$ 14,2 Mi / ano',
    servidores: '210+ profissionais'
  },
  {
    nome: 'Secretaria Municipal de Educação',
    icone: '📚',
    titular: 'Gestão Educacional & FUNDEB',
    competencia: 'Gestão das escolas municipais de ensino fundamental e infantil, merenda escolar, transporte de alunos das comunidades rurais e formação continuada.',
    orcamento: 'R$ 18,5 Mi / ano',
    servidores: '350+ servidores'
  },
  {
    nome: 'Secretaria de Obras, Transportes & Serviços Públicos',
    icone: '🚜',
    titular: 'Infraestrutura Urbana e Rural',
    competencia: 'Manutenção e pavimentação de vias, patrolamento de estradas vicinais rurais, iluminação pública, pontes e limpeza urbana.',
    orcamento: 'R$ 8,9 Mi / ano',
    servidores: '95+ operacionais'
  },
  {
    nome: 'Secretaria Municipal de Finanças & Orçamento',
    icone: '💵',
    titular: 'Tesouraria & Contabilidade',
    competencia: 'Execução orçamentária, arrecadação tributária (IPTU, ISS, ITBI), pagamento da folha, prestação de contas ao TCE-MG e controle interno.',
    orcamento: 'Gestão Global',
    servidores: '25+ auditores e técnicos'
  },
  {
    nome: 'Secretaria Municipal de Administração & RH',
    icone: '📋',
    titular: 'Recursos Humanos & Patrimônio',
    competencia: 'Gestão do quadro de servidores públicos, concursos, processos seletivos, compras públicas, almoxarifado central e licitações.',
    orcamento: 'Administração Geral',
    servidores: '40+ profissionais'
  },
  {
    nome: 'Secretaria Municipal de Assistência Social',
    icone: '🤝',
    titular: 'Desenvolvimento Social & CRAS',
    competencia: 'Proteção social básica, centros de convivência (CRAS / CREAS), programas de transferência de renda, auxílios emergenciais e apoio às famílias vulneráveis.',
    orcamento: 'R$ 3,8 Mi / ano',
    servidores: '35+ assistentes e psicólogos'
  },
  {
    nome: 'Secretaria de Agricultura, Pecuária & Meio Ambiente',
    icone: '🌱',
    titular: 'Desenvolvimento Rural & Sagarana',
    competencia: 'Assistência técnica ao pequeno produtor rural, bacias leiteiras, conservação de nascentes, licenciamento ambiental municipal e feira do produtor.',
    orcamento: 'R$ 2,4 Mi / ano',
    servidores: '20+ extensionistas'
  },
  {
    nome: 'Secretaria Municipal de Esporte, Lazer & Turismo',
    icone: '⚽',
    titular: 'Cultura, Juventude & Eventos',
    competencia: 'Campeonatos esportivos municipais, apoio aos atletas, fomento ao ecoturismo do Rio Urucuia, Parque de Sagarana e calendário de eventos.',
    orcamento: 'R$ 1,6 Mi / ano',
    servidores: '15+ instrutores'
  },
  {
    nome: 'Gabinete do Prefeito & Vice-Prefeito',
    icone: '🏛️',
    titular: 'Coordenação Política & Relações Institucionais',
    competencia: 'Articulação governamental, sanção e promulgação de leis, relacionamento com a Câmara Municipal, órgãos federais, estaduais e atendimento direto ao cidadão.',
    orcamento: 'Gabinete Executivo',
    servidores: '18+ assessores'
  }
];

export function renderAdministrativoView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="badge badge-blue">PODER EXECUTIVO MUNICIPAL</span>
            <span class="badge badge-green">9 Secretarias Ativas</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">🏛️ Estrutura Administrativa & Secretarias</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Conheça o organograma da Prefeitura de Arinos / MG, as competências legais de cada pasta, corpo técnico e alocação orçamentária dos órgãos da administração direta e indireta.
          </p>
        </div>
        <div>
          <a href="#kanban" class="btn" style="background: rgba(139, 92, 246, 0.15); border: 1px solid #8b5cf6; color: #c4b5fd; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            📋 Ver Status no Kanban ➔
          </a>
        </div>
      </div>
    </div>

    <!-- 4 KPIs Administrativos -->
    <div class="stats-grid" style="margin-bottom: 24px;">
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Secretarias de Pasta</div>
        <div style="font-size: 24px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">9 Pastas</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Administração Direta</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Órgãos Vinculados</div>
        <div style="font-size: 24px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">3 Entidades</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Prefeitura, Saúde e SAAE</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Quadro de Pessoal</div>
        <div style="font-size: 24px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">1.450+</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Servidores e Colaboradores</div>
      </div>
      <div class="card" style="background: #0f172a;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Sede da Prefeitura</div>
        <div style="font-size: 16px; font-weight: 800; color: #a78bfa; margin-top: 8px;">Praça Euzébio Gonçalves</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Centro • Arinos / MG</div>
      </div>
    </div>

    <!-- Grid de Secretarias -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 30px;">
      ${SECRETARIAS.map(sec => `
        <div class="card" style="background: #0f172a; padding: 22px; border-top: 4px solid #3b82f6;">
          <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px;">
            <div style="font-size: 28px; background: rgba(59, 130, 246, 0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
              ${sec.icone}
            </div>
            <div style="flex: 1;">
              <span class="badge badge-blue" style="font-size: 10px; margin-bottom: 4px;">${sec.titular}</span>
              <h3 style="font-size: 16px; font-weight: 800; color: #fff; margin: 2px 0;">${sec.nome}</h3>
            </div>
          </div>
          
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px;">
            ${sec.competencia}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; font-size: 11px;">
            <span style="color: #34d399; font-weight: 700;">💰 ${sec.orcamento}</span>
            <span style="color: var(--text-muted);">👥 ${sec.servidores}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
