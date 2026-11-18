
# 🛠️ TechManager — Sistema Web de Gestão de Assistência Técnica de TI

&gt; **Projeto Integrador – 2º Semestre DSM (2026)**  
&gt; **Faculdade de Tecnologia de Franca "Dr. Thomaz Novelino" — Fatec Franca / Centro Paula Souza**

---

## 🌐 Acesso à Aplicação em Nuvem (Produção)

O sistema está **totalmente publicado e hospedado em nuvem**, **não sendo necessário instalar ou rodar a aplicação localmente** para testes e avaliação.

👉 **Acesse o sistema online:** [https://techmanager.alwaysdata.net/](https://techmanager.alwaysdata.net/)

---

## 📌 Sobre o Projeto

O **TechManager** é uma aplicação web desenvolvida para otimizar e sistematizar os processos operacionais de empresas de assistência técnica em TI e manutenção de computadores e dispositivos móveis.

Devido à dependência diária dos usuários em relação aos seus equipamentos (trabalho, estudos, comunicação e serviços financeiros), a permanência prolongada de um aparelho em manutenção causa grandes transtornos. O **TechManager** resolve essa ineficiência ao **sistematizar o atendimento inicial**:
- O cliente descreve o defeito previamente e solicita o agendamento de recolhimento ou visita técnica.
- O profissional de TI analisa as informações com antecedência, prepara peças e diagnósticos antes do atendimento e gera um **pré-orçamento ágil**, reduzindo drasticamente o tempo de máquina parada.

---

## ✨ Funcionalidades Principais (Requisitos Funcionais)

- **`[RF001]` Solicitação de Atendimento &amp; Pré-Orçamento:** Registro de chamados pelo cliente informando dados do equipamento, relato do problema e preferência de data/horário para visita ou coleta.
- **`[RF002]` Agendamento de Formatações &amp; Manutenções:** Marcação, reagendamento e cancelamento de horários na grade da equipe técnica com envio de lembretes automáticos.
- **`[RF003]` Controle de Backups de Segurança:** Registro de cópias de segurança com diretórios de origem, destino, volume de dados e validação de integridade.
- **`[RF004]` Controle de Upgrades de Sistema Operacional:** Histórico de atualizações de SO com emissão de alertas em caso de versões obsoletas ou fora de suporte.
- **`[RF005]` Gestão de Usuários e Níveis de Acesso:** Autenticação segura por login com perfis diferenciados (*Administrador*, *Técnico*, *Atendente*, *Cliente*).
- **`[RF006]` Relatórios Gerenciais &amp; Indicadores (Dashboard):** Painel analítico exibindo volume de Ordens de Serviço (OS) por período, tempo médio de atendimento e histórico de backups.
- **`[RF007]` Gerenciamento Operacional de Ordens de Serviço:** Painel exclusivo do técnico para atualização de status, registro de laudo técnico, descrição de entrada/saída e encerramento do chamado.

---

## 📐 Regras de Negócio (Validações do Sistema)

* **`RN01` – Vínculo Obrigatório:** Toda Ordem de Serviço deve ser vinculada a um cliente e a um equipamento cadastrado.
* **`RN02` – Ciclo de Vida da OS:** Status padronizados (*Aberta*, *Em andamento*, *Aguardando aprovação*, *Concluída*, *Cancelada*).
* **`RN03` – Agendamento Sem Conflito:** Impedimento automático de sobreposição de dois atendimentos no mesmo horário para o mesmo técnico.
* **`RN04` – Registro de Procedimentos:** Gravação obrigatória de dados do equipamento, responsável técnico e datas de entrada/saída.
* **`RN05` – Registro de Upgrade de SO:** Armazenamento obrigatório de versão anterior, versão nova e data da atualização.
* **`RN06` – Encerramento Condicionado:** Encerramento formal da OS somente após a conclusão do serviço e registro do laudo técnico pelo profissional.

---

## 🛠️ Tecnologias Utilizadas

### **Hospedagem &amp; Infraestrutura**
* **AlwaysData** (Plataforma de hospedagem do projeto em produção)
* **HTTPS / SSL** (Comunicação segura e criptografada)

### **Backend &amp; Banco de Dados**
* **Python 3.12** com **Django Framework**
* **MySQL 8.0** (Persistência relacional de dados)

### **Frontend &amp; Interface**
* **HTML5 &amp; CSS3** (Interface responsiva)
* **JavaScript (ES6+)** (Interatividade e validações cliente)
* **Figma** (Prototipagem de alta fidelidade UI/UX)

### **Engenharia de Software &amp; Metodologia**
* **UML / RUP** (Especificação tabular de Casos de Uso e Diagramas de Contexto)
* **BPMN 2.0** (Mapeamento de Processos de Negócio em Swimlanes)
* **Git &amp; GitHub** (Versionamento com fluxo de Branches, Commits e Pull Requests)
* **Scrum / Kanban (GitHub Projects)** (Gestão do Product e Sprint Backlog)

---

## 📂 Estrutura do Repositório

````
TechManager_PI_2/
├── docs/                                   # Artefatos da Engenharia de Software
│   ├── documentacao_projeto_completa.docx  # Documentação técnica oficial (RUP/UML)
│   ├── bpmn-processo-assistencia-tecnica.drawio # Processo de Negócio BPMN 2.0
│   └── diagrama-casos-de-uso.drawio        # Diagramas de Casos de Uso UML
├── src/
│   └── backend/                            # Aplicação Python / Django
│       ├── config/                         # Configurações do projeto Django
│       ├── manage.py                       # CLI de gerenciamento
│       └── requirements.txt                # Dependências de pacotes Python
├── css/                                    # Estilos visuais da aplicação
├── js/                                     # Scripts frontend de comportamento
├── index.html                              # Interface Web principal
├── Criando o Banco.sql                     # Script SQL DDL (MySQL)
├── .gitignore                              # Regras de exclusão do Git
└── README.md                               # Apresentação do repositório
````
### **Passo a Passo para Desenvolvimento Local**

1. **Clonar o Repositório:**


git clone <link-do-repositório>
cd TechManager_PI_2



2. **Acessar o diretório do backend:**


cd src/backend



3. **Criar e Ativar o Ambiente Virtual (** **venv** **):**
  * **Linux / macOS:**


python3 -m venv venv
source venv/bin/activate



* **Windows (PowerShell):**


python -m venv venv
.\venv\Scripts\Activate.ps1



4. **Instalar as Dependências:**


pip install --upgrade pip
pip install -r requirements.txt



5. **Executar as Migrações e Iniciar o Servidor Local:**


python manage.py migrate
python manage.py runserver



---

## 🎨 Protótipo de Interface (Figma)

O design de alta fidelidade com todas as telas navegáveis (fluxo do cliente, painel Kanban do técnico e dashboard gerencial) foi construído no Figma e pode ser consultado no link disponível na documentação técnica do projeto.

---

## 👥 Equipe do Projeto

* **Gustavo Pasti** — *Product Owner (PO) &amp; Desenvolvedor*
* **Derik Silva** — *Desenvolvedor*
* **Mateus Morgan** — *Desenvolvedor*
* **Rafael Vinicius** — *Desenvolvedor*

**Instituição:** Fatec Franca — "Dr. Thomaz Novelino"

---

## 📜 Licença

Desenvolvido para fins exclusivamente acadêmicos como Projeto Integrador do curso de Tecnologia em Desenvolvimento de Software Multiplataforma.



---
