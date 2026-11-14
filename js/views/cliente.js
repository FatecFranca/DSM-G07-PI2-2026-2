function viewClienteLogin() {
  return `<main class="center">
    <section class="login stack" aria-labelledby="cliente-login-title">
      <div class="logo">TechManager</div>
      <div class="divider">Acesso do cliente</div>
      <h1 id="cliente-login-title" style="margin:0;text-align:center;font-size:20px">Acompanhe seu atendimento</h1>
      <form class="login-form" method="post" data-form="cliente-login" novalidate>
        <div class="field">
          <label for="cliente-email">E-mail</label>
          <input id="cliente-email" type="email" autocomplete="email" data-model="clienteLogin" data-key="email" value="${esc(state.clienteLogin?.email || '')}" required>
        </div>
        <div class="field">
          <label for="cliente-senha">Senha</label>
          <input id="cliente-senha" type="password" autocomplete="current-password" data-model="clienteLogin" data-key="password" value="${esc(state.clienteLogin?.password || '')}" required>
        </div>
        <button type="submit" class="btn btn-primary btn-lg"${state.clienteLoading ? ' disabled aria-busy="true"' : ''}>
          ${state.clienteLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      ${state.clienteLoginErr ? `<div role="alert" class="alert alert-err">${esc(state.clienteLoginErr)}</div>` : ''}
      <button type="button" class="btn btn-ghost" data-action="abrirCadastroCliente">Criar conta de cliente</button>
      <button type="button" class="btn btn-ghost" data-action="voltarLoginTecnico">Voltar ao acesso do técnico</button>
    </section>
  </main>`;
}

function viewClienteCadastro() {
  const c = state.clienteCadastro;
  return `<main class="portal">
    <div class="portal-in">
      <header class="portal-head">
        <div class="mono" style="font-size:22px;font-weight:600">TechManager · Cadastro do Cliente</div>
        <button type="button" class="btn btn-ghost" data-action="voltarLoginCliente">Já tenho conta</button>
      </header>
      <form class="card stack" method="post" data-form="cliente-cadastro" novalidate>
        <div>
          <h1 style="margin:0 0 6px;font-size:24px">Criar conta</h1>
          <p class="sub" style="margin:0">Use seus dados para acompanhar ordens e responder aos orçamentos.</p>
        </div>
        <h2>Dados de acesso</h2>
        <div class="grid-auto">
          ${input('cad-email', 'E-mail', 'clienteCadastro', 'email', 'type="email" autocomplete="email" maxlength="150" required')}
          ${input('cad-senha', 'Senha', 'clienteCadastro', 'password', 'type="password" autocomplete="new-password" required')}
          ${input('cad-senha-confirma', 'Confirme a senha', 'clienteCadastro', 'password_confirm', 'type="password" autocomplete="new-password" required')}
        </div>
        <h2>Dados do cliente</h2>
        <div class="grid-auto">
          ${input('cad-nome', 'Nome completo', 'clienteCadastro', 'nome_completo', 'maxlength="120" autocomplete="name" required')}
          ${input('cad-cpf', 'CPF (11 dígitos)', 'clienteCadastro', 'cpf', 'maxlength="14" placeholder="000.000.000-00" required')}
          ${input('cad-telefone', 'Telefone', 'clienteCadastro', 'telefone', 'maxlength="20" autocomplete="tel" required')}
          ${input('cad-cep', 'CEP', 'clienteCadastro', 'cep', 'maxlength="9" placeholder="00000-000" required')}
          ${input('cad-numero', 'Número do endereço', 'clienteCadastro', 'numero', 'maxlength="10" required')}
          ${input('cad-bairro', 'Bairro', 'clienteCadastro', 'bairro', 'maxlength="80" required')}
          ${input('cad-rua', 'Rua', 'clienteCadastro', 'rua', 'maxlength="150" required')}
          ${input('cad-cidade', 'Cidade', 'clienteCadastro', 'cidade', 'maxlength="80" required')}
          ${input('cad-estado', 'Estado (UF)', 'clienteCadastro', 'estado', 'maxlength="2" required')}
          ${input('cad-referencia', 'Referência (opcional)', 'clienteCadastro', 'referencia', 'maxlength="150"')}
        </div>
        ${state.clienteCadastroErr ? `<div role="alert" class="alert alert-err">${esc(state.clienteCadastroErr)}</div>` : ''}
        <div style="display:flex;justify-content:flex-end">
          <button type="submit" class="btn btn-primary btn-lg"${state.clienteLoading ? ' disabled aria-busy="true"' : ''}>
            ${state.clienteLoading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>
        <p class="hint" style="margin:0">Se você já tem cadastro na assistência, peça ao técnico para vincular sua conta.</p>
      </form>
    </div>
  </main>`;
}

