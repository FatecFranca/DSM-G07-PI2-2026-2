function go(screen, extra = {}) {
  Object.assign(state, { screen, flash: '' }, extra);
  render();
  window.scrollTo(0, 0);
}

async function salvarItensOrcamento(ordem, itens) {
  const caminho = `/os/${ordem.id}/orcamento/`;
  let orcamento;
  if (itens.length) {
    const resposta = await apiRequest(caminho, {
      method: 'PUT',
      body: {
        itens: itens.map(item => ({
          ...(item.idServico
            ? { id_servico: Number(item.idServico) }
            : { descricao_servico: item.desc }),
          quantidade: item.qtd,
          mao_de_obra: item.mao,
          custo_item: item.custo
        }))
      }
    });
    orcamento = resposta.orcamento;
    if (!orcamento) {
      throw new Error('O servidor não confirmou o orçamento salvo.');
    }
    if (typeof resposta.status !== 'string' || !resposta.status) {
      throw new Error('O servidor não retornou o status atualizado da ordem.');
    }
    
    ordem.status = resposta.status;
  } else {
    await apiRequest(caminho, { method: 'DELETE' });
    orcamento = null;
  }

  ordem.orc = orcamento?.status || 'Sem orçamento';
  ordem.itens = (orcamento?.itens || []).map(item => ({
    idServico: String(item.id_servico),
    desc: item.descricao,
    qtd: Number(item.quantidade),
    mao: Number(item.mao_de_obra),
    custo: Number(item.custo_item)
  }));
  ordem.servico = ordem.itens.map(item => item.desc).join(', ') || '—';
  state.os = state.os.map(item => item.id === ordem.id ? ordem : item);
  state.selId = ordem.id;
}

