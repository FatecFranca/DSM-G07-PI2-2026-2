function viewPainel() {
  const os = state.os;
  const agendamentosHoje = eventos().filter(evento => evento.data === TODAY).length;
  const orcamentosPendentes = os.filter(ordem => ordem.orc === 'Pendente').length;
  const totalOrcado = os.reduce((total, ordem) => total + totalOf(ordem), 0);
  const kpis = [
    ['Ordens atribuídas', os.length, 'ordens do técnico autenticado', '#1D4ED8'],
    ['Agendamentos hoje', agendamentosHoje, 'registros no banco', '#EA580C'],
    ['Orçamentos pendentes', orcamentosPendentes, 'aguardando resposta externa', '#CA8A04'],
    ['Total orçado', brl(totalOrcado), 'soma dos itens registrados', '#15803D']
  ];
  const recentes = os.slice(0, 6);

  return `
  <div class="grid-auto">${kpis.map(k => `<div class="kpi"><div class="kpi-top">${k[0]}<i style="background:${k[3]}"></i></div><b>${k[1]}</b><small>${k[2]}</small></div>`).join('')}</div>
  <div class="row">
    <section class="card" style="flex:999 1 560px;min-width:0">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="margin:0">Ordens de Serviço recentes</h2>
        <button type="button" class="btn-link" style="font-weight:600;font-size:14px" data-action="go" data-to="ordens">Ver todas</button>
      </div>
      ${recentes.length ? `<div class="scroll"><div class="thead t-recent"><span>OS</span><span>Cliente</span><span>Equipamento</span><span>Serviços</span><span>Agendamento</span><span>Orçamento</span></div>
      ${recentes.map(ordem => `<button type="button" class="trow t-recent" data-action="open" data-id="${ordem.id}">
        <span class="mono" style="font-weight:600">${esc(ordem.numero)}</span>
        <span>${esc(ordem.cliente)}</span>
        <span>${esc(ordem.equip)}</span>
        <span>${esc(ordem.servico)}</span>
        <span>${ordem.data ? `${fmt(ordem.data)} ${ordem.hora}` : 'Sem agendamento'}</span>
        <span>${pill(ordem.orc, ORC_CLASS[ordem.orc] || 's-triagem')}</span>
      </button>`).join('')}</div>` : '<p class="sub">Nenhuma ordem de serviço foi atribuída à sua conta.</p>'}
    </section>
    <div class="side-col">
      <section class="card"><h2>Próximos agendamentos</h2>${proximosList(true) || '<p class="sub">Não há agendamentos futuros.</p>'}</section>
    </div>
  </div>`;
}
