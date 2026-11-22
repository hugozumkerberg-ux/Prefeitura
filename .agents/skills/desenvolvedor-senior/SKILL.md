---
name: desenvolvedor-senior
description: >-
  Implementação full-stack de alto desempenho, engenharia reversa de sistemas públicos legados (ADPM, SIAP, SAPL),
  APIs REST em streaming (<5ms), manipulação avançada de banco SQLite e automações Windows para o Portal da Transparência de Arinos/MG.
  Ative ao codificar novas ferramentas, criar raspadores complexos, otimizar APIs ou resolver problemas de baixo nível.
---

# Skill: Desenvolvedor Sênior Full-Stack (Senior Developer) — Portal Arinos/MG

Esta skill guia o agente na implementação cirúrgica, rápida e resiliente de código em Node.js, SQLite, Vanilla JS e automações no ecossistema Windows.

## 💻 Padrões de Implementação de Alta Performance

1. **Raspagem e Engenharia Reversa Resiliente:**
   - Para sistemas municipais legados (ex: ADPM Net, SIAP, SAPL da Câmara):
     - Inspecione a estrutura exata do formulário HTTP (`Content-Type`, parâmetros `POST`, cookies de sessão).
     - Trate encoding de caracteres legados (ISO-8859-1 / Windows-1252) antes de gravar em UTF-8 no SQLite.
     - Implemente controle de taxa com backoff exponencial para evitar bloqueios por IP.

2. **APIs Ultraleves em Streaming (Zero-Overhead):**
   - Construa rotas diretamente no `http.createServer()` sem overhead de Express ou frameworks pesados quando a rota puder responder diretamente com `res.writeHead(200, ...)` e `res.end()`.
   - Utilize a classe nativa `DatabaseSync` do Node.js 24 (`const { DatabaseSync } = require('node:sqlite');`) para execução de queries C-level síncronas de altíssima velocidade (< 5ms).

3. **Operações em Lote no SQLite:**
   - Ao processar mais de 500 registros, sempre envolva a execução em transação atômica:
     ```javascript
     db.exec('BEGIN TRANSACTION');
     const stmt = db.prepare('INSERT INTO ... VALUES (...)');
     for (const item of lote) {
       stmt.run(item.a, item.b);
     }
     db.exec('COMMIT');
     ```
   - Isso transforma operações que levariam 30 segundos em processamentos de 200 milissegundos.

4. **Automações e Lançadores Windows (.bat / .ps1):**
   - Lançadores devem verificar se o processo ou porta já está em uso (`netstat -ano | findstr :8088`) antes de tentar subir uma nova instância.
   - Use inicialização em segundo plano via `start /b node ...` para permitir que o terminal permaneça utilizável.

## 🛠️ Checklist de Codificação Sênior

- [ ] O código evita loops desnecessários e alocações de memória gigantes?
- [ ] Em streams de arquivos pesados (>50MB), foi utilizado streaming com `crypto.createHash()` em vez de `readFileSync`?
- [ ] Os scripts `.bat` foram escritos em 7-bit ASCII com caminhos relativos robustos (`cd /d "%~dp0"`)?
- [ ] Foi verificado se o arquivo de destino existe antes de tentar leitura?
