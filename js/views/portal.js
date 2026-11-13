function viewPortal() {
  const solicitacao = state.portalDone;
  const conteudo = solicitacao
    ? `<section class="card stack">
        <h1 style="margin:0;font-size:24px">Solicitação registrada</h1>
        <p style="margin:0;color:var(--muted)">Anote o número da ordem de serviço para consultar com a assistência.</p>
        <div class="grid-auto">
          <div class="box"><span>Número da OS</span><b class="mono">${esc(solicitacao.numero)}</b></div>
          <div class="box"><span>Agendamento solicitado</span><b>${fmt(solicitacao.data)} às ${esc(solicitacao.hora)}</b></div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button type="button" class="btn btn-ghost" data-action="novaSolic">Fazer outra solicitação</button>
          <button type="button" class="btn btn-primary" data-action="voltarPortal">Voltar</button>
        </div>
      </section>`
    : `<section class="card stack">
        <div>
          <h1 style="margin:0 0 6px;font-size:24px">Solicitar atendimento</h1>
          <p class="sub" style="margin:0">Preencha seus dados e escolha uma data para o primeiro atendimento. Os campos marcados são necessários para registrar a solicitação.</p>
        </div>
        <h2>Dados do cliente</h2>
        <div class="grid-auto">
          ${input('p-nome', 'Nome completo', 'portal', 'nome', 'maxlength="120" required')}
          ${input('p-cpf', 'CPF (11 dígitos)', 'portal', 'cpf', 'maxlength="14" placeholder="000.000.000-00" required')}
          ${input('p-telefone', 'Telefone', 'portal', 'telefone', 'maxlength="20" required')}
          ${input('p-cep', 'CEP (8 dígitos)', 'portal', 'cep', 'maxlength="9" placeholder="00000-000" required')}
          ${input('p-numero', 'Número do endereço', 'portal', 'numero', 'maxlength="10" required')}
          ${input('p-bairro', 'Bairro', 'portal', 'bairro', 'maxlength="80" required')}
          ${input('p-rua', 'Rua', 'portal', 'rua', 'maxlength="150" required')}
          ${input('p-cidade', 'Cidade', 'portal', 'cidade', 'maxlength="80" required')}
          ${input('p-estado', 'Estado (UF)', 'portal', 'estado', 'maxlength="2" required')}
          ${input('p-referencia', 'Referência (opcional)', 'portal', 'referencia', 'maxlength="150"')}
        </div>
        <h2>Dados do aparelho</h2>
        <div class="grid-auto">
          ${input('p-equipamento', 'Tipo de aparelho', 'portal', 'equip', 'required')}
          ${input('p-serie', 'Número de série (opcional)', 'portal', 'numeroSerie', 'maxlength="60"')}
        </div>
        ${textarea('p-defeito', 'Descrição do problema', 'portal', 'defeito', 'Descreva o problema relatado.')}
        <h2>Primeiro atendimento</h2>
        <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
          ${selectF('p-data', 'Data', 'portal', 'data', DIAS, curto)}
          ${selectF('p-hora', 'Horário', 'portal', 'hora', horariosDisponiveis(state.portal.data))}
        </div>
        <label style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" data-model="portal" data-key="buscar"${state.portal.buscar ? ' checked' : ''}>
          Será necessário buscar o aparelho?
        </label>
        ${state.pErr ? `<div role="alert" class="alert alert-err">${esc(state.pErr)}</div>` : ''}
        <div style="display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap">
          <button type="button" class="btn btn-ghost" data-action="voltarPortal">Voltar</button>
          <button type="button" class="btn btn-primary btn-lg" data-action="enviarPortal">Enviar solicitação</button>
        </div>
      </section>`;

  return `<main class="portal">
    <div class="portal-in">
      <header class="portal-head">
        <div class="mono" style="font-size:22px;font-weight:600">TechManager <span style="font-family:'IBM Plex Sans';font-size:14px;font-weight:500;color:var(--muted)">· Portal do Cliente</span></div>
      </header>
      ${conteudo}
    </div>
  </main>`;
}
