/* ======================= Tela: Login ======================= */

function viewLogin() {
  return `<main class="center">
    <section class="login" aria-labelledby="login-title">
      <div class="logo">TechManager</div>
      <div class="divider">Acesso do técnico</div>
      <h1 id="login-title" style="margin:0;text-align:center;font-size:20px">Entrar na sua conta</h1>
      <form class="login-form" data-form="login" novalidate>
        <div class="field">
          <label for="lg-user">Usuário</label>
          <input id="lg-user" name="username" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="lg-senha">Senha</label>
          <input id="lg-senha" name="password" type="password" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn btn-primary btn-lg"${state.loginLoading ? ' disabled aria-busy="true"' : ''}>
          ${state.loginLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <button type="button" class="btn btn-ghost" data-action="portal">
        Solicitar atendimento
      </button>
      ${state.loginErr
        ? `<div role="alert" class="alert alert-err">${esc(state.loginErr)}</div>`
        : ''}
    </section>
  </main>`;
}
