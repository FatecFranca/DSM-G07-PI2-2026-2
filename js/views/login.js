/* ======================= Tela: Login =======================
   Hoje o botão "Entrar" só troca de tela. Com o banco: POST /api/login (GUIA.md, passo 7). */

function viewLogin() {
  return `<div class="center"><div class="login">
    <div class="logo">TechManager</div>
    <h1 style="margin:0;text-align:center;font-size:20px;font-weight:600">Bem-vindo</h1>
    <div class="field"><label for="lg-email">E-mail</label><input id="lg-email" type="email" placeholder="seu.email@techmanager.com"></div>
    <div class="field"><label for="lg-senha">Senha</label><input id="lg-senha" type="password" placeholder="••••••••"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;font-size:14px">
      <label style="display:flex;align-items:center;gap:8px;color:var(--muted)"><input type="checkbox">Lembrar de mim</label>
      <a href="#" onclick="return false">Esqueceu a senha?</a>
    </div>
    <button type="button" class="btn btn-primary btn-lg" data-action="go" data-to="painel">Entrar</button>
    <div class="divider">ou</div>
    <button type="button" class="btn btn-ghost btn-lg" data-action="portal">Sou cliente: solicitar atendimento</button>
    <p style="margin:0;text-align:center;font-size:13px;color:var(--muted)">Não tem uma conta? <a href="#" onclick="return false">Solicite acesso ao administrador</a></p>
  </div></div>`;
}