const actions = {
  go: el => go(el.dataset.to),
  portal: () => go('portal', {
    portal: emptyPortal(),
    portalDone: null,
    pErr: ''
  }),
  voltarPortal: async () => {
    if (state.cliente) {
      try {
        await carregarDadosDoCliente();
        state.apiError = '';
      } catch (erro) {
        state.apiError = `Não foi possível atualizar suas ordens: ${erro.message}`;
      }
      return go('clientePainel');
    }
    if (!state.tecnico) return go('login');
    try {
      await carregarDadosDoTecnico();
      state.apiError = '';
    } catch (erro) {
      state.apiError = `Não foi possível atualizar as ordens: ${erro.message}`;
    }
    go('painel');
  },
  nova: () => go('nova', { form: emptyForm(), formErr: '' }),
  open: el => go('detalhe', {
    selId: el.dataset.id,
    orcForm: emptyOrcForm(),
    orcErr: '',
    statusErr: ''
  }),
  abrirLoginCliente: () => {
    state.clienteLogin = { email: '', password: '' };
    state.clienteLoginErr = '';
    go('clienteLogin');
  },
  voltarLoginTecnico: () => {
    state.clienteLoginErr = '';
    go('login');
  },
  voltarLoginCliente: () => {
    state.clienteCadastroErr = '';
    go('clienteLogin');
  },
  abrirCadastroCliente: () => {
    state.clienteCadastro = emptyClienteCadastro();
    state.clienteCadastroErr = '';
    go('clienteCadastro');
  },
  abrirOrdemCliente: el => {
    state.clienteOrdemId = el.dataset.id;
    state.clienteActionErr = '';
    go('clienteOrdem');
  },
  voltarOrdensCliente: () => {
    state.clienteActionErr = '';
    go('clientePainel');
  },
  closeFlash: () => { state.flash = ''; render(); },

  dia: el => { state.agendaDay = el.dataset.d; render(); },
  novaSlot: el => go('nova', {
    form: { ...emptyForm(), data: state.agendaDay, hora: el.dataset.h },
    formErr: ''
  }),
  pickHora: el => { state.form.hora = el.dataset.h; state.formErr = ''; render(); },

  enviarPortal: async () => {
    const formulario = state.portal;
    const obrigatorios = state.cliente
      ? [formulario.equip, formulario.defeito, formulario.data, formulario.hora]
      : [
          formulario.nome, formulario.cpf, formulario.telefone, formulario.cep,
          formulario.numero, formulario.bairro, formulario.rua, formulario.cidade,
          formulario.estado, formulario.equip, formulario.defeito,
          formulario.data, formulario.hora
        ];
    if (!obrigatorios.every(valor => String(valor).trim())) {
      state.pErr = 'Preencha todos os campos obrigatórios.';
      return render();
    }

    const payload = {
      ...(!state.cliente ? {
        cliente: {
          nome_completo: formulario.nome.trim(),
          cpf: formulario.cpf.replace(/\D/g, ''),
          telefone: formulario.telefone.trim(),
          cep: formulario.cep.replace(/\D/g, ''),
          numero: formulario.numero.trim(),
          bairro: formulario.bairro.trim(),
          rua: formulario.rua.trim(),
          cidade: formulario.cidade.trim(),
          estado: formulario.estado.toUpperCase(),
          referencia: formulario.referencia.trim()
        }
      } : {}),
      aparelho: {
        numero_serie: formulario.numeroSerie.trim(),
        equipamento: formulario.equip.trim(),
        defeito: formulario.defeito.trim()
      },
      agendamento: {
        data: new Date(`${formulario.data}T${formulario.hora}:00`).toISOString(),
        buscar: formulario.buscar
      }
    };

    try {
      const caminho = state.cliente
        ? '/cliente/solicitacoes/'
        : '/portal/solicitacoes/';
      const resposta = await apiRequest(caminho, {
        method: 'POST',
        body: payload
      });
      state.portalDone = {
        numero: resposta.numero_os,
        data: formulario.data,
        hora: formulario.hora
      };
      state.portal = emptyPortal();
      state.pErr = '';
      render();
    } catch (erro) {
      state.pErr = erro.message;
      render();
    }
  },
  novaSolic: () => {
    state.portal = emptyPortal();
    state.portalDone = null;
    state.pErr = '';
    render();
  },

  criar: async () => {
    const f = state.form;
    const obrigatorios = [
      f.cliente, f.cpf, f.telefone, f.cep, f.numeroEndereco,
      f.bairro, f.rua, f.cidade, f.estado, f.equip, f.defeito,
      f.data, f.hora
    ];

    if (!obrigatorios.every(valor => String(valor).trim())) {
      state.formErr = 'Preencha os dados obrigatórios do cliente, aparelho e agendamento.';
      return render();
    }

    const payload = {
      cliente: {
        nome_completo: f.cliente.trim(),
        cpf: f.cpf.replace(/\D/g, ''),
        telefone: f.telefone.trim(),
        cep: f.cep.replace(/\D/g, ''),
        numero: f.numeroEndereco.trim(),
        bairro: f.bairro.trim(),
        rua: f.rua.trim(),
        cidade: f.cidade.trim(),
        estado: f.estado.toUpperCase(),
        referencia: f.referencia.trim()
      },
      aparelho: {
        numero_serie: f.numeroSerie.trim(),
        equipamento: f.equip.trim(),
        defeito: f.defeito.trim()
      },
      agendamento: {
        data: new Date(`${f.data}T${f.hora}:00`).toISOString(),
        buscar: f.buscar
      }
    };

    try {
      const criada = await apiRequest('/os/', {
        method: 'POST',
        body: payload
      });
      await carregarDadosDoTecnico();
      state.form = emptyForm();
      state.formErr = '';
      go('detalhe', { selId: String(criada.id) });
      state.flash = `OS ${criada.numero_os} registrada para ${criada.tecnico.nome}.`;
      render();
    } catch (erro) {
      state.formErr = erro.message;
      render();
    }
  },

  addItem: async () => {
    if (state.orcSaving) return;
    const ordem = sel();
    const formulario = state.orcForm;
    const descricao = formulario.descricao.trim();
    const quantidade = Number(formulario.qtd);
    const custo = moeda(formulario.peca);
    const mao = moeda(formulario.mao);

    if (!ordem) {
      state.orcErr = 'A ordem selecionada não está disponível.';
      return render();
    }
    if (!descricao) {
      state.orcErr = 'Informe o serviço que será realizado.';
      return render();
    }
    if (descricao.length > 150) {
      state.orcErr = 'A descrição do serviço pode ter no máximo 150 caracteres.';
      return render();
    }
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      state.orcErr = 'A quantidade deve ser um número inteiro maior que zero.';
      return render();
    }
    if (custo === null || mao === null) {
      state.orcErr = 'Informe valores monetários válidos, com no máximo duas casas decimais.';
      return render();
    }
    if (!formulario.peca.trim() && !formulario.mao.trim()) {
      state.orcErr = 'Informe o valor da peça, da mão de obra ou dos dois.';
      return render();
    }
    const descricaoNormalizada = descricao.toLocaleLowerCase('pt-BR');
    if (ordem.itens.some(item =>
      item.desc.trim().toLocaleLowerCase('pt-BR') === descricaoNormalizada
    )) {
      state.orcErr = 'Esse serviço já está no orçamento. Remova-o ou ajuste a quantidade.';
      return render();
    }

    state.orcSaving = true;
    state.orcErr = '';
    render();
    try {
      await salvarItensOrcamento(ordem, [
        ...ordem.itens,
        {
          desc: descricao,
          qtd: quantidade,
          mao,
          custo
        }
      ]);
      state.orcForm = emptyOrcForm();
      state.flash = 'Serviço lançado no orçamento da OS.';
    } catch (erro) {
      state.orcErr = erro.message;
    } finally {
      state.orcSaving = false;
      render();
    }
  },

  remover: async el => {
    if (state.orcSaving) return;
    const ordem = sel();
    if (!ordem) return;
    const indice = Number(el.dataset.idx);
    const itens = ordem.itens.filter((_, itemIndice) => itemIndice !== indice);

    state.orcSaving = true;
    try {
      await salvarItensOrcamento(ordem, itens);
      state.orcErr = '';
      state.flash = itens.length
        ? 'Item removido do orçamento.'
        : 'Orçamento removido do banco de dados.';
    } catch (erro) {
      state.orcErr = erro.message;
    } finally {
      state.orcSaving = false;
      render();
    }
  },

  responderOrcamentoCliente: async el => {
    if (state.clienteSaving) return;
    const ordem = state.clienteOrdens.find(item => item.id === state.clienteOrdemId);
    if (!ordem || ordem.orc !== 'Pendente' || !ordem.itens.length) return;
    const status = el.dataset.status;
    state.clienteSaving = true;
    state.clienteActionErr = '';
    render();
    try {
      const resposta = await apiRequest(`/cliente/os/${ordem.id}/orcamento/`, {
        method: 'POST',
        body: { status }
      });
      if (resposta.orcamento?.status !== status) {
        throw new Error('O servidor não confirmou sua resposta ao orçamento.');
      }
      ordem.orc = resposta.orcamento.status;
      ordem.status = resposta.status;
      state.flash = status === 'Aprovado'
        ? 'Orçamento aprovado. O técnico foi avisado.'
        : 'Orçamento rejeitado. O técnico poderá revisar a proposta.';
    } catch (erro) {
      state.clienteActionErr = erro.message;
    } finally {
      state.clienteSaving = false;
      render();
    }
  },

  salvarStatusOS: async () => {
    if (state.statusSaving) return;
    const ordem = sel();
    const novoStatus = document.getElementById('status-os')?.value;
    if (!ordem || !novoStatus) return;
    state.statusSaving = true;
    state.statusErr = '';
    render();
    try {
      const resposta = await apiRequest(`/os/${ordem.id}/status/`, {
        method: 'PATCH',
        body: { status: novoStatus }
      });
      ordem.status = resposta.status;
      state.flash = 'Andamento da ordem atualizado.';
    } catch (erro) {
      state.statusErr = erro.message;
    } finally {
      state.statusSaving = false;
      render();
    }
  },

  loginCliente: async () => {
    if (state.clienteLoading) return;
    const email = state.clienteLogin.email.trim();
    const password = state.clienteLogin.password;
    if (!email || !password) {
      state.clienteLoginErr = 'Informe seu e-mail e sua senha.';
      return render();
    }
    state.clienteLoading = true;
    state.clienteLoginErr = '';
    invalidarCarregamentosDeAutenticacao();
    render();
    try {
      const perfil = await apiRequest('/cliente/login/', {
        method: 'POST',
        body: { email, password }
      });
      const carregou = await carregarDadosDoCliente(perfil);
      if (!carregou) return;
      state.screen = 'clientePainel';
      state.clienteLogin = { email: '', password: '' };
      state.flash = '';
      state.apiError = '';
    } catch (erro) {
      state.clienteLogin.password = '';
      state.clienteLoginErr = erro.message;
    } finally {
      state.clienteLoading = false;
      render();
    }
  },

  cadastrarCliente: async () => {
    if (state.clienteLoading) return;
    const formulario = state.clienteCadastro;
    const obrigatorios = [
      formulario.nome_completo,
      formulario.cpf,
      formulario.telefone,
      formulario.cep,
      formulario.numero,
      formulario.bairro,
      formulario.rua,
      formulario.cidade,
      formulario.estado,
      formulario.email,
      formulario.password,
      formulario.password_confirm
    ];
    if (!obrigatorios.every(valor => String(valor).trim())) {
      state.clienteCadastroErr = 'Preencha todos os campos obrigatórios.';
      return render();
    }

    const cliente = {
      nome_completo: formulario.nome_completo.trim(),
      cpf: formulario.cpf.replace(/\D/g, ''),
      telefone: formulario.telefone.trim(),
      cep: formulario.cep.replace(/\D/g, ''),
      numero: formulario.numero.trim(),
      bairro: formulario.bairro.trim(),
      rua: formulario.rua.trim(),
      cidade: formulario.cidade.trim(),
      estado: formulario.estado.trim().toUpperCase(),
      referencia: formulario.referencia.trim()
    };
    state.clienteLoading = true;
    state.clienteCadastroErr = '';
    invalidarCarregamentosDeAutenticacao();
    render();
    try {
      const perfil = await apiRequest('/cliente/cadastro/', {
        method: 'POST',
        body: {
          email: formulario.email.trim(),
          password: formulario.password,
          password_confirm: formulario.password_confirm,
          cliente
        }
      });
      const carregou = await carregarDadosDoCliente(perfil);
      if (!carregou) return;
      state.clienteCadastro = emptyClienteCadastro();
      state.screen = 'clientePainel';
      state.flash = 'Conta criada com sucesso.';
      state.apiError = '';
    } catch (erro) {
      state.clienteCadastro.password = '';
      state.clienteCadastro.password_confirm = '';
      state.clienteCadastroErr = erro.message;
    } finally {
      state.clienteLoading = false;
      render();
    }
  },

  login: async () => {
    if (state.loginLoading) return;
    const username = document.getElementById('lg-user').value.trim();
    const password = document.getElementById('lg-senha').value;
    if (!username || !password) {
      state.loginErr = 'Informe o usuário e a senha para entrar.';
      render();
      return;
    }

    state.loginLoading = true;
    state.loginErr = '';
    invalidarCarregamentosDeAutenticacao();
    render();

    try {
      const perfil = await apiRequest('/login/', {
        method: 'POST',
        body: { username, password }
      });
      if (!perfil.tecnico) {
        throw new Error('O login não retornou o técnico associado à conta.');
      }

      state.tecnico = perfil.tecnico;
      state.cliente = null;
      state.clienteOrdens = [];
      state.tecnicos = [perfil.tecnico];
      state.loginErr = '';
      state.apiError = '';

      try {
        const carregou = await carregarDadosDoTecnico(perfil);
        if (!carregou) return;
        state.screen = 'painel';
        state.flash = `Login realizado como ${state.tecnico.nome}.`;
      } catch (erro) {
        if (erro.status === 401) {
          state.tecnico = null;
          state.tecnicos = [];
          state.os = [];
          state.servicos = [];
          state.selId = null;
          state.screen = 'login';
          state.loginErr = `A sessão não foi confirmada: ${erro.message}`;
        } else {
          state.screen = 'painel';
          state.apiError = `Login realizado, mas houve falha ao carregar os dados: ${erro.message}`;
        }
      }
    } catch (erro) {
      state.loginErr = erro.message;
    } finally {
      state.loginLoading = false;
      render();
    }
  },

  logout: async () => {
    invalidarCarregamentosDeAutenticacao();
    try {
      await apiRequest('/logout/', { method: 'POST' });
      state.tecnico = null;
      state.tecnicos = [];
      state.cliente = null;
      state.clienteOrdens = [];
      state.clienteOrdemId = null;
      state.os = [];
      state.servicos = [];
      state.selId = null;
      state.screen = 'login';
      state.loginErr = '';
      state.flash = '';
      render();
    } catch (erro) {
      state.apiError = `Não foi possível encerrar a sessão: ${erro.message}`;
      render();
    }
  }
};
