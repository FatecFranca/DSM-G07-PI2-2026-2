

const TODAY = '2026-10-08'; 
const HORAS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
const DIAS = ['2026-10-08','2026-10-09','2026-10-12','2026-10-13','2026-10-14'];
const SERVICOS = ['Formatação','Backup completo','Upgrade de SO','Manutenção geral','Diagnóstico'];
const STATUSES = ['Aguardando triagem','Aguardando aprovação','Agendado','Em andamento','Concluído','Cancelado'];
const STATUS_CLASS = {'Aguardando triagem':'s-triagem','Aguardando aprovação':'s-aprov','Agendado':'s-agend','Em andamento':'s-andam','Concluído':'s-concl','Cancelado':'s-cancel'};
const ORC_CLASS = {'Sem orçamento':'s-triagem','Pendente':'s-aprov','Aprovado':'s-concl','Recusado':'s-cancel'};


const CATALOGO = [
  { desc: 'Formatação + instalação do SO', mao: 120, custo: 0 },
  { desc: 'Backup completo', mao: 80, custo: 0 },
  { desc: 'Upgrade Windows 11', mao: 150, custo: 0 },
  { desc: 'Limpeza interna', mao: 70, custo: 15 },
  { desc: 'Troca de SSD 480 GB', mao: 40, custo: 220 },
  { desc: 'Troca de fonte ATX 500 W', mao: 50, custo: 260 }
];

const SUGESTOES = ['Troca de tela', 'Troca de bateria', 'Troca de conector de carga', 'Troca de teclado', 'Troca de SSD', 'Formatação + instalação do SO', 'Backup completo', 'Limpeza interna e troca de pasta térmica', 'Remoção de vírus', 'Diagnóstico'];

const SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const TITLES = { painel:'Painel de Controle', ordens:'Ordens de Serviço', nova:'Nova Ordem de Serviço', detalhe:'Detalhe da Ordem de Serviço', agenda:'Agendamentos' };
