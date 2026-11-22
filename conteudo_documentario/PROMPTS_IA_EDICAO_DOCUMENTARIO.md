# 🎬 BÍBLIA DE PROMPTS PARA IA: EDIÇÃO DE DOCUMENTÁRIO INVESTIGATIVO
## Caso: O Bug de R$ 160 Milhões e a Engenharia Reversa da Transparência Pública (Arinos/MG)

> **Gênero:** Documentário Investigativo / Tech Crime / Engenharia Forense  
> **Referências de Estilo:** *The Social Dilemma (Netflix)*, *ColdFusion*, *Johnny Harris*, *Lemmino*, *Fábio Akita*.  
> **Paleta de Cores:** *Dark Cyber Noir* — Fundo Grafite/Carvão (`#0b0f19`), Destaques em Verde Esmeralda Auditado (`#10b981`), Alertas em Âmbar Crítico (`#f59e0b`) e Azul Frio (`#3b82f6`).

---

## 🧭 1. MASTER PROMPT DO DIRETOR (Para IAs de Montagem / Copilotos NLE)
*Cole este prompt em IAs como **Descript**, **Premiere AI Copilot**, **CapCut AI** ou **DaVinci Resolve Neural Engine** para definir o tom geral da montagem.*

```text
[SYSTEM / DIRECTOR DIRECTIVE]:
Você é um diretor e editor de documentários premiados da Netflix (estilo 'The Great Hack' e 'ColdFusion').
Edite este projeto com ritmo investigativo, dividido em 6 atos dramáticos.
- Ritmo de corte: Cortes dinâmicos a cada 3 a 5 segundos durante momentos de tensão e anamnese técnica; cortes mais longos (6 a 8 segundos) durante explicações arquiteturais e demonstrações de código.
- Transições: Glitch analógico discreto ao apresentar falhas e bugs; transições 'whip pan' suaves em momentos de virada técnica; cortes secos em revelações de números.
- Tratamento de Imagem: Contraste cinematográfico elevado, paleta Teal & Orange com ênfase em tons escuros e luzes volumétricas neon verde (#10b981) para dados válidos e vermelho carmesim para falhas de sistema.
- Elementos Visuais: Sempre sobrepor elementos de tela (código SQL, hashes SHA-256 flutuantes, tabelas e contadores acelerando) quando o locutor citar volumes de dados e valores monetários.
```

---

## 🎥 2. PROMPTS TEXT-TO-VIDEO & TEXT-TO-IMAGE (Para Runway Gen-3, Kling, Sora e Midjourney v6)

### CENA 01 — O Prólogo: A Cidade Tranquila e os Dados Invisíveis
* **Contexto:** Introdução cinematográfica da cidade de Arinos e o contraste entre a calmaria do interior e os milhões trafegando em sistemas digitais.
* **Prompt para Midjourney v6 / Flux (Imagem Estática 16:9):**
```text
Cinematic wide angle drone shot of a small peaceful brazilian countryside town with green hills and red-tile roof colonial houses at sunset, overlaid with glowing ethereal emerald green and blue cyber data streams flowing through the streets like digital underground rivers, misty atmospheric lighting, photorealistic, 8k, shot on ARRI Alexa Mini, documentary aesthetic --ar 16:9 --style raw --v 6.0
```
* **Prompt para Runway Gen-3 Alpha / Kling AI (Geração de Vídeo):**
```text
Cinematic slow push-in aerial shot of a rural town square at dusk, warm streetlights turning on, digital translucent holographic data grids, financial numbers, and glowing green fiber optic traces subtly rising from the ground into the dark sky, realistic motion blur, cinematic 4k documentary style.
```

---

### CENA 02 — O Portal dos Anos 2000 (O Caos Institucional)
* **Contexto:** O sentimento claustrofóbico e arcaico da navegação no sistema público oficial.
* **Prompt para Midjourney v6:**
```text
Close-up shot of an old dusty CRT computer monitor in a dim, cluttered brazilian municipal government office, vintage Windows XP web browser displaying an outdated slow public transparency portal with spinning loading cursor, stacks of printed official stamps and paperwork around, moody yellow tungsten desk lamp, volumetric dust motes floating in air, shallow depth of field --ar 16:9 --v 6.0
```
* **Prompt para Runway Gen-3 Alpha / Sora:**
```text
Slow camera drift toward a vintage computer screen with glowing scan lines, an archaic government database loading endlessly with a vintage spinning hourglass icon, soft green digital reflection on the glass, shadows moving in background, tense and suffocating atmosphere, 24fps.
```

