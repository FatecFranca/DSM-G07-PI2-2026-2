function go(screen, extra = {}) {
  Object.assign(state, { screen, flash: '' }, extra);
  render();
  window.scrollTo(0, 0);
}

async function salvarItensOrcamento(ordem, itens) {
  const caminho = `/os/${ordem.id}/orcamento/`;
  if (itens.length) {
    await apiRequest(caminho, {
      method: 'PUT',
      body: {
        itens: itens.map(item => ({
          id_servico: Number(item.idServico),
          quantidade: item.qtd,
          mao_de_obra: item.mao,
          custo_item: item.custo
        }))
      }
    });
  } else {
    await apiRequest(caminho, { method: 'DELETE' });
  }

  await carregarDadosDoTecnico();
  state.selId = ordem.id;
}

const actions = {
  go: el => go(el.dataset.to),
  nova: () => go('nova', { form: emptyForm(), formErr: '' }),
  open: el => go('detalhe', {
    selId: el.dataset.id,
    orcForm: emptyOrcForm(),
    orcErr: ''
  }),
  closeFlash: () => { state.flash = ''; render(); },

  dia: el => { state.agendaDay = el.dataset.d; render(); },
  novaSlot: el => go('nova', {
    form: { ...emptyForm(), data: state.agendaDay, hora: el.dataset.h },
    formErr: ''
  }),
  pickHora: el => { state.form.hora = el.dataset.h; state.formErr = ''; render(); },

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
    const ordem = sel();
    const formulario = state.orcForm;
    const servico = state.servicos.find(
      item => String(item.id_servico) === formulario.servicoId
    );
    const quantidade = Number(formulario.qtd);
    const custo = moeda(formulario.peca);
    const mao = moeda(formulario.mao);

    if (!ordem) {
      state.orcErr = 'A ordem selecionada não está disponível.';
      return render();
    }
    if (!servico) {
      state.orcErr = 'Selecione um serviço cadastrado no catálogo.';
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
    if (ordem.itens.some(item => item.idServico === formulario.servicoId)) {
      state.orcErr = 'Esse serviço já está no orçamento. Remova-o ou ajuste a quantidade.';
      return render();
    }

    try {
      await salvarItensOrcamento(ordem, [
        ...ordem.itens,
        {
          idServico: formulario.servicoId,
          qtd: quantidade,
          mao,
          custo
        }
      ]);
      state.orcForm = emptyOrcForm();
      state.orcErr = '';
      state.flash = 'Orçamento salvo no banco de dados.';
      render();
    } catch (erro) {
      state.orcErr = erro.message;
      render();
    }
  },

  remover: async el => {
    const ordem = sel();
    if (!ordem) return;
    const indice = Number(el.dataset.idx);
    const itens = ordem.itens.filter((_, itemIndice) => itemIndice !== indice);

    try {
      await salvarItensOrcamento(ordem, itens);
      state.orcErr = '';
      state.flash = itens.length
        ? 'Item removido do orçamento.'
        : 'Orçamento removido do banco de dados.';
      render();
    } catch (erro) {
      state.orcErr = erro.message;
      render();
    }
  },

  login: async () => {
    const username = document.getElementById('lg-user').value.trim();
    const password = document.getElementById('lg-senha').value;

    try {
      await apiRequest('/login/', {
        method: 'POST',
        body: { username, password }
      });
      await carregarDadosDoTecnico();
      state.loginErr = '';
      state.apiError = '';
      go('painel');
      state.flash = `Login realizado como ${state.tecnico.nome}.`;
      render();
    } catch (erro) {
      state.loginErr = erro.message;
      render();
    }
  },

  logout: async () => {
    try {
      await apiRequest('/logout/', { method: 'POST' });
      state.tecnico = null;
      state.tecnicos = [];
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
