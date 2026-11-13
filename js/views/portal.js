function viewPortal() {
  return `<div class="portal">
    <div class="portal-in">
      <div class="portal-head">
        <div class="mono" style="font-size:22px;font-weight:600">TechManager</div>
        <button type="button" class="btn btn-ghost" data-action="go" data-to="login">Voltar ao login</button>
      </div>
      <section class="card stack">
        <h1 style="margin:0;font-size:24px">Portal do cliente indisponível</h1>
        <p style="margin:0;color:var(--muted)">Este fluxo ainda não está conectado ao backend. Nenhuma solicitação foi enviada ou gravada.</p>
      </section>
    </div>
  </div>`;
}
