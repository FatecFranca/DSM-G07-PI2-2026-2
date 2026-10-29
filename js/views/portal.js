/* ======================= Tela: Portal do Cliente ======================= */

function viewPortal() {
  const d = state.portalDone;
  const body = d ? `
    <div class="card stack" style="border-radius:16px;padding:32px">
      <div style="display:flex;align-items:center;gap:12px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>
        <h1 style="margin:0;font-size:24px">Solicitação recebida</h1>
      </div>
      <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
        <div class="box"><span>Nº da OS</span><b class="mono" style="font-size:22px">${d.numero}</b></div>
        <div class="box"><span>Traga o aparelho em</span><b>${d.data} às ${d.hora}</b></div>
        <div class="box"><span>Diagnóstico com</span><b>${esc(d.tecnico)}</b></div>
      </div>
      <p style="margin:0;color:var(--muted)">Depois do diagnóstico você recebe o pré-orçamento com o valor e a data para realizar o serviço. O reparo só começa depois da sua aprovação.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-ghost" data-action="novaSolic">Nova solicitação</button>
        <button type="button" class="btn btn-primary" data-action="go" data-to="painel">Ver como equipe técnica</button>
      </div>
    </div>` : `
    <div class="card stack" style="border-radius:16px;padding:28px">
      <div><h1 style="margin:0 0 6px;font-size:24px">Solicitar atendimento e pré-orçamento</h1>
      <p style="margin:0;color:var(--muted)">Descreva o defeito e escolha o melhor horário para trazer o aparelho. Nesse horário fazemos o primeiro diagnóstico e depois enviamos o pré-orçamento com a data do serviço.</p></div>
      <div class="grid-auto">
        ${input('p-nome', 'Nome completo', 'portal', 'nome')}
        ${input('p-cpf', 'CPF', 'portal', 'cpf', 'placeholder="000.000.000-00"')}
        ${input('p-tel', 'Telefone', 'portal', 'tel', 'placeholder="(16) 90000-0000"')}
        ${input('p-equip', 'Equipamento', 'portal', 'equip', 'placeholder="Ex.: notebook, celular, desktop"')}
      </div>
      ${textarea('p-def', 'Descrição do defeito', 'portal', 'defeito', 'Ex.: liga mas não dá imagem, lentidão ao ligar…')}
      ${horariosPortal()}
      ${state.pErr ? `<div role="alert" class="alert alert-err">${esc(state.pErr)}</div>` : ''}
      <div style="display:flex;justify-content:flex-end"><button type="button" class="btn btn-primary btn-lg" data-action="enviarPortal">Enviar solicitação</button></div>
    </div>`;
  return `<div class="portal"><div class="portal-in">
    <div class="portal-head">
      <div class="mono" style="font-size:22px;font-weight:600">TechManager <span style="font-family:'IBM Plex Sans';font-size:14px;font-weight:500;color:var(--muted)">· Portal do Cliente</span></div>
      <button type="button" class="btn btn-ghost" data-action="go" data-to="login">Voltar ao login</button>
    </div>${body}</div></div>`;
}

/* O cliente vê os horários livres e escolhe quando trazer o aparelho */
function horariosPortal() {
  const p = state.portal;
  const livres = HORAS.filter(h => (p.data > TODAY || h > '13:30') && TECHS.some(t => !busy(t, p.data, h)));
  return `<div class="stack" style="gap:10px;padding:16px;border:1px solid var(--line);border-radius:10px;background:var(--field)">
    <span class="lbl" style="font-size:14px">Quando você pode trazer o aparelho para o diagnóstico?</span>
    <div class="slots">${DIAS.map(d => `<button type="button" class="chip${p.data === d ? ' on' : ''}" data-action="portalDia" data-d="${d}">${curto(d)}</button>`).join('')}</div>
    <span class="hint">Horários livres em ${curto(p.data)}:</span>
    <div class="slots">${livres.length ? livres.map(h => `<button type="button" class="chip${p.hora === h ? ' on' : ''}" data-action="portalHora" data-h="${h}">${h}</button>`).join('') : '<span style="font-size:14px;color:var(--danger)">Sem horários livres nesse dia. Escolha outro dia.</span>'}</div>
  </div>`;
}
