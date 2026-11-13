/* ======================= Tela: Nova Ordem de Serviço ======================= */

function viewNova() {
  const f = state.form;
  const livres = HORAS.filter(h => !busy(f.tecnico, f.data, h));
  const nomesTecnicos = state.tecnicos.map(tecnico => tecnico.nome);
  return `<div class="row">
    <section class="card stack" style="flex:999 1 520px;min-width:0;padding:24px">
      <h2 style="margin:0;font-size:18px">Registro de O.S.</h2>
      ${state.apiError ? `<div role="alert" class="alert alert-err">${esc(state.apiError)}</div>` : ''}
      <div class="grid-auto">
        ${input('n-cli', 'Nome do cliente', 'form', 'cliente')}
        ${input('n-cpf', 'CPF do proprietário', 'form', 'cpf', 'placeholder="000.000.000-00"')}
        ${input('n-eq', 'Equipamento', 'form', 'equip', 'placeholder="Ex.: celular, tablet, notebook, desktop…"')}
        ${selectF('n-sv', 'Serviço', 'form', 'servico', SERVICOS)}
      </div>
      ${textarea('n-def', 'Descrição do defeito', 'form', 'defeito', 'Ex.: liga mas não dá imagem, lentidão ao ligar…')}
      <div class="field" style="max-width:320px"><label for="n-pw">Senha do dispositivo</label><input id="n-pw" type="password" data-model="form" data-key="senha" value="${esc(f.senha)}"><span class="hint">Fica oculta na OS e só é exibida ao técnico (LGPD).</span></div>
      <div class="stack" style="border-top:1px solid var(--line);padding-top:16px;gap:14px">
        <h3 style="margin:0;font-size:15px">Entrega do aparelho para diagnóstico</h3>
        <p class="hint" style="margin:0;font-size:13px">A data para realizar o serviço é definida depois, no pré-orçamento.</p>
        <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
          ${selectF('n-tec', 'Técnico', 'form', 'tecnico', nomesTecnicos)}
          ${selectF('n-dt', 'Data', 'form', 'data', DIAS, curto)}
          ${selectF('n-hr', 'Horário', 'form', 'hora', HORAS)}
        </div>
        <div class="field"><span class="lbl">Horários livres de ${esc(f.tecnico)} nesse dia</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${livres.map(h => `<button type="button" class="chip${f.hora === h ? ' on' : ''}" data-action="pickHora" data-h="${h}">${h}</button>`).join('')}
            ${livres.length ? '' : '<span style="font-size:14px;color:var(--danger)">Agenda cheia nesse dia. Escolha outra data ou técnico.</span>'}
          </div></div>
      </div>
      ${state.formErr ? `<div role="alert" class="alert alert-err">${esc(state.formErr)}</div>` : ''}
      <div style="display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-ghost btn-lg" data-action="go" data-to="ordens">Cancelar</button>
        <button type="button" class="btn btn-primary btn-lg" data-action="criar">Registrar serviço</button>
      </div>
      <p class="hint" style="margin:0;font-size:13px">O nº da OS é gerado automaticamente ao registrar.</p>
    </section>
    <aside class="card" style="flex:1 1 280px;min-width:0"><h2>Próximos agendamentos</h2>${proximosList(false)}</aside>
  </div>`;
}
