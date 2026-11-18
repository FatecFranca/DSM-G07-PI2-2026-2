const state = {
  screen: 'login',
  os: [],
  servicos: [],
  tecnicos: [],
  tecnico: null,
  loginErr: '',
  loginLoading: false,
  clienteLoginErr: '',
  clienteCadastroErr: '',
  clienteActionErr: '',
  clienteLoading: false,
  cliente: null,
  clienteLogin: { email: '', password: '' },
  clienteOrdens: [],
  clienteOrdemId: null,
  clienteSaving: false,
  clienteCadastro: emptyClienteCadastro(),
  statusSaving: false,
  statusErr: '',
  apiError: '',
  selId: null,
  form: emptyForm(),
  formErr: '',
  portal: emptyPortal(),
  pErr: '',
  portalDone: null,
  orcSaving: false,
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
