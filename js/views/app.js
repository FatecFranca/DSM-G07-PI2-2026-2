/* ======================= Layout (menu lateral + topo) e render ======================= */

const VIEWS = { painel:viewPainel, ordens:viewOrdens, nova:viewNova, detalhe:viewDetalhe, agenda:viewAgenda };

function viewApp() {
  const sec = state.screen === 'nova' || state.screen === 'detalhe' ? 'ordens' : state.screen;
  const nav = [['painel','Painel'],['ordens','Ordens de Serviço'],['agenda','Agendamentos']]
    .map(([k, l]) => `<button type="button" class="nav-btn${sec === k ? ' on' : ''}"${sec === k ? ' aria-current="page"' : ''} data-action="go" data-to="${k}">${l}</button>`).join('');
  return `<div class="shell">
    <nav class="sidebar" aria-label="Menu principal">
      <div class="brand"><i></i>TechManager</div>
      ${nav}
      <div class="nav-spacer" aria-hidden="true"></div>
      <button type="button" class="btn btn-primary" data-action="nova">+ Nova O.S.</button>
      <button type="button" class="nav-btn" data-action="portal">Portal do cliente</button>
      <button type="button" class="nav-btn" data-action="logout">Sair</button>
    </nav>
    <main class="content">
      <header class="topbar"><h1>${TITLES[state.screen]}</h1><div class="user"><div class="avatar">${esc((state.tecnico?.nome || 'T').slice(0, 2).toUpperCase())}</div>${esc(state.tecnico?.nome || 'Técnico')}</div></header>
      <div class="page">
        ${state.flash ? `<div role="status" class="alert-ok"><span>${esc(state.flash)}</span><button type="button" aria-label="Fechar aviso" data-action="closeFlash" style="min-width:36px;min-height:36px;border:0;background:transparent;color:#065F46;font-size:18px">×</button></div>` : ''}
        ${state.apiError ? `<div role="alert" class="alert alert-err">${esc(state.apiError)}</div>` : ''}
        ${VIEWS[state.screen]()}
      </div>
    </main>
  </div>`;
}

/* Redesenha a tela inteira a partir do state */
function render() {
  const app = document.getElementById('app');
  const viewsCliente = {
    clienteLogin: viewClienteLogin,
    clienteCadastro: viewClienteCadastro,
    clientePainel: viewClientePainel,
    clienteOrdem: viewClienteOrdem
  };
  app.innerHTML = state.screen === 'login'
    ? viewLogin()
    : state.screen === 'portal'
      ? viewPortal()
      : viewsCliente[state.screen]
        ? viewsCliente[state.screen]()
        : viewApp();
}
