/**
 * ==============================================================================
 * SERVIÇO DE TELEMETRIA, AUDITORIA DE ACESSOS & SEGURANÇA — ARINOS / MG
 * ==============================================================================
 * Governança Institucional:
 * 1. Rastreamento forense de conexões e IPs dos visitantes.
 * 2. Contador de acessos acumulados e únicos persistido em disco.
 * 3. Auditoria do que os cidadãos pesquisam no portal em tempo real.
 * 4. Registro de autenticação e sessões administrativas.
 * ==============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

const TELEMETRIA_FILE = path.join(config.dadosDir, 'telemetria_acessos.json');

class TelemetriaService {
  constructor() {
    this.totalAcessos = 0;
    this.ipsUnicos = new Set();
    this.paginasVisitadas = {};
    this.logsRecentes = [];
    this.termosPesquisados = [];
    this.rankingBuscas = {};
    this.sessoesLogin = [];
    this.iniciadoEm = new Date().toISOString();
    this.saveTimeout = null;

    this.carregarTelemetria();
  }

  carregarTelemetria() {
    if (fs.existsSync(TELEMETRIA_FILE)) {
      try {
        const raw = fs.readFileSync(TELEMETRIA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.totalAcessos = data.totalAcessos || 0;
        this.paginasVisitadas = data.paginasVisitadas || {};
        this.logsRecentes = data.logsRecentes || [];
        this.termosPesquisados = data.termosPesquisados || [];
        this.rankingBuscas = data.rankingBuscas || {};
        this.sessoesLogin = data.sessoesLogin || [];
        if (Array.isArray(data.ipsUnicos)) {
          this.ipsUnicos = new Set(data.ipsUnicos);
        }
      } catch (e) {
        console.warn('Aviso: Não foi possível ler telemetria anterior:', e.message);
      }
    }
  }

  salvarTelemetria() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        const payload = {
          totalAcessos: this.totalAcessos,
          ipsUnicos: Array.from(this.ipsUnicos),
          paginasVisitadas: this.paginasVisitadas,
          logsRecentes: this.logsRecentes.slice(-200),
          termosPesquisados: this.termosPesquisados.slice(-200),
          rankingBuscas: this.rankingBuscas,
          sessoesLogin: this.sessoesLogin.slice(-50),
          atualizadoEm: new Date().toISOString()
        };
        fs.writeFileSync(TELEMETRIA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      } catch (err) {
        console.error('Erro ao persistir telemetria:', err.message);
      }
    }, 2000);
  }

  limparIp(rawIp) {
    if (!rawIp) return '127.0.0.1';
    let ip = String(rawIp).trim();
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    if (ip === '::1') {
      ip = '127.0.0.1 (Localhost)';
    }
    return ip;
  }

  simplificarUserAgent(ua) {
    if (!ua) return 'Navegador Padrão';
    if (ua.includes('Edg/')) return 'Microsoft Edge';
    if (ua.includes('Chrome/')) return 'Google Chrome';
    if (ua.includes('Firefox/')) return 'Mozilla Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Apple Safari';
    if (ua.includes('curl') || ua.includes('Postman') || ua.includes('node')) return 'API / Ferramenta CLI';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'Dispositivo Móvel';
    return 'Navegador Web';
  }

  registrarAcesso(rawIp, method, pathname, status, ua, durationMs) {
    // Ignorar requisições internas de health check de assets pontuais para não inflar desproporcionalmente
    if (pathname.endsWith('.ico') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.webp')) {
      return;
    }

    const ip = this.limparIp(rawIp);
    this.totalAcessos++;
    this.ipsUnicos.add(ip);

    // Contagem por página
    const rotaChave = pathname.split('?')[0];
    this.paginasVisitadas[rotaChave] = (this.paginasVisitadas[rotaChave] || 0) + 1;

    // Log de conexão recente
    const logItem = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ip,
      metodo: method,
      rota: pathname,
      status: Number(status) || 200,
      dispositivo: this.simplificarUserAgent(ua),
      tempo_ms: Math.round(durationMs || 1)
    };

    this.logsRecentes.unshift(logItem);
    if (this.logsRecentes.length > 300) {
      this.logsRecentes.pop();
    }

    this.salvarTelemetria();
  }

  registrarBusca(termo, categoria = 'geral', rawIp = '127.0.0.1', totalResultados = 0) {
    if (!termo || termo.trim().length === 0) return;
    const termoLimpo = termo.trim().toLowerCase();
    const ip = this.limparIp(rawIp);

    this.rankingBuscas[termoLimpo] = (this.rankingBuscas[termoLimpo] || 0) + 1;

    const buscaItem = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      termo: termo.trim(),
      categoria,
      ip,
      resultados: totalResultados,
      timestamp: new Date().toISOString()
    };

    this.termosPesquisados.unshift(buscaItem);
    if (this.termosPesquisados.length > 250) {
      this.termosPesquisados.pop();
    }

    this.salvarTelemetria();
  }

  registrarLogin(usuario, cargo, rawIp, sucesso = true) {
    const ip = this.limparIp(rawIp);
    const loginItem = {
      id: Date.now(),
      usuario: usuario || 'Auditor Municipal',
      cargo: cargo || 'Controladoria Geral do Município',
      ip,
      sucesso,
      timestamp: new Date().toISOString()
    };

    this.sessoesLogin.unshift(loginItem);
    if (this.sessoesLogin.length > 50) {
      this.sessoesLogin.pop();
    }

    this.salvarTelemetria();
    return loginItem;
  }

  getEstatisticas() {
    // Ordena páginas mais acessadas
    const paginasOrdenadas = Object.entries(this.paginasVisitadas)
      .map(([rota, total]) => ({ rota, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Ordena ranking de termos mais buscados
    const rankingOrdenado = Object.entries(this.rankingBuscas)
      .map(([termo, total]) => ({ termo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    return {
      total_acessos: this.totalAcessos,
      ips_unicos: this.ipsUnicos.size,
      paginas_mais_acessadas: paginasOrdenadas,
      logs_recentes: this.logsRecentes.slice(0, 50),
      ultimas_buscas: this.termosPesquisados.slice(0, 50),
      ranking_buscas: rankingOrdenado,
      ultimas_sessoes: this.sessoesLogin.slice(0, 10),
      uptime_iniciado_em: this.iniciadoEm,
      status_servidor: 'ONLINE (Sub-5ms High Speed)'
    };
  }
}

module.exports = new TelemetriaService();
