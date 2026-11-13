/* ======================= Tela: Login ======================= */

function viewLogin() {
  return `<div class="field">
  <label for="lg-user">Usuário</label>
  <input id="lg-user" autocomplete="username">
</div>
<div class="field">
  <label for="lg-senha">Senha</label>
  <input id="lg-senha" type="password" autocomplete="current-password">
</div>

<button type="button" class="btn btn-primary btn-lg" data-action="login">
  Entrar
</button>
${state.loginErr
  ? `<div role="alert" class="alert alert-err">${esc(state.loginErr)}</div>`
  : ''}`;
}
