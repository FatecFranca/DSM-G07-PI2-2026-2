
-- Banco: assistencia_tecnica

CREATE DATABASE IF NOT EXISTS assistencia_tecnica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE assistencia_tecnica;

-- CLIENTE

CREATE TABLE cliente (
  id_cliente    INT           NOT NULL AUTO_INCREMENT,
  nome_completo VARCHAR(120)  NOT NULL,
  cpf           CHAR(11)      NOT NULL,
  senha         VARCHAR(255)  NOT NULL,  -- armazenar apenas o HASH da senha
  telefone      VARCHAR(20)   NOT NULL,
  cep           CHAR(8)       NOT NULL,
  numero        VARCHAR(10)   NOT NULL,
  bairro        VARCHAR(80)   NOT NULL,
  rua           VARCHAR(150)  NOT NULL,
  cidade        VARCHAR(80)   NOT NULL,
  referencia    VARCHAR(150)  NULL,
  estado        CHAR(2)       NOT NULL,
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uq_cliente_cpf (cpf)
) ENGINE=InnoDB;


-- TECNICO (sem e-mail/senha: não tem login próprio)

CREATE TABLE tecnico (
  id_tecnico INT          NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(120) NOT NULL,
  nivel      VARCHAR(20)  NOT NULL,
  PRIMARY KEY (id_tecnico)
) ENGINE=InnoDB;


-- AGENDAMENTO

CREATE TABLE agendamento (
  id_agendamento INT         NOT NULL AUTO_INCREMENT,
  status         VARCHAR(15) NOT NULL,
  `data`         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  buscar         BOOLEAN     NOT NULL,
  PRIMARY KEY (id_agendamento)
) ENGINE=InnoDB;


-- SERVICO

CREATE TABLE servico (
  id_servico INT          NOT NULL AUTO_INCREMENT,
  descricao  VARCHAR(150) NOT NULL,
  status     VARCHAR(15)  NOT NULL,
  PRIMARY KEY (id_servico)
) ENGINE=InnoDB;


-- ORDEM_SERVICO

CREATE TABLE ordem_servico (
  id_ordem_servico INT         NOT NULL AUTO_INCREMENT,
  numero_os        VARCHAR(20) NOT NULL,
  id_cliente       INT         NOT NULL,
  id_tecnico       INT         NOT NULL,
  PRIMARY KEY (id_ordem_servico),
  UNIQUE KEY uq_ordem_servico_numero_os (numero_os),
  CONSTRAINT fk_os_cliente
    FOREIGN KEY (id_cliente) REFERENCES cliente (id_cliente)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_os_tecnico
    FOREIGN KEY (id_tecnico) REFERENCES tecnico (id_tecnico)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


-- OS_AGENDAMENTO (associativa: ordem_servico <-> agendamento)
-- -----------------------------------------------------
CREATE TABLE os_agendamento (
  id_ordem_servico INT NOT NULL,
  id_agendamento   INT NOT NULL,
  PRIMARY KEY (id_ordem_servico, id_agendamento),
  CONSTRAINT fk_osag_os
    FOREIGN KEY (id_ordem_servico) REFERENCES ordem_servico (id_ordem_servico)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_osag_agendamento
    FOREIGN KEY (id_agendamento) REFERENCES agendamento (id_agendamento)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ORCAMENTO (1:1 com ordem_servico)

CREATE TABLE orcamento (
  id_orcamento     INT         NOT NULL AUTO_INCREMENT,
  id_ordem_servico INT         NOT NULL,
  status           VARCHAR(15) NOT NULL,
  PRIMARY KEY (id_orcamento),
  UNIQUE KEY uq_orcamento_os (id_ordem_servico),
  CONSTRAINT fk_orcamento_os
    FOREIGN KEY (id_ordem_servico) REFERENCES ordem_servico (id_ordem_servico)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ITEM_SERVICO (associativa: orcamento <-> servico)

CREATE TABLE item_servico (
  id_orcamento INT           NOT NULL,
  id_servico   INT           NOT NULL,
  quantidade   INT           NOT NULL,
  mao_de_obra  DECIMAL(10,2) NOT NULL,
  custo_item   DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_orcamento, id_servico),
  CONSTRAINT fk_item_orcamento
    FOREIGN KEY (id_orcamento) REFERENCES orcamento (id_orcamento)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_servico
    FOREIGN KEY (id_servico) REFERENCES servico (id_servico)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


-- APARELHO

CREATE TABLE aparelho (
  id_aparelho      INT         NOT NULL AUTO_INCREMENT,
  id_ordem_servico INT         NOT NULL,
  numero_serie     VARCHAR(60) NULL,
  observacao       TEXT        NULL,
  PRIMARY KEY (id_aparelho),
  CONSTRAINT fk_aparelho_os
    FOREIGN KEY (id_ordem_servico) REFERENCES ordem_servico (id_ordem_servico)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

show tables;