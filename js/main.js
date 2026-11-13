async function carregarDadosDoTecnico() {
  const perfil = await apiGet('/me/');
  const [respostaOs, respostaServicos] = await Promise.all([
    apiGet('/os/'),
    apiGet('/servicos/')
  ]);

  state.tecnico = perfil.tecnico;
  state.tecnicos = [perfil.tecnico];
  state.os = respostaOs.ordens.map(normalizarOrdem);
  state.servicos = respostaServicos.servicos;
  state.selId = state.os[0]?.id || null;
}

async function iniciarAplicacao() {
  try {
    await carregarDadosDoTecnico();
    state.screen = 'painel';
  } catch (erro) {
    state.tecnico = null;
    state.tecnicos = [];
    state.os = [];
    state.servicos = [];
    state.selId = null;
    state.screen = 'login';
    if (erro.status !== 401) {
      state.loginErr = `Não foi possível carregar os dados: ${erro.message}`;
    }
  }
  render();
}

render();
iniciarAplicacao();
