let revisaoAutenticacao = 0;

if (new URLSearchParams(window.location.search).has('password')) {
  window.history.replaceState(
    window.history.state,
    '',
    window.location.pathname + window.location.hash
  );
}

function invalidarCarregamentosDeAutenticacao() {
  revisaoAutenticacao += 1;
}

async function carregarDadosDoTecnico(perfilInicial = null) {
  const revisao = revisaoAutenticacao;
  const perfil = perfilInicial || await apiGet('/me/');
  if (revisao !== revisaoAutenticacao) return false;
  if (!perfil.tecnico) {
    throw new Error('A API não retornou os dados do técnico autenticado.');
  }

  const [resultadoOs, resultadoServicos] = await Promise.allSettled([
    apiGet('/os/'),
    apiGet('/servicos/')
  ]);
  if (revisao !== revisaoAutenticacao) return false;

  state.tecnico = perfil.tecnico;
  state.tecnicos = [perfil.tecnico];
  state.os = resultadoOs.status === 'fulfilled'
    ? resultadoOs.value.ordens.map(normalizarOrdem)
    : [];
  state.servicos = resultadoServicos.status === 'fulfilled'
    ? resultadoServicos.value.servicos
    : [];
  state.selId = state.os[0]?.id || null;

  const erros = [];
  if (resultadoOs.status === 'rejected') {
    erros.push(`ordens: ${resultadoOs.reason.message}`);
  }
  if (resultadoServicos.status === 'rejected') {
    erros.push(`catálogo: ${resultadoServicos.reason.message}`);
  }
  if (erros.length) {
    const erro = new Error(`Não foi possível carregar ${erros.join('; ')}.`);
    const falhaSessao = [resultadoOs, resultadoServicos].find(
      resultado => resultado.status === 'rejected' && resultado.reason.status === 401
    );
    if (falhaSessao) erro.status = 401;
    throw erro;
  }
  return true;
}

async function carregarDadosDoCliente(perfilInicial = null) {
  const revisao = revisaoAutenticacao;
  const perfil = perfilInicial || await apiGet('/me/');
  if (revisao !== revisaoAutenticacao) return false;
  if (!perfil.cliente) {
    throw new Error('A API não retornou os dados do cliente autenticado.');
  }

  const resposta = await apiGet('/cliente/ordens/');
  if (revisao !== revisaoAutenticacao) return false;
  state.tecnico = null;
  state.tecnicos = [];
  state.os = [];
  state.servicos = [];
  state.selId = null;
  state.cliente = perfil.cliente;
  state.clienteOrdens = resposta.ordens.map(normalizarOrdem);
  state.clienteOrdemId = null;
  return true;
}

async function iniciarAplicacao() {
  const revisao = revisaoAutenticacao;
  try {
    const perfil = await apiGet('/me/');
    if (revisao !== revisaoAutenticacao) return;
    const carregou = perfil.perfil === 'cliente'
      ? await carregarDadosDoCliente(perfil)
      : await carregarDadosDoTecnico(perfil);
    if (!carregou || revisao !== revisaoAutenticacao) return;
    state.screen = perfil.perfil === 'cliente' ? 'clientePainel' : 'painel';
  } catch (erro) {
    if (revisao !== revisaoAutenticacao) return;
    if (erro.status === 401 || !state.tecnico) {
      state.tecnico = null;
      state.tecnicos = [];
      state.cliente = null;
      state.clienteOrdens = [];
      state.os = [];
      state.servicos = [];
      state.selId = null;
      state.screen = 'login';
    } else {
      state.screen = 'painel';
      state.apiError = erro.message;
    }
    if (erro.status !== 401 && !state.tecnico) {
      state.loginErr = `Não foi possível carregar os dados: ${erro.message}`;
    }
  }
  render();
}

render();
iniciarAplicacao();
