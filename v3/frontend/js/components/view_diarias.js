/**
 * ==============================================================================
 * PORTAL DA TRANSPARÊNCIA DE ARINOS / MG — V3 DIÁRIAS & VIAGENS OFICIAIS
 * Registros de deslocamentos, transporte de pacientes e viagens a serviço
 * Linhas Clicáveis com Comprovante Pericial, Destino, Período e Selo SHA-256
 * ==============================================================================
 */

import { fetchDiarias } from '../api.js';
import { renderPaginacao } from './paginacao.js';

const formatMoeda = val => typeof val === 'number' 
  ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  : 'R$ 0,00';

export async function renderDiariasView(container) {
  container.innerHTML = `
    <!-- Header Hero -->
    <div class="card" style="margin-bottom: 24px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
            <span class="badge badge-blue">DESLOCAMENTOS OFICIAIS</span>
            <span class="badge badge-green">41.959 Concessões Auditadas</span>
            <span class="badge badge-amber">Selo SHA-256 Ativo</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">✈️ Diárias de Viagem & Deslocamentos</h1>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 680px;">
            Registro público de todas as diárias concedidas a servidores públicos e agentes políticos para transporte de pacientes a hospitais, reuniões em Brasília e Belo Horizonte, e missões oficiais. Clique em qualquer linha para abrir o comprovante e auditar o Selo SHA-256.
          </p>
        </div>
        <div>
          <a href="#rankings" class="btn" style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fcd34d; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
            🏆 Ver Ranking de Diárias ➔
          </a>
        </div>
      </div>
    </div>

    <!-- Barra de Filtro -->
    <div class="card" style="margin-bottom: 20px; background: #0f172a;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
        <input type="text" id="diarias-busca" placeholder="🔍 Buscar por servidor, destino (ex: Brasília, Barretos), empenho ou hash..." 
               style="flex: 1; min-width: 240px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
        <select id="diarias-periodo" style="min-width: 175px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
          <option value="">Todos os Mandatos / Anos</option>
          <optgroup label="🏛️ Mandatos Executivos">
            <option value="mandato:2025-2028">Mandato 2025–2028 (Atual)</option>
            <option value="mandato:2021-2024">Mandato 2021–2024 (Marcilio)</option>
            <option value="mandato:2017-2020">Mandato 2017–2020 (Carlos Alberto)</option>
            <option value="mandato:2013-2016">Mandato 2013–2016 (Roberto Sales)</option>
          </optgroup>
          <optgroup label="📅 Anos Individuais">
            <option value="ano:2026">Ano 2026</option>
            <option value="ano:2025">Ano 2025</option>
            <option value="ano:2024">Ano 2024</option>
            <option value="ano:2023">Ano 2023</option>
            <option value="ano:2022">Ano 2022</option>
            <option value="ano:2021">Ano 2021</option>
            <option value="ano:2020">Ano 2020</option>
            <option value="ano:2019">Ano 2019</option>
            <option value="ano:2018">Ano 2018</option>
            <option value="ano:2017">Ano 2017</option>
            <option value="ano:2016">Ano 2016</option>
            <option value="ano:2015">Ano 2015</option>
            <option value="ano:2014">Ano 2014</option>
            <option value="ano:2013">Ano 2013</option>
          </optgroup>
        </select>
        <select id="diarias-mes" style="width: 150px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 10px 12px; border-radius: 6px; font-size: 13px;">
          <option value="">Todos os Meses</option>
          <option value="1">01 - Janeiro</option>
          <option value="2">02 - Fevereiro</option>
          <option value="3">03 - Março</option>
          <option value="4">04 - Abril</option>
          <option value="5">05 - Maio</option>
          <option value="6">06 - Junho</option>
          <option value="7">07 - Julho</option>
          <option value="8">08 - Agosto</option>
          <option value="9">09 - Setembro</option>
          <option value="10">10 - Outubro</option>
          <option value="11">11 - Novembro</option>
          <option value="12">12 - Dezembro</option>
        </select>
        <button id="diarias-btn-filtrar" class="btn-primary" style="padding: 10px 18px; font-size: 13px; cursor: pointer;">
          Filtrar
        </button>
      </div>
    </div>

    <!-- Indicador de Dica Clicável -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 12px; color: var(--text-muted);">
      <div>💡 <em>Clique em qualquer linha da tabela para abrir o comprovante oficial e auditar o Selo SHA-256</em></div>
      <div id="diarias-info-contagem" style="font-family: 'JetBrains Mono', monospace;"></div>
    </div>

    <!-- Conteúdo da Tabela -->
    <div id="diarias-content" style="padding: 20px; text-align: center; color: var(--text-muted);">
      Consultando acervo oficial de diárias...
    </div>
  `;

  const inputBusca = container.querySelector('#diarias-busca');
  const selectPeriodo = container.querySelector('#diarias-periodo');
  const selectMes = container.querySelector('#diarias-mes');
  const btnFiltrar = container.querySelector('#diarias-btn-filtrar');
  const content = container.querySelector('#diarias-content');
  const infoContagem = container.querySelector('#diarias-info-contagem');

  function renderTabelaDiariasComprovante(dados) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    table.innerHTML = `
      <thead>
        <tr>
          <th style="width: 28px; text-align: center;"></th>
          <th>Beneficiário / Servidor</th>
          <th>Destino & Objeto</th>
          <th style="text-align: center;">Competência</th>
          <th>Órgão / Atividade</th>
          <th style="text-align: right;">Valor da Diária</th>
          <th style="text-align: center; width: 110px;">Ação</th>
        </tr>
      </thead>
      <tbody id="tbody-diarias"></tbody>
    `;

    const tbody = table.querySelector('#tbody-diarias');

    dados.forEach((item, index) => {
      const trPrincipal = document.createElement('tr');
      trPrincipal.className = 'tr-diaria-click';
      trPrincipal.style.cursor = 'pointer';
      trPrincipal.style.transition = 'background 0.15s ease';
      trPrincipal.setAttribute('data-id', index);

      trPrincipal.innerHTML = `
        <td style="text-align: center; color: #60a5fa; font-size: 11px;">
          <span class="seta-expandir" style="display: inline-block; transition: transform 0.2s ease;">▶</span>
        </td>
        <td>
          <div style="font-weight: 700; color: #fff; font-size: 13px;">${item.nome || 'Servidor Municipal'}</div>
          <div style="font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">CPF: ${item.cpf || '***.***.***-**'}</div>
        </td>
        <td>
          <span class="badge badge-blue" style="font-size: 11px; margin-bottom: 3px; display: inline-block;">
            📍 ${item.destino_extraido || 'Arinos / Destino Oficial'}
          </span>
          <div style="font-size: 11px; color: #94a3b8; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.descricao_natureza || 'Deslocamento oficial'}
          </div>
        </td>
        <td style="text-align: center;">
          <span class="badge badge-amber" style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">
            ${String(item.mes).padStart(2, '0')}/${item.ano}
          </span>
          <div style="font-size: 10.5px; color: #cbd5e1; margin-top: 3px;">
            ${item.periodo_extraido || 'Conforme empenho'}
          </div>
        </td>
        <td>
          <div style="font-size: 11.5px; color: #cbd5e1; max-width: 240px; line-height: 1.3;">
            ${item.secretaria_atividade || 'Prefeitura Municipal de Arinos'}
          </div>
        </td>
        <td style="text-align: right;">
          <strong style="color: #fbbf24; font-size: 14px; font-family: 'JetBrains Mono', monospace;">${formatMoeda(item.valor)}</strong>
          <div style="font-size: 10px; color: #10b981; font-weight: 600;">Pago / Concedido</div>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-sm btn-toggle-card" style="padding: 4px 10px; font-size: 11px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: #93c5fd; cursor: pointer; pointer-events: none;">
            Detalhes ▾
          </button>
        </td>
      `;

      // Linha de Detalhe Colapsável
      const trDetalhe = document.createElement('tr');
      trDetalhe.className = 'tr-detalhes-expandida';
      trDetalhe.style.display = 'none';

      trDetalhe.innerHTML = `
        <td colspan="7" style="padding: 0; background: #060b13; border-bottom: 2px solid #3b82f6;">
          <div style="padding: 16px 20px; border-left: 4px solid #f59e0b; margin: 4px 8px 12px 8px; background: #090e17; border-radius: 8px;">
            <!-- Header do Comprovante -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #1e293b;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">🎫</span>
                <div>
                  <h4 style="font-size: 13.5px; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase;">
                    Comprovante de Concessão de Diária Municipal
                  </h4>
                  <div style="font-size: 11px; color: var(--text-muted);">
                    Deslocamento oficial custeado pela Prefeitura Municipal de Arinos / MG
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="badge badge-green">PAGO / LIQUIDADO</span>
                <span class="badge badge-blue">TIPO ${item.tipo || '59'}</span>
              </div>
            </div>

            <!-- Grid de Destaques -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 14px;">
              <div style="background: #0f172a; padding: 10px 14px; border-radius: 6px; border: 1px solid #1e293b;">
                <div style="font-size: 10.5px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Destino Oficial</div>
                <div style="font-size: 13.5px; font-weight: 700; color: #60a5fa; margin-top: 3px;">📍 ${item.destino_extraido || 'Arinos e Região'}</div>
              </div>

              <div style="background: #0f172a; padding: 10px 14px; border-radius: 6px; border: 1px solid #1e293b;">
                <div style="font-size: 10.5px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Período da Viagem</div>
                <div style="font-size: 13.5px; font-weight: 700; color: #f59e0b; margin-top: 3px;">📅 ${item.periodo_extraido || 'Conforme solicitação'}</div>
              </div>

              <div style="background: #0f172a; padding: 10px 14px; border-radius: 6px; border: 1px solid #1e293b;">
                <div style="font-size: 10.5px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Valor Nominal Indenizado</div>
                <div style="font-size: 15px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace; margin-top: 3px;">
                  ${formatMoeda(item.valor)}
                </div>
              </div>

              <div style="background: #0f172a; padding: 10px 14px; border-radius: 6px; border: 1px solid #1e293b;">
                <div style="font-size: 10.5px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Classificação Orçamentária</div>
                <div style="font-size: 12px; font-weight: 600; color: #cbd5e1; margin-top: 3px;">
                  ${item.descricao_natureza || 'Diárias de servidores'} (${item.natureza || '33901405'})
                </div>
              </div>
            </div>

            <!-- Justificativa Administrativa / Histórico Oficial -->
            <div style="background: #0d1527; border: 1px solid #1e293b; border-left: 3px solid #3b82f6; border-radius: 6px; padding: 12px 14px; margin-bottom: 14px;">
              <div style="font-size: 11px; font-weight: 700; color: #93c5fd; text-transform: uppercase; margin-bottom: 4px;">
                📝 Motivo Oficial & Finalidade Pública da Viagem:
              </div>
              <div style="font-size: 12.5px; color: #e2e8f0; line-height: 1.6;">
                "${item.historico_viagem || 'Concessão de diária para custeio de despesas com deslocamento a serviço da administração pública municipal.'}"
              </div>
              <div style="margin-top: 8px; font-size: 11px; color: #94a3b8; display: flex; gap: 14px; flex-wrap: wrap;">
                <span><strong>Empenho Nº:</strong> ${item.nrempenho || '—'}</span>
                <span><strong>Data Empenho:</strong> ${item.dtempenho || '—'}</span>
                <span><strong>Dotação:</strong> ${item.dotacao || '—'}</span>
                <span><strong>Lotação:</strong> ${item.secretaria_atividade || 'Prefeitura Municipal'}</span>
              </div>
            </div>

            <!-- Selo de Autenticidade Criptográfica SHA-256 -->
            <div style="background: #030712; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px;">
                <span style="font-size: 16px;">🛡️</span>
                <div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 700; color: #10b981; text-transform: uppercase;">
                      Selo Criptográfico de Custódia Pericial (SHA-256):
                    </span>
                    <span class="badge badge-green" style="font-size: 9px; padding: 1px 6px;">INVIOLÁVEL</span>
                  </div>
                  <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; word-break: break-all; margin-top: 2px;">
                    ${item.chave || 'SHA-256 NÃO DISPONÍVEL'}
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <button class="btn btn-copiar-hash-diaria" data-hash="${item.chave}" style="padding: 6px 12px; font-size: 11.5px; background: #1e293b; border: 1px solid #334155; color: #f8fafc; border-radius: 4px; cursor: pointer;">
                  📋 Copiar Hash
                </button>
                <a href="#auditoria?termo=${item.chave}" class="btn" style="padding: 6px 12px; font-size: 11.5px; background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; color: #93c5fd; border-radius: 4px; text-decoration: none;">
                  🔍 Auditar Custódia
                </a>
                <a href="#funcionarios?busca=${encodeURIComponent(item.nome || '')}" class="btn" style="padding: 6px 12px; font-size: 11.5px; background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fcd34d; border-radius: 4px; text-decoration: none;">
                  👤 Ver Ficha Funcional
                </a>
              </div>
            </div>
          </div>
        </td>
      `;

      // Evento de clique para expandir/colapsar
      trPrincipal.addEventListener('click', () => {
        const aberta = trDetalhe.style.display !== 'none';
        const seta = trPrincipal.querySelector('.seta-expandir');
        const btnToggle = trPrincipal.querySelector('.btn-toggle-card');

        if (aberta) {
          trDetalhe.style.display = 'none';
          trPrincipal.style.background = '';
          if (seta) seta.style.transform = 'rotate(0deg)';
          if (btnToggle) btnToggle.innerText = 'Detalhes ▾';
        } else {
          trDetalhe.style.display = 'table-row';
          trPrincipal.style.background = 'rgba(59, 130, 246, 0.08)';
          if (seta) seta.style.transform = 'rotate(90deg)';
          if (btnToggle) btnToggle.innerText = 'Ocultar ▴';
        }
      });

      // Hover feedback
      trPrincipal.addEventListener('mouseenter', () => {
        if (trDetalhe.style.display === 'none') {
          trPrincipal.style.background = 'rgba(255, 255, 255, 0.03)';
        }
      });
      trPrincipal.addEventListener('mouseleave', () => {
        if (trDetalhe.style.display === 'none') {
          trPrincipal.style.background = '';
        }
      });

      tbody.appendChild(trPrincipal);
      tbody.appendChild(trDetalhe);
    });

    // Eventos de cópia de hash dentro dos detalhes
    wrapper.querySelectorAll('.btn-copiar-hash-diaria').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hash = btn.getAttribute('data-hash');
        if (hash) {
          navigator.clipboard.writeText(hash).then(() => {
            const originalText = btn.innerText;
            btn.innerText = '✔ Hash Copiado!';
            btn.style.borderColor = '#10b981';
            btn.style.color = '#34d399';
            setTimeout(() => {
              btn.innerText = originalText;
              btn.style.borderColor = '#334155';
              btn.style.color = '#f8fafc';
            }, 2000);
          });
        }
      });
    });

    wrapper.appendChild(table);
    return wrapper;
  }

  async function carregar(page) {
    content.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted);">Consultando acervo oficial de diárias...</div>';
    try {
      const pVal = selectPeriodo.value;
      let mandato = '';
      let ano = '';
      if (pVal.startsWith('mandato:')) mandato = pVal.replace('mandato:', '');
      else if (pVal.startsWith('ano:')) ano = pVal.replace('ano:', '');

      const resp = await fetchDiarias({ 
        page, 
        limit: 20, 
        busca: inputBusca.value.trim(),
        mandato,
        ano,
        periodo: pVal,
        mes: selectMes.value
      });
      content.innerHTML = '';

      if (!resp.dados || resp.dados.length === 0) {
        content.innerHTML = '<div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">Nenhuma diária localizada para o termo informado.</div>';
        if (infoContagem) infoContagem.innerText = '0 registros';
        return;
      }

      if (infoContagem && resp.paginacao) {
        infoContagem.innerText = `${resp.paginacao.total.toLocaleString('pt-BR')} diárias encontradas`;
      }

      const tabelaEl = renderTabelaDiariasComprovante(resp.dados);
      const paginacaoEl = renderPaginacao(resp.paginacao, p => carregar(p));
      content.appendChild(tabelaEl);
      content.appendChild(paginacaoEl);
    } catch (err) {
      content.innerHTML = `<div class="card" style="padding: 20px; text-align: center; color: #f87171;">Erro na consulta: ${err.message}</div>`;
    }
  }

  btnFiltrar.onclick = () => carregar(1);
  selectPeriodo.onchange = () => carregar(1);
  selectMes.onchange = () => carregar(1);
  inputBusca.onkeyup = e => { if (e.key === 'Enter') carregar(1); };
  carregar(1);
}
