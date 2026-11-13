/* ======= Estado da aplicação ===============
*/
const state = {
  screen: 'login',          // login | portal | painel | ordens | nova | detalhe | agenda
  os: OS_EXEMPLO,           // depois: preenchido com GET /api/os
  tecnicos: [],
  apiError: '',
  selId: 'os1245',          // OS aberta na tela de detalhe
  form: emptyForm(), formErr: '',                       // Nova OS
  portal: emptyPortal(), pErr: '', portalDone: null,    // Portal do cliente
  agendaDay: TODAY, query: '', filtro: 'Todas',         // Agenda / busca / filtro
  showSenha: false, flash: '',
  orcForm: emptyOrcForm(), orcErr: '', servDia: null    // Pré-orçamento
};

const tecnicosNomes = () => state.tecnicos.map(tecnico => tecnico.nome);
const sel = () => state.os.find(o => o.id === state.selId) || state.os[0];
const updateSel = fn => { state.os = state.os.map(o => o.id === state.selId ? fn(o) : o); };

/* =============== Regras de agenda =======================
   Cada OS ocupa até dois horários do técnico: a entrega para diagnóstico (data/hora)
   e a execução do serviço definida no orçamento (sData/sHora).
   No banco isso vira a tabela `agendamentos` com UNIQUE(tecnico_id, data, hora). */

const eventos = () => state.os.filter(o => o.status !== 'Cancelado').flatMap(o => {
  const ev = [{ o, tipo: 'Diagnóstico', data: o.data, hora: o.hora }];
  if (o.sData) ev.push({ o, tipo: 'Serviço', data: o.sData, hora: o.sHora });
  return ev;
});
const slot = (t, d, h) => eventos().find(e => e.o.tecnico === t && e.data === d && e.hora === h);
const busy = (t, d, h) => { const e = slot(t, d, h); return e ? e.o : null; };
const nextNum = () => Math.max(...state.os.map(o => o.numero)) + 1; // no banco: AUTO_INCREMENT
