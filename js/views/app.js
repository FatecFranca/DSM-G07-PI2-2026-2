/* ======================= Layout (menu lateral + topo) e render ======================= */

const VIEWS = { painel:viewPainel, ordens:viewOrdens, nova:viewNova, detalhe:viewDetalhe, agenda:viewAgenda };

function viewApp() {
  const sec = state.screen === 'nova' || state.screen === 'detalhe' ? 'ordens' : state.screen;
  const nav = [['painel','Painel'],['ordens','Ordens de Serviço'],['agenda','Agendamentos']]
    .map(([k, l]) => `<button type="button" class="nav-btn${sec === k ? ' on' : ''}" data-action="go" data-to="${k}">${l}</button>`).join('');
  return `<div class="shell">
    <nav class="sidebar" aria-label="Menu principal">
      <div class="brand"><i></i>TechManager</div>
      ${nav}
      <div style="height:12px"></div>
      <button type="button" class="btn btn-primary" data-action="nova">+ Nova O.S.</button>
      <button type="button" class="btn" style="background:transparent;border:1px solid #C3D6E8;color:var(--text);font-weight:500" data-action="portal">Abrir portal do cliente</button>
      <button type="button" class="nav-btn" data-action="go" data-to="login">Sair</button>
    </nav>
    <main class="content">
      <header class="topbar"><h1>${TITLES[state.screen]}</h1><div class="user"><div class="avatar">MM</div>Mateus Morgan · Atendente</div></header>
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
  app.innerHTML = state.screen === 'login' ? viewLogin() : state.screen === 'portal' ? viewPortal() : viewApp();
}