function viewClientePainel() {
  const ordens = state.clienteOrdens;
  return `<main class="portal">
    <div class="portal-in">
      <header class="portal-head">
        <div>
          <div class="mono" style="font-size:22px;font-weight:600">TechManager · Área do Cliente</div>
          <div class="sub">${esc(state.cliente?.nome || '')} · ${esc(state.cliente?.email || '')}</div>
        </div>
        <button type="button" class="btn btn-ghost" data-action="logout">Sair</button>
      </header>
      <section class="card stack">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <div><h1 style="margin:0 0 6px;font-size:24px">Minhas ordens</h1><p class="sub" style="margin:0">Acompanhe o andamento e responda aos orçamentos.</p></div>
          <button type="button" class="btn btn-primary" data-action="portal">Solicitar atendimento</button>
        </div>
        ${ordens.length ? ordens.map(ordem => `<button type="button" class="list-btn" data-action="abrirOrdemCliente" data-id="${esc(ordem.id)}">
          <span class="d">
            <b>OS ${esc(ordem.numero)} · ${esc(ordem.equip || 'Equipamento')}</b>
            <span>${esc(ordem.tecnico || 'Técnico')} · ${ordem.data ? `${fmt(ordem.data)} às ${esc(ordem.hora)}` : 'Sem agendamento'}</span>
          </span>
          <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            ${pill(ordem.status, STATUS_CLASS[ordem.status] || 's-triagem')}
            ${pill(ordem.orc, ORC_CLASS[ordem.orc] || 's-triagem')}
          </span>
        </button>`).join('') : '<p class="sub">Você ainda não possui ordens vinculadas à sua conta.</p>'}
      </section>
    </div>
  </main>`;
}

function viewClienteOrdem() {
  const ordem = state.clienteOrdens.find(item => item.id === state.clienteOrdemId);
  if (!ordem) {
    return `<main class="portal"><div class="portal-in"><section class="card">
      <p class="sub">Esta ordem não está disponível na sua conta.</p>
      <button type="button" class="btn btn-ghost" data-action="voltarOrdensCliente">Voltar às minhas ordens</button>
    </section></div></main>`;
  }

  const podeResponder = ordem.orc === 'Pendente' && ordem.itens.length > 0;
  const agendamentos = ordem.agendamentos.length
    ? ordem.agendamentos.map(agendamento => `<div class="ref">
        <b>${fmt(agendamento.data)} às ${esc(agendamento.hora)}</b>
        ${agendamento.status ? ` · ${esc(agendamento.status)}` : ''}
        · ${agendamento.buscar ? 'a assistência buscará o aparelho' : 'você levará o aparelho'}
      </div>`).join('')
    : '<p class="sub">Nenhum agendamento disponível.</p>';

  return `<main class="portal">
    <div class="portal-in">
      <header class="portal-head">
        <button type="button" class="btn btn-ghost" data-action="voltarOrdensCliente">← Minhas ordens</button>
        <button type="button" class="btn btn-ghost" data-action="logout">Sair</button>
      </header>
      <div class="row">
        <div class="main-col">
          <section class="card stack">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
              <h1 style="margin:0;font-size:24px">OS ${esc(ordem.numero)}</h1>
              ${pill(ordem.status, STATUS_CLASS[ordem.status] || 's-triagem')}
            </div>
            <div class="info">
              <div><span>Equipamento</span><b>${esc(ordem.equip || '—')}</b></div>
              <div><span>Técnico responsável</span><b>${esc(ordem.tecnico || '—')}</b></div>
              <div><span>Número de série</span><b>${esc(ordem.numeroSerie || '—')}</b></div>
              <div><span>Andamento do conserto</span><b>${esc(ordem.status)}</b></div>
            </div>
            <div><span class="lbl">Problema relatado</span><p class="defeito">${esc(ordem.defeito || '—')}</p></div>
          </section>
          <section class="card stack"><h2 style="margin:0">Agendamentos</h2>${agendamentos}</section>
          <section class="card stack">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
              <h2 style="margin:0">Orçamento</h2>
              ${pill(ordem.orc, ORC_CLASS[ordem.orc] || 's-triagem')}
            </div>
            ${ordem.itens.length ? `<div class="stack">
              ${ordem.itens.map(item => `<div class="ref">
                <b>${esc(item.desc)} · ${item.qtd} un.</b>
                <span>Peças ${brl(item.custo)} · Mão de obra ${brl(item.mao)} · Subtotal ${brl(item.qtd * (item.mao + item.custo))}</span>
              </div>`).join('')}
              <div style="display:flex;justify-content:flex-end;gap:12px;font-size:16px"><span>Total</span><b>${brl(totalOf(ordem))}</b></div>
            </div>` : '<p class="sub">O orçamento ainda não foi disponibilizado.</p>'}
            ${podeResponder ? `<p class="hint">Revise os serviços e valores antes de responder.</p>
              <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
                <button type="button" class="btn btn-danger" data-action="responderOrcamentoCliente" data-status="Recusado"${state.clienteSaving ? ' disabled' : ''}>Rejeitar orçamento</button>
                <button type="button" class="btn btn-ok" data-action="responderOrcamentoCliente" data-status="Aprovado"${state.clienteSaving ? ' disabled' : ''}>${state.clienteSaving ? 'Enviando...' : 'Aprovar orçamento'}</button>
              </div>` : ''}
            ${state.clienteActionErr ? `<div role="alert" class="alert alert-err">${esc(state.clienteActionErr)}</div>` : ''}
          </section>
        </div>
      </div>
    </div>
  </main>`;
}
