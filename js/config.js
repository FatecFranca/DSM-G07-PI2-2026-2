

const dataChave = data => {
  const pad = valor => String(valor).padStart(2, '0');
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
};
const TODAY = dataChave(new Date());
const HORAS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
const DIAS = (() => {
  const dias = [];
  const data = new Date();
  while (dias.length < 5) {
    if (data.getDay() !== 0 && data.getDay() !== 6) dias.push(dataChave(data));
    data.setDate(data.getDate() + 1);
  }
  return dias;
})();
const ORC_CLASS = {'Sem orçamento':'s-triagem','Pendente':'s-aprov','Aprovado':'s-concl','Recusado':'s-cancel'};

const SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const TITLES = { painel:'Painel de Controle', ordens:'Ordens de Serviço', nova:'Nova Ordem de Serviço', detalhe:'Detalhe da Ordem de Serviço', agenda:'Agendamentos' };
