-- ==============================================================================
-- ESQUEMA RELACIONAL OFICIAL MYSQL — PORTAL DA TRANSPARÊNCIA DE ARINOS / MG
-- ==============================================================================
-- Motor de Armazenamento: InnoDB
-- Codificação de Caracteres: utf8mb4 (utf8mb4_unicode_ci)
-- Integridade Referencial Estrita: Chaves Primárias, Estrangeiras e Índices de Cobertura
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS arinos_transparencia 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE arinos_transparencia;

-- 1. TABELA PRINCIPAL DE ENTIDADES CONSOLIDADAS: pessoas_unificadas
CREATE TABLE IF NOT EXISTS pessoas_unificadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_canonic VARCHAR(255) NOT NULL,
  nome_exibicao VARCHAR(255) NOT NULL,
  matriculas_json JSON NOT NULL,
  qtd_matriculas INT NOT NULL DEFAULT 1,
  cargos_json JSON NOT NULL,
  cargos_resumo VARCHAR(500) NOT NULL,
  entidades_json JSON NOT NULL,
  total_salarios DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  qtd_contracheques INT NOT NULL DEFAULT 0,
  ano_primeiro_salario INT NULL,
  ano_ultimo_salario INT NULL,
  maior_salario DECIMAL(14,2) NULL,
  total_diarias DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  qtd_diarias INT NOT NULL DEFAULT 0,
  ano_primeira_diaria INT NULL,
  ano_ultima_diaria INT NULL,
  maior_diaria DECIMAL(14,2) NULL,
  destinos_frequentes TEXT NULL,
  total_dinheiro_publico DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  is_politico TINYINT(1) NOT NULL DEFAULT 0,
  is_prefeito TINYINT(1) NOT NULL DEFAULT 0,
  is_vereador TINYINT(1) NOT NULL DEFAULT 0,
  is_candidato TINYINT(1) NOT NULL DEFAULT 0,
  perfil_tipo VARCHAR(100) NOT NULL,
  partido_politico VARCHAR(50) NULL,
  legislaturas_camara VARCHAR(255) NULL,
  projetos_apresentados INT NULL DEFAULT 0,
  bens_declarados_tse DECIMAL(14,2) NULL DEFAULT 0.00,
  is_socio_empresa TINYINT(1) NOT NULL DEFAULT 0,
  empresas_vinculadas TEXT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  foto_url VARCHAR(500) NULL,
  foto_id INT NULL,
  INDEX idx_pessoas_nome_canonic (nome_canonic),
  INDEX idx_pessoas_total_dinheiro (total_dinheiro_publico DESC),
  INDEX idx_pessoas_perfil (perfil_tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DIMENSIONAL DE MATRÍCULAS HIGIENIZADAS: dim_servidores_matriculas
CREATE TABLE IF NOT EXISTS dim_servidores_matriculas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pessoa_id INT NOT NULL,
  matricula_original VARCHAR(100) NOT NULL,
  matricula_limpa VARCHAR(100) NOT NULL,
  matricula_base INT NOT NULL,
  matricula_digito VARCHAR(10) NULL,
  separador_original VARCHAR(10) NULL,
  cargos_exercidos VARCHAR(500) NULL,
  vinculos_exercidos VARCHAR(500) NULL,
  entidades VARCHAR(255) NULL,
  qtd_folhas INT NOT NULL DEFAULT 0,
  primeiro_ano INT NULL,
  ultimo_ano INT NULL,
  total_recebido DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_matr_pessoa_id (pessoa_id),
  INDEX idx_matr_limpa (matricula_limpa),
  INDEX idx_matr_base (matricula_base),
  CONSTRAINT fk_matricula_pessoa FOREIGN KEY (pessoa_id) 
    REFERENCES pessoas_unificadas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE FATOS: contracheques (Série Histórica Municipal)
CREATE TABLE IF NOT EXISTS contracheques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hash_registro VARCHAR(64) NOT NULL UNIQUE,
  entidade VARCHAR(100) NOT NULL,
  idorg INT NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL,
  matricula VARCHAR(100) NULL,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NULL,
  vinculo VARCHAR(100) NULL,
  tipo_folha VARCHAR(100) NULL,
  total_proventos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_descontos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  salario_liquido DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  idfun VARCHAR(50) NULL,
  url_detalhe TEXT NULL,
  hash_arquivo_raw VARCHAR(64) NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pessoa_id INT NULL,
  matricula_limpa VARCHAR(100) NULL,
  matricula_base INT NULL,
  matricula_digito VARCHAR(10) NULL,
  nome_normalizado VARCHAR(255) NULL,
  INDEX idx_contracheques_pessoa_ano (pessoa_id, ano),
  INDEX idx_contracheques_ano_mes (ano, mes),
  INDEX idx_contracheques_nome_norm (nome_normalizado),
  INDEX idx_contracheques_entidade (entidade),
  INDEX idx_contracheques_matricula (matricula_limpa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE FATOS: despesas e empenhos municipais
CREATE TABLE IF NOT EXISTS despesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hash_registro VARCHAR(64) NOT NULL UNIQUE,
  entidade VARCHAR(100) NOT NULL,
  idorg INT NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL,
  nr_empenho VARCHAR(50) NULL,
  data_empenho DATE NULL,
  valor DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  credor VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(30) NULL,
  funcional_programatica VARCHAR(100) NULL,
  natureza VARCHAR(255) NULL,
  projeto_atividade VARCHAR(255) NULL,
  descricao_natureza VARCHAR(255) NULL,
  historico TEXT NULL,
  hash_arquivo_raw VARCHAR(64) NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_despesas_ano_mes (ano, mes),
  INDEX idx_despesas_credor (credor),
  INDEX idx_despesas_cpf_cnpj (cpf_cnpj),
  INDEX idx_despesas_empenho (nr_empenho)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA DE FATOS: diarias de viagem oficial
CREATE TABLE IF NOT EXISTS diarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hash_registro VARCHAR(64) NOT NULL UNIQUE,
  entidade VARCHAR(100) NOT NULL,
  idorg INT NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL,
  nr_empenho VARCHAR(50) NULL,
  tipo_diaria VARCHAR(100) NULL,
  servidor VARCHAR(255) NOT NULL,
  cargo VARCHAR(255) NULL,
  destino VARCHAR(255) NULL,
  motivo TEXT NULL,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  data_viagem DATE NULL,
  hash_arquivo_raw VARCHAR(64) NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_diarias_servidor (servidor),
  INDEX idx_diarias_ano (ano),
  INDEX idx_diarias_destino (destino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELA DE FATOS: contratos administrativos
CREATE TABLE IF NOT EXISTS contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hash_registro VARCHAR(64) NOT NULL UNIQUE,
  idccs INT NULL,
  codcrd INT NULL,
  credor VARCHAR(255) NOT NULL,
  doc_credor VARCHAR(30) NULL,
  tipo_contrato VARCHAR(100) NULL,
  nr_contrato INT NULL,
  valor DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  dt_ini_vigencia DATE NULL,
  dt_fim_vigencia DATE NULL,
  dt_assinatura DATE NULL,
  dt_publicacao DATE NULL,
  local_publicacao VARCHAR(255) NULL,
  nr_licitacao INT NULL,
  dt_licitacao DATE NULL,
  objeto TEXT NULL,
  fundamento TEXT NULL,
  nr_processo INT NULL,
  dt_processo DATE NULL,
  hash_raw VARCHAR(64) NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contratos_credor (credor),
  INDEX idx_contratos_nr (nr_contrato),
  INDEX idx_contratos_doc (doc_credor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABELA DE FATOS: receitas municipais arrecadadas
CREATE TABLE IF NOT EXISTS receitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hash_registro VARCHAR(64) NOT NULL UNIQUE,
  idror INT NULL,
  ano INT NOT NULL,
  nr_conhecimento INT NULL,
  nr_item INT NULL,
  data_receita DATE NULL,
  valor DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  descricao_receita VARCHAR(255) NULL,
  mascara_receita VARCHAR(50) NULL,
  agencia VARCHAR(50) NULL,
  conta VARCHAR(50) NULL,
  descricao_conta VARCHAR(255) NULL,
  hash_raw VARCHAR(64) NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_receitas_ano (ano),
  INDEX idx_receitas_mascara (mascara_receita)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABELA DE FATOS: convenios publicos
CREATE TABLE IF NOT EXISTS convenios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hash_registro VARCHAR(64) NOT NULL UNIQUE,
  idcnv INT NULL,
  codigo INT NULL,
  nr_convenio VARCHAR(50) NULL,
  descricao VARCHAR(255) NULL,
  objeto TEXT NULL,
  valor_convenio DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  valor_contrapartida DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  dt_convenio DATE NULL,
  dt_inicio DATE NULL,
  dt_final DATE NULL,
  dt_tce DATE NULL,
  parcelas INT NULL,
  tipo INT NULL,
  usuario VARCHAR(100) NULL,
  hash_raw VARCHAR(64) NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_convenios_nr (nr_convenio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABELA DE ENTIDADES: empresas_contratadas
CREATE TABLE IF NOT EXISTS empresas_contratadas (
  cnpj VARCHAR(20) PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255) NULL,
  situacao_cadastral VARCHAR(50) NULL,
  data_situacao_cadastral VARCHAR(20) NULL,
  capital_social DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  cnae_principal_codigo VARCHAR(20) NULL,
  cnae_principal_descricao VARCHAR(255) NULL,
  natureza_juridica VARCHAR(100) NULL,
  porte VARCHAR(50) NULL,
  data_abertura VARCHAR(20) NULL,
  logradouro VARCHAR(255) NULL,
  numero VARCHAR(50) NULL,
  bairro VARCHAR(100) NULL,
  municipio VARCHAR(100) NULL,
  uf VARCHAR(10) NULL,
  cep VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  telefone VARCHAR(50) NULL,
  total_contratos DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  qtd_contratos INT NOT NULL DEFAULT 0,
  total_despesas DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  qtd_despesas INT NOT NULL DEFAULT 0,
  total_geral DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  qtd_socios INT NOT NULL DEFAULT 0,
  possui_alerta_vinculo TINYINT(1) NOT NULL DEFAULT 0,
  alerta_detalhe TEXT NULL,
  dados_json JSON NULL,
  hash_forense VARCHAR(64) NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_empresas_razao (razao_social),
  INDEX idx_empresas_total (total_geral DESC),
  INDEX idx_empresas_alerta (possui_alerta_vinculo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABELA DE ENTIDADES: empresas_socios (Quadro Societário QSA)
CREATE TABLE IF NOT EXISTS empresas_socios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cnpj VARCHAR(20) NOT NULL,
  nome_socio VARCHAR(255) NOT NULL,
  cpf_mascarado VARCHAR(30) NULL,
  qualificacao_socio VARCHAR(100) NULL,
  faixa_etaria VARCHAR(50) NULL,
  data_entrada VARCHAR(20) NULL,
  pais VARCHAR(50) NULL,
  vinculo_politico_alerta VARCHAR(255) NULL,
  hash_forense VARCHAR(64) NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_socios_cnpj (cnpj),
  INDEX idx_socios_nome (nome_socio),
  CONSTRAINT fk_socio_empresa FOREIGN KEY (cnpj) 
    REFERENCES empresas_contratadas (cnpj) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. TABELA ELEITORAL: eleicoes_candidatos (Base Oficial TSE)
CREATE TABLE IF NOT EXISTS eleicoes_candidatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ano INT NOT NULL,
  id_candidato VARCHAR(50) NOT NULL,
  cargo VARCHAR(50) NOT NULL,
  numero INT NOT NULL,
  nome_urna VARCHAR(100) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  partido_sigla VARCHAR(20) NOT NULL,
  coligacao VARCHAR(255) NULL,
  situacao VARCHAR(50) NULL,
  resultado VARCHAR(50) NULL,
  votos INT NOT NULL DEFAULT 0,
  percentual DECIMAL(6,2) NULL,
  total_bens DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  foto_local VARCHAR(500) NULL,
  foto_tse VARCHAR(500) NULL,
  hash_sha256 VARCHAR(64) NULL,
  cor_primaria VARCHAR(10) NULL,
  cor_secundaria VARCHAR(10) NULL,
  vice_nome VARCHAR(100) NULL,
  vice_partido VARCHAR(20) NULL,
  vice_foto VARCHAR(500) NULL,
  ocupacao VARCHAR(100) NULL,
  grau_instrucao VARCHAR(100) NULL,
  INDEX idx_eleicoes_ano_cargo (ano, cargo),
  INDEX idx_eleicoes_cand_id (id_candidato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. TABELA LEGISLATIVA: camara_vereadores (Câmara Municipal de Arinos)
CREATE TABLE IF NOT EXISTS camara_vereadores (
  id INT PRIMARY KEY,
  nome_parlamentar VARCHAR(100) NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  partido VARCHAR(20) NOT NULL,
  situacao VARCHAR(50) NULL,
  legislatura VARCHAR(50) NULL,
  foto_url VARCHAR(500) NULL,
  total_materias INT NOT NULL DEFAULT 0,
  projetos_lei INT NOT NULL DEFAULT 0,
  indicacoes INT NOT NULL DEFAULT 0,
  requerimentos INT NOT NULL DEFAULT 0,
  mocoes INT NOT NULL DEFAULT 0,
  top_temas TEXT NULL,
  dados_completos JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. TABELA LEGISLATIVA: camara_materias (Projetos de Lei, Requerimentos)
CREATE TABLE IF NOT EXISTS camara_materias (
  id INT PRIMARY KEY,
  tipo VARCHAR(100) NULL,
  numero INT NULL,
  ano INT NULL,
  titulo VARCHAR(255) NULL,
  ementa TEXT NULL,
  indexacao TEXT NULL,
  data_apresentacao DATE NULL,
  texto_original TEXT NULL,
  em_tramitacao TINYINT(1) NOT NULL DEFAULT 0,
  autores_ids VARCHAR(255) NULL,
  parlamentar_principal_id INT NULL,
  INDEX idx_materias_ano (ano),
  INDEX idx_materias_tipo (tipo),
  INDEX idx_materias_parlamentar (parlamentar_principal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. TABELA FORENSE: fotos_auditadas_pessoas (Cadeia de Custódia SHA-256)
CREATE TABLE IF NOT EXISTS fotos_auditadas_pessoas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pessoa_id INT NOT NULL,
  nome_canonic VARCHAR(255) NOT NULL,
  nome_exibicao VARCHAR(255) NOT NULL,
  nome_urna VARCHAR(100) NULL,
  cargo_tse VARCHAR(50) NULL,
  ano_eleicao INT NULL,
  id_candidato_tse VARCHAR(50) NULL,
  caminho_foto VARCHAR(500) NOT NULL,
  hash_sha256 VARCHAR(64) NOT NULL,
  status_auditoria VARCHAR(50) NOT NULL,
  auditado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_foto_pessoa_id (pessoa_id),
  INDEX idx_foto_hash (hash_sha256),
  CONSTRAINT fk_foto_pessoa FOREIGN KEY (pessoa_id) 
    REFERENCES pessoas_unificadas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. TABELA DE AUDITORIA: auditoria_consultas (Histórico Forense de Coleta)
CREATE TABLE IF NOT EXISTS auditoria_consultas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entidade VARCHAR(100) NOT NULL,
  idorg INT NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  tpformpdf INT NOT NULL,
  ano INT NOT NULL,
  mes INT NOT NULL,
  url_completa TEXT NOT NULL,
  status_http INT NULL,
  status_coleta VARCHAR(50) NOT NULL,
  bytes_recebidos INT NULL,
  hash_sha256 VARCHAR(64) NULL,
  qtd_registros_extraidos INT NULL,
  caminho_arquivo_raw VARCHAR(500) NULL,
  mensagem TEXT NULL,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tempo_resposta_ms INT NULL,
  INDEX idx_audit_ano_mes (ano, mes),
  INDEX idx_audit_entidade (entidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. TABELAS ADICIONAIS DE TURISMO E NOTÍCIAS
CREATE TABLE IF NOT EXISTS turismo_pontos (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NULL,
  distancia_centro_km DECIMAL(6,2) NULL,
  trajeto TEXT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  coordenadas_dms VARCHAR(100) NULL,
  altura_queda_m DECIMAL(6,2) NULL,
  descricao TEXT NULL,
  fonte_oficial VARCHAR(255) NULL,
  url_fonte TEXT NULL,
  regulamentacao TEXT NULL,
  foto_url VARCHAR(500) NULL,
  sha256_hash VARCHAR(64) NULL,
  timestamp_auditoria DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS noticias_relevantes (
  id VARCHAR(50) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  veiculo VARCHAR(100) NULL,
  data VARCHAR(50) NULL,
  categoria VARCHAR(100) NULL,
  resumo TEXT NULL,
  url_noticia TEXT NULL,
  impacto TEXT NULL,
  sha256_hash VARCHAR(64) NULL,
  timestamp_auditoria DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
