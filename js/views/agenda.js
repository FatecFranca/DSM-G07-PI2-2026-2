/* ======================= Tela: Agenda (técnicos × horários) ======================= */

function viewAgenda() {
  const day = state.agendaDay;
  const rows = HORAS.map(h => `<div class="ag-row"><span class="ag-h">${h}</span>${TECHS.map(t => {
    const e = slot(t, day, h), o = e && e.o;
    return o
      ? `<button type="button" class="cell ${STATUS_CLASS[o.status]}" data-action="open" data-id="${o.id}" aria-label="Abrir OS ${o.numero}"><b>${e.tipo} · OS ${o.numero}</b><span>${esc(o.cliente)} · ${esc(o.equip)}</span></button>`
      : `<button type="button" class="cell livre" data-action="novaSlot" data-t="${t}" data-h="${h}" aria-label="Nova OS com ${t} às ${h}"><b>Livre</b></button>`;
  }).join('')}</div>`).join('');
  return `<section class="card stack">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <h2 style="margin:0">Agenda de ${curto(day)}</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${DIAS.map(d => `<button type="button" class="chip${d === day ? ' on' : ''}" data-action="dia" data-d="${d}">${curto(d)}</button>`).join('')}</div>
    </div>
    <p style="margin:0;font-size:13px;color:var(--muted)">Mostra os diagnósticos (entrega do aparelho) e os serviços marcados no orçamento. Clique num horário livre para registrar uma OS com diagnóstico nesse horário. O sistema não permite dois atendimentos no mesmo horário para o mesmo técnico.</p>
    <div class="scroll"><div class="ag">
      <div class="ag-row ag-head"><span></span>${TECHS.map(t => `<span>${t}</span>`).join('')}</div>
      ${rows}
    </div></div>
  </section>`;
}
