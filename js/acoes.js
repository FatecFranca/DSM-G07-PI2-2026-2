

function go(screen, extra = {}) { Object.assign(state, { screen, flash: '' }, extra); render(); window.scrollTo(0, 0); }

const actions = {
  /* ------- Navegação ------ */
  go: el => go(el.dataset.to),
  portal: () => go('portal', { portalDone: null, pErr: '' }),
  nova: () => go('nova', { form: emptyForm(), formErr: '' }),
  open: el => go('detalhe', { selId: el.dataset.id, showSenha: false, orcForm: emptyOrcForm(), orcErr: '', servDia: null }),
  closeFlash: () => { state.flash = ''; render(); },

  /* ----- Escolhas de tela (não gravam nada)---- */
  portalDia: el => { state.portal.data = el.dataset.d; state.portal.hora = ''; state.pErr = ''; render(); },
  portalHora: el => { state.portal.hora = el.dataset.h; state.pErr = ''; render(); },
  servDia: el => { state.servDia = el.dataset.d; render(); },
  filtro: el => { state.filtro = el.dataset.f; render(); },
  dia: el => { state.agendaDay = el.dataset.d; render(); },
  novaSlot: el => go('nova', { form: { ...emptyForm(), tecnico: el.dataset.t, data: state.agendaDay, hora: el.dataset.h }, formErr: '' }),
  pickHora: el => { state.form.hora = el.dataset.h; state.formErr = ''; render(); },
  toggleSenha: () => { state.showSenha = !state.showSenha; render(); },
  sugestao: el => { state.orcForm.desc = el.dataset.v; state.orcErr = ''; render(); document.getElementById('of-peca')?.focus(); },

  servHora: el => {
    const d = el.dataset.d, h = el.dataset.h;
    updateSel(o => ({ ...o, sData: d, sHora: h }));
    state.flash = `Serviço marcado para ${curto(d)} às ${h}.`; render();
  },

  criar: () => {
    const f = state.form;
    if (![f.cliente, f.cpf, f.equip, f.defeito].every(v => v.trim())) {
      state.formErr = 'Preencha cliente, CPF, equipamento e descrição do defeito: toda OS precisa de cliente, equipamento e técnico vinculados.';
      return render();
    }
    const c = busy(f.tecnico, f.data, f.hora);
    if (c) {
      state.formErr = `Conflito de horário: ${f.tecnico} já atende a OS ${c.numero} em ${fmt(f.data)} às ${f.hora}. Escolha um horário livre ou outro técnico.`;
      return render();
    }
    const numero = nextNum();
    const novo = { id: 'os' + numero, numero, cliente: f.cliente.trim(), cpf: f.cpf.trim(), equip: f.equip.trim(), servico: f.servico, defeito: f.defeito.trim(), senha: f.senha, tecnico: f.tecnico, data: f.data, hora: f.hora, sData: null, sHora: null, status: 'Aguardando triagem', orc: 'Sem orçamento', itens: [], origem: 'Balcão' };
    state.os.push(novo);
    go('detalhe', { selId: novo.id, form: emptyForm(), formErr: '', showSenha: false, orcForm: emptyOrcForm(), orcErr: '' });
    state.flash = `OS ${numero} registrada. Diagnóstico em ${fmt(f.data)} às ${f.hora} com ${f.tecnico}.`;
    render();
  },

  addItem: () => {
    const f = state.orcForm;
    const desc = f.desc.trim(), qtd = Number(f.qtd), custo = num(f.peca), mao = num(f.mao);
    if (!desc) { state.orcErr = 'Descreva o serviço que será feito.'; return render(); }
    if (!Number.isInteger(qtd) || qtd < 1) { state.orcErr = 'A quantidade deve ser um número inteiro maior que zero.'; return render(); }
    if (custo < 0 || mao < 0) { state.orcErr = 'Os valores não podem ser negativos.'; return render(); }
    if (custo + mao === 0) { state.orcErr = 'Informe o valor da peça, da mão de obra ou dos dois.'; return render(); }
    updateSel(o => ({ ...o, itens: [...o.itens, { desc, qtd, mao, custo }], orc: 'Pendente',
      status: o.status === 'Aguardando triagem' ? 'Aguardando aprovação' : o.status }));
    state.orcForm = emptyOrcForm(); state.orcErr = '';
    render();
    document.getElementById('of-desc')?.focus();
  },
  remover: el => {
    const idx = +el.dataset.idx;
    updateSel(o => { const itens = o.itens.filter((_, j) => j !== idx); return { ...o, itens, orc: itens.length ? 'Pendente' : 'Sem orçamento' }; });
    render();
  },

  aprovar: () => {
    updateSel(o => ({ ...o, orc: 'Aprovado', status: ['Aguardando aprovação', 'Aguardando triagem'].includes(o.status) ? 'Agendado' : o.status }));
    state.flash = `Pré-orçamento aprovado. Serviço agendado para ${curto(sel().sData)} às ${sel().sHora}.`; render();
  },
  recusar: () => { updateSel(o => ({ ...o, orc: 'Recusado' })); render(); },
  iniciar: () => { updateSel(o => ({ ...o, status: 'Em andamento' })); state.flash = 'Reparo iniciado.'; render(); },
  concluir: () => { updateSel(o => ({ ...o, status: 'Concluído' })); state.flash = 'Serviço confirmado e OS encerrada.'; render(); },
  cancelarOS: () => { updateSel(o => ({ ...o, status: 'Cancelado' })); state.flash = 'Serviço cancelado. O horário do técnico foi liberado.'; render(); },

  enviarPortal: () => {
    const p = state.portal;
    if (![p.nome, p.cpf, p.equip, p.defeito].every(v => v.trim())) { state.pErr = 'Preencha nome, CPF, equipamento e a descrição do defeito.'; return render(); }
    if (!p.hora) { state.pErr = 'Escolha o horário em que você vai trazer o aparelho.'; return render(); }
    const t = TECHS.find(tt => !busy(tt, p.data, p.hora));
    if (!t) {
      const alt = HORAS.filter(h => TECHS.some(tt => !busy(tt, p.data, h)));
      state.pErr = 'Nenhum técnico livre nesse horário. Horários com vaga nesse dia: ' + alt.join(', ') + '.';
      return render();
    }
    const numero = nextNum();
    state.os.push({ id: 'os' + numero, numero, cliente: p.nome.trim(), cpf: p.cpf.trim(), equip: p.equip.trim(), servico: 'Diagnóstico', defeito: p.defeito.trim(), senha: '', tecnico: t, data: p.data, hora: p.hora, sData: null, sHora: null, status: 'Aguardando triagem', orc: 'Sem orçamento', itens: [], origem: 'Portal' });
    state.portalDone = { numero, tecnico: t, data: fmt(p.data), hora: p.hora };
    state.portal = emptyPortal(); state.pErr = '';
    render();
  },
  novaSolic: () => { state.portalDone = null; state.pErr = ''; render(); }
};
