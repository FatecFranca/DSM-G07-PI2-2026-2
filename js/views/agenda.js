function viewAgenda() {
  const dia = state.agendaDay;
  const tecnicos = tecnicosNomes();
  const linhas = HORAS.map(hora => `<div class="ag-row">
    <span class="ag-h">${hora}</span>
    ${tecnicos.map(tecnico => {
      const evento = slot(tecnico, dia, hora);
      const ordem = evento && evento.o;
      return ordem
        ? `<button type="button" class="cell ocupado" data-action="open" data-id="${ordem.id}" aria-label="Abrir OS ${esc(ordem.numero)}">
            <b>${esc(evento.tipo)} · OS ${esc(ordem.numero)}</b>
            <span>${esc(ordem.cliente)} · ${esc(ordem.equip)}</span>
          </button>`
        : `<button type="button" class="cell livre" data-action="novaSlot" data-h="${hora}" aria-label="Criar OS às ${hora}">
            <b>Livre</b>
          </button>`;
    }).join('')}
  </div>`).join('');

  return `<section class="card stack">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <h2 style="margin:0">Agenda de ${curto(dia)}</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${DIAS.map(data => `<button type="button" class="chip${data === dia ? ' on' : ''}" data-action="dia" data-d="${data}">${curto(data)}</button>`).join('')}</div>
    </div>
    <p style="margin:0;font-size:13px;color:var(--muted)">A agenda mostra somente os horários registrados no banco. Clique em um horário livre para iniciar o cadastro de uma OS com esse agendamento.</p>
    ${tecnicos.length ? `<div class="scroll"><div class="ag">
      <div class="ag-row ag-head"><span></span>${tecnicos.map(tecnico => `<span>${esc(tecnico)}</span>`).join('')}</div>
      ${linhas}
    </div></div>` : '<p class="sub">Faça login como técnico para ver a agenda.</p>'}
  </section>`;
}
