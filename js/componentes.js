/* =================== Pedaços de HTML reutilizáveis ==================== */

const pill = (txt, cls) => `<span class="pill ${cls}">${esc(txt)}</span>`;
const opts = (list, val, labelFn = x => x) => list.map(v => `<option value="${esc(v)}"${v === val ? ' selected' : ''}>${esc(labelFn(v))}</option>`).join('');

/* Campos ligados ao estado: data-model = objeto do state, data-key = campo */
const input = (id, label, model, key, extra = '') =>
  `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-model="${model}" data-key="${key}" value="${esc(state[model][key])}" ${extra}></div>`;
const selectF = (id, label, model, key, list, labelFn) =>
  `<div class="field"><label for="${id}">${label}</label><select id="${id}" data-model="${model}" data-key="${key}" data-rerender="1">${opts(list, state[model][key], labelFn)}</select></div>`;
const textarea = (id, label, model, key, ph) =>
  `<div class="field"><label for="${id}">${label}</label><textarea id="${id}" rows="4" data-model="${model}" data-key="${key}" placeholder="${ph}">${esc(state[model][key])}</textarea></div>`;

/* Lista dos próximos 5 agendamentos (painel e tela de nova OS) */
function proximosList(clickable) {
  const list = eventos().filter(e => e.data >= TODAY)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).slice(0, 5);
  return list.map(e => {
    const o = e.o;
    const inner = `<span class="t"><b>${e.hora}</b><span>${curto(e.data)}</span></span>
      <span class="d"><b>${e.tipo} · ${esc(o.equip)}</b><span>${esc(o.cliente)} · ${esc(o.tecnico)}</span></span>`;
    return clickable ? `<button type="button" class="list-btn" data-action="open" data-id="${o.id}">${inner}</button>`
                     : `<div class="list-btn">${inner}</div>`;
  }).join('');
}
