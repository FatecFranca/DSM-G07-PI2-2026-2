/* ======================= Tela: Lista de Ordens de Serviço ======================= */

/* Filtra pela busca e pelo chip de status (usado na tela e na busca ao vivo) */
function ordensFiltradas() {
  const q = state.query.trim().toLowerCase();
  return state.os.filter(o =>
      (state.filtro === 'Todas' || o.status === state.filtro) &&
      (!q || (o.numero + ' ' + o.cliente + ' ' + o.equip).toLowerCase().includes(q)))
    .sort((a, b) => b.numero - a.numero);
}

function viewOrdens() {
  const lista = ordensFiltradas();
  const filtros = ['Todas', ...STATUSES].map(f => {
    const n = f === 'Todas' ? state.os.length : state.os.filter(o => o.status === f).length;
    return `<button type="button" class="chip${state.filtro === f ? ' on' : ''}" data-action="filtro" data-f="${f}">${f} · ${n}</button>`;
  }).join('');
  return `<section class="card stack">
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div style="flex:1 1 280px"><label for="q" class="sr">Buscar ordem</label><input id="q" data-model="root" data-key="query" data-live="1" value="${esc(state.query)}" placeholder="Buscar por nº da OS, cliente ou equipamento…"></div>
      <button type="button" class="btn btn-primary" data-action="nova">+ Nova O.S.</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${filtros}</div>
    <div class="scroll" id="ordens-tabela">${tabelaOrdens(lista)}</div>
  </section>`;
}

function tabelaOrdens(lista) {
  return `<div class="thead t-ordens"><span>OS</span><span>Cliente</span><span>Equipamento</span><span>Serviço</span><span>Técnico</span><span>Próxima data</span><span>Status</span><span>Orçamento</span></div>
    ${lista.map(o => `<button type="button" class="trow t-ordens" data-action="open" data-id="${o.id}"><span class="mono" style="font-weight:600">${o.numero}</span><span>${esc(o.cliente)}</span><span>${esc(o.equip)}</span><span>${esc(o.servico)}</span><span>${esc(o.tecnico)}</span><span style="font-size:13px">${o.sData ? 'Serviço ' + fmt(o.sData).slice(0, 5) + ' ' + o.sHora : 'Diag. ' + fmt(o.data).slice(0, 5) + ' ' + o.hora}</span><span>${badge(o)}</span><span style="font-weight:600">${brl(totalOf(o))}</span></button>`).join('')}
    ${lista.length ? '' : '<p style="margin:0;padding:24px 4px;color:var(--muted);font-size:14px">Nenhuma OS encontrada com esse filtro.</p>'}`;
}