---

### CENA 03 — O Pesadelo do NTFS: 133 Mil Arquivos Soltos
* **Contexto:** Visualização gráfica do colapso do sistema de arquivos ao tentar ler 133.441 arquivos HTML soltos.
* **Prompt para Midjourney v6:**
```text
Abstract visualization of a computer filesystem collapsing, a chaotic blizzard of hundreds of thousands of glowing semi-transparent HTML documents and paper receipts cascading down into a dark digital void, red error indicators flashing, high-tech forensic investigation aesthetic, hyperdetailed, 3D Octane render --ar 16:9
```
* **Prompt para Runway Gen-3 Alpha:**
```text
Fast camera tracking through an infinite dark corridor filled with millions of floating glowing translucent digital code pages and html folders, sudden glitch effect freezes the frame as red system warning borders pulse, cyberpunk documentary vibe.
```

---

### CENA 04 — O Bug da Moeda Fantasma (De R$ 5 Milhões para R$ 160 Milhões!)
* **Contexto:** O momento clímax da investigação: a função de string errada multiplicando o dinheiro público por 100.
* **Prompt para Runway Gen-3 Alpha / Kling:**
```text
Macro shot of glowing green computer code on a dark screen, a regex string manipulation command 'REPLACE(valor, '.', '')' is highlighted, suddenly digital currency counters explode upwards spinning uncontrollably from 1,500.00 to 166,000,000.00 in frantic red neon numerals, screen vibrates with digital distortion, documentary climax moment.
```
* **Prompt para Midjourney v6:**
```text
Dramatic split concept: On the left, a single Brazilian 100 Reais bill transforming into a digital hurricane of inflated glowing numbers, surrounded by red alert caution tape; on the right, clean minimalist SQL database structure glowing in serene emerald green, cinematic lighting, corporate fraud investigation theme --ar 16:9
```

---

### CENA 05 — O Órgão Fantasma: A Fundação Municipal de Saúde
* **Contexto:** A revelação de que um hospital inteiro estava fora dos radares por causa do código de órgão (ID 241).
* **Prompt para Runway Gen-3 Alpha:**
```text
Digital architectural wireframe of a modern public hospital building emerging out of absolute darkness, glowing blue hospital cross pulse, medical staff silhouettes transforming into rows of encrypted cryptographic data records, slow majestic camera orbit, high-tech forensic documentary.
```

---

### CENA 06 — A Redenção: A Nova Engenharia & Busca Instantânea
* **Contexto:** A construção da nova arquitetura Direct-to-SQLite, auditada com SHA-256 e o novo portal respondendo em 5 milissegundos.
* **Prompt para Runway Gen-3 Alpha / Sora:**
```text
Smooth sweeping glide above an array of high-speed sleek dark server units, glowing emerald green fiber cables pulsing with clean data packets, an elegant modern search engine dashboard interface floats in front of the camera, typing 'Enfermeiro' and instant results appearing in zero latency, futuristic, inspiring, clean typography.
```

---

## 🎙️ 3. PROMPTS DE LOCUÇÃO & VOZ NEURAL (Para ElevenLabs)

### Configuração de Voz Recomendada:
* **Voz:** Estilo *Marcus*, *Adam* ou *George* (Voz masculina madura, tom investigativo, firme, ritmo compassado, com pausas dramáticas).
* **Settings:** `Stability: 65%`, `Clarity + Similarity: 88%`, `Style Exaggeration: 15%`.

### Script Formatado com Marcações de Entonação:

