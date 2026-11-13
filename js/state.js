const state = {
  screen: 'login',
  os: [],
  servicos: [],
  tecnicos: [],
  tecnico: null,
  loginErr: '',
  apiError: '',
  selId: null,
  form: emptyForm(),
  formErr: '',
  agendaDay: TODAY,
  query: '',
  flash: '',
  orcForm: emptyOrcForm(),
  orcErr: ''
};

const tecnicosNomes = () => state.tecnicos.map(tecnico => tecnico.nome);
const sel = () => state.os.find(o => o.id === state.selId) || null;

const eventos = () => state.os.flatMap(o =>
  o.agendamentos.map(agendamento => ({
    o,
    tipo: agendamento.status || 'Agendamento',
    data: agendamento.data,
    hora: agendamento.hora
  }))
);
const slot = (tecnico, data, hora) => eventos().find(evento =>
  evento.o.tecnico === tecnico &&
  evento.data === data &&
  evento.hora === hora
);
