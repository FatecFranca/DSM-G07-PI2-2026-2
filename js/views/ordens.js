function ordensFiltradas() {
  const consulta = state.query.trim().toLowerCase();
  return state.os.filter(ordem =>
    !consulta || [
      ordem.numero,
      ordem.cliente,
      ordem.equip,
      ordem.numeroSerie,
      ordem.defeito,
      ordem.servico
    ].join(' ').toLowerCase().includes(consulta)
  );
}

function viewOrdens() {
  const lista = ordensFiltradas();
  return `<section class="card stack">
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div style="flex:1 1 280px">
        <label for="q" class="sr">Buscar ordem</label>
        <input id="q" data-model="root" data-key="query" data-live="1" value="${esc(state.query)}" placeholder="Buscar por OS, cliente, aparelho ou serviço…">
      </div>
      <button type="button" class="btn btn-primary" data-action="nova">+ Nova O.S.</button>
    </div>
    <div class="scroll" id="ordens-tabela">${tabelaOrdens(lista)}</div>
  </section>`;
}

function tabelaOrdens(lista) {
  return `<div class="thead t-ordens">
      <span>OS</span><span>Cliente</span><span>Equipamento</span><span>Nº série</span>
      <span>Serviços</span><span>Agendamento</span><span>Orçamento</span><span>Total</span>
    </div>
    ${lista.map(ordem => `<button type="button" class="trow t-ordens" data-action="open" data-id="${ordem.id}">
      <span class="mono" style="font-weight:600">${esc(ordem.numero)}</span>
      <span>${esc(ordem.cliente)}</span>
      <span>${esc(ordem.equip)}</span>
      <span>${esc(ordem.numeroSerie || '—')}</span>
      <span>${esc(ordem.servico)}</span>
      <span style="font-size:13px">${ordem.data ? `${fmt(ordem.data)} ${ordem.hora}` : '—'}</span>
      <span>${pill(ordem.orc, ORC_CLASS[ordem.orc] || 's-triagem')}</span>
      <span style="font-weight:600">${brl(totalOf(ordem))}</span>
    </button>`).join('')}
    ${lista.length ? '' : '<p style="margin:0;padding:24px 4px;color:var(--muted);font-size:14px">Nenhuma OS encontrada.</p>'}`;
}
