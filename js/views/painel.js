/* ======================= Tela: Painel de Controle ======================= */

function viewPainel() {
  const os = state.os, abertas = os.filter(o => !isClosed(o));
  const triagem = os.filter(o => o.status === 'Aguardando triagem');
  const kpis = [
    ['OS abertas', abertas.length, triagem.length + ' aguardando triagem', '#1D4ED8'],
    ['Agendamentos hoje', eventos().filter(e => e.data === TODAY).length, 'diagnósticos e serviços', '#EA580C'],
    ['Aguardando aprovação', os.filter(o => o.status === 'Aguardando aprovação').length, 'pré-orçamentos enviados', '#CA8A04'],
    ['Concluídas', os.filter(o => o.status === 'Concluído').length, 'total no período', '#15803D']
  ];
  const recentes = [...os].sort((a, b) => b.numero - a.numero).slice(0, 6);
  const solic = triagem.filter(o => o.origem === 'Portal');
  const counts = TECHS.map(t => abertas.filter(o => o.tecnico === t).length);
  const max = Math.max(1, ...counts);
  return `
  <div class="grid-auto">${kpis.map(k => `<div class="kpi"><div class="kpi-top">${k[0]}<i style="background:${k[3]}"></i></div><b>${k[1]}</b><small>${k[2]}</small></div>`).join('')}</div>
  <div class="row">
    <section class="card" style="flex:999 1 560px;min-width:0">
      <div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Ordens de Serviço recentes</h2><button type="button" class="btn-link" style="font-weight:600;font-size:14px" data-action="go" data-to="ordens">Ver todas</button></div>
      <div class="scroll"><div class="thead t-recent"><span>OS</span><span>Cliente</span><span>Equipamento</span><span>Serviço</span><span>Técnico</span><span>Status</span></div>
      ${recentes.map(o => `<button type="button" class="trow t-recent" data-action="open" data-id="${o.id}"><span class="mono" style="font-weight:600">${o.numero}</span><span>${esc(o.cliente)}</span><span>${esc(o.equip)}</span><span>${esc(o.servico)}</span><span>${esc(o.tecnico)}</span><span>${badge(o)}</span></button>`).join('')}</div>
    </section>
    <div class="side-col">
      ${solic.length ? `<section class="card"><h2 style="margin:0 0 4px">Solicitações do portal</h2><p class="sub" style="margin:0 0 12px;font-size:13px">Aguardando triagem e pré-orçamento</p>
        ${solic.map(o => `<button type="button" class="list-btn" style="justify-content:space-between;align-items:center" data-action="open" data-id="${o.id}"><span class="d"><b>${esc(o.cliente)} · ${esc(o.equip)}</b><span>OS ${o.numero} · ${fmt(o.data)} ${o.hora}</span></span><span style="font-size:13px;font-weight:600;color:var(--accent)">Triar</span></button>`).join('')}</section>` : ''}
      <section class="card"><h2>Próximos agendamentos</h2>${proximosList(true)}</section>
      <section class="card"><h2>OS abertas por técnico</h2><div class="stack" style="gap:12px">
        ${TECHS.map((t, i) => `<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:14px"><span>${t}</span><b>${counts[i]}</b></div><div class="bar"><i style="width:${Math.round(counts[i] / max * 100)}%"></i></div></div>`).join('')}
      </div></section>
    </div>
  </div>`;
}
