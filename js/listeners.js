/* ======================= Eventos do navegador =======================
   delegação de eventos*/

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el && !el.disabled && actions[el.dataset.action]) actions[el.dataset.action](el);
});

document.addEventListener('submit', e => {
  const formulario = e.target.dataset.form;
  const submitters = {
    login: () => actions.login(),
    'cliente-login': () => actions.loginCliente(),
    'cliente-cadastro': () => actions.cadastrarCliente()
  };
  if (!Object.prototype.hasOwnProperty.call(submitters, formulario)) return;
  e.preventDefault();
  submitters[formulario]();
});

/* Campos: guardam o valor no estado sem redesenhar (o cursor não pula) */
document.addEventListener('input', e => {
  const el = e.target, m = el.dataset.model, k = el.dataset.key;
  if (!m) return;
  const v = el.type === 'checkbox' ? el.checked : el.value;
  if (m === 'root') state[k] = v; else state[m][k] = v;

  /* Subtotal do orçamento ao vivo */
  if (el.dataset.liveOrc) {
    const f = state.orcForm, sub = document.getElementById('of-sub');
    if (sub) sub.textContent = brl(Math.max(1, Math.round(num(f.qtd))) * (num(f.peca) + num(f.mao)));
  }
  /* Busca ao vivo na lista de ordens */
  if (el.dataset.live && state.screen === 'ordens') {
    document.getElementById('ordens-tabela').innerHTML = tabelaOrdens(ordensFiltradas());
  }
});

/* Enter no formulário do orçamento adiciona o item */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.liveOrc) { e.preventDefault(); actions.addItem(); }
});

/* Selects que mudam outras partes da tela (ex.: horários livres) */
document.addEventListener('change', e => {
  const { model, key, rerender } = e.target.dataset;
  if (model && key && e.target.tagName === 'SELECT') {
    if (model === 'root') state[key] = e.target.value;
    else state[model][key] = e.target.value;
  }
  if (rerender) {
    if (model === 'form') state.formErr = '';
    if ((model === 'form' || model === 'portal') && key === 'data') {
      const horarios = horariosDisponiveis(e.target.value);
      if (!horarios.includes(state[model].hora)) {
        state[model].hora = horarios[0] || '';
      }
    }
    render();
  }
});