```text
[investigative, solemn whisper]
E se um simples erro de programação... [pause: 0.8s]
Fizesse uma cidadezinha de dezoito mil habitantes parecer ter gasto cento e sessenta milhões de reais a mais em diárias de viagens?

[intense clarity, build-up]
E se mais de cento e trinta e três mil contracheques estivessem salvos no seu computador... mas todas as colunas de Nome, Cargo e Salário estivessem completamente vazias?

[confident, rhythmic]
Nos últimos dias, nós mergulhamos nas profundezas dos dados públicos de Arinos, Minas Gerais.
O que era para ser uma auditoria cívica se transformou em uma corrida contra o tempo:
Cento e trinta e três mil arquivos HTML soltos travando o sistema de arquivos do Windows...
Parsers cegos ignorando despesas por causa de tabelas de estorno...
E um órgão público inteiro da Saúde... simplesmente invisível.

[pause: 1.0s]
[tech enthusiasm, triumph]
Nós paramos de fazer remendos. 
Reconstruímos a esteira do zero.
Direct-to-SQLite. 
Cadeia de custódia com hash criptográfico SHA-256.
E uma busca instantânea respondendo em menos de cinco milissegundos.

[firm, inspiring conclusion]
Mais de trezentos e dezesseis milhões de reais auditados, centavo por centavo.
Porque transparência pública não é apenas ter o dado publicado...
É ter a certeza matemática da verdade.
```

---

## 🎵 4. PROMPTS DE TRILHA SONORA & DESIGN DE SOM (Para Suno AI, Udio e SFX)

### Trilha 1: O Mistério & A Tensão Inicial (Abertura até os Erros)
* **Prompt para Suno v3.5 / Udio:**
```text
Dark cinematic investigative ambient synth, ominous low drone bass, rhythmic ticking mechanical clock, cold metallic percussion, Hans Zimmer tension style, feeling of uncovering hidden political secrets and deep digital trails, atmospheric, no vocals, high production value.
```

### Trilha 2: A Revelação do Bug dos R$ 160 Milhões (Clímax Investigativo)
* **Prompt para Suno v3.5 / Udio:**
```text
Fast-paced cyber thriller electronic track, pulsing analog arpeggiator, industrial synthetic beats, sudden bass drops, tension rising to a chaotic crescendo, documentary revelation moment, dark synthwave mixed with cinematic orchestra, no lyrics.
```

### Trilha 3: A Nova Arquitetura & O Novo Portal (Resolução & Esperança)
* **Prompt para Suno v3.5 / Udio:**
```text
Uplifting and modern tech documentary soundtrack, crisp electronic drums, warm synth pads, inspiring arpeggiated piano melody, feeling of clarity, innovation, and technological mastery, forward-moving, professional, corporate TED-talk aesthetic, no vocals.
```

### Prompts para Efeitos Sonoros Específicos (ElevenLabs SFX):
1. **O Bug da Moeda:** `Digital glitch noise, fast ascending cash register ding that distorts into a deep sub-bass impact with digital alarm hum`.
2. **O Travamento do Windows:** `Hard drive clicking rapidly, computer fan ramping up to maximum pitch followed by an abrupt electrical power outage thud`.
3. **A Assinatura Criptográfica:** `Sharp metallic lock mechanism snapping shut, accompanied by a clean futuristic holographic ping`.

---

## 🎨 5. PROMPTS PARA MOTION GRAPHICS & OVERLAYS (After Effects / Premiere AI)

### Motion Overlay 1: A Discrepância dos R$ 160 Milhões
```text
[GRAPHIC INSTRUCTION]:
Criar split animado de números na tela preta:
Lado Esquerdo (Vermelho Glitch): "R$ 166.421.908,12 (Bug de Parsing)"
Lado Direito (Verde Neon com Carimbo): "R$ 5.186.064,09 (Valor Real Auditado)"
Animação: Uma linha de corte a laser diagonal corta o número falso em vermelho, que se desintegra em cinzas binárias, enquanto o valor verde recebe o carimbo animado: 'CADEIA DE CUSTÓDIA SHA-256 VALIDADA'.
```

### Motion Overlay 2: A Esteira de 5 Estágios (Pipeline)
```text
[GRAPHIC INSTRUCTION]:
Exibir timeline horizontal flutuante com nós interconectados em neon:
[ADPMNET Scraper] ──(HTTP 200)──> [Hash SHA-256 Raw] ──(Sanitizador Moeda)──> [SQLite Master] ──(<5ms)──> [Dashboard Cidadão]
Ao passar por cada nó, acender um pulso de luz verde com som de bip sutil.
```

---

## 📋 6. ESTRUTURA DE ARQUIVOS GERADA NO PROJETO
O arquivo oficial contendo esta especificação foi gravado e versionado diretamente na pasta do portal:
📄 [PROMPTS_IA_EDICAO_DOCUMENTARIO.md](file:///C:/Users/Desenvolvimento/Documents/hacks/portal_transparencia_arinos/PROMPTS_IA_EDICAO_DOCUMENTARIO.md)
