/* ======================= Tela: Detalhe da OS (+ pré-orçamento) ======================= */

function viewDetalhe() {
  const o = sel(), closed = isClosed(o);
  const canEditOrc = !closed && o.orc !== 'Aprovado';
  const stage = o.status === 'Concluído' ? 5 : o.status === 'Em andamento' ? 4 : o.orc === 'Aprovado' ? 3 : (o.orc === 'Pendente' || o.orc === 'Recusado') ? 2 : 1;
  const etapas = ['Solicitação','Pré-orçamento','Aprovação','Execução','Encerramento'].map((l, i) => {
    const cls = i < stage ? 'done' : (i === stage && !closed) ? 'cur' : '';
    const label = o.status === 'Cancelado' && i === stage ? l + ' · cancelada' : l;
    return `<div class="step ${cls}"><i></i>${label}</div>`;
  }).join('');
  const showIniciar = !closed && o.status !== 'Em andamento';
  const bloqueado = o.orc !== 'Aprovado';
  const bloqueio = showIniciar && bloqueado ? (o.orc === 'Recusado'
    ? 'O cliente recusou o orçamento. Ajuste os itens e reenvie, ou cancele o serviço.'
    : 'O reparo só pode começar depois que o cliente aprovar o pré-orçamento.') : '';
  const senha = o.senha ? (state.showSenha ? esc(o.senha) : '••••••') : 'não informada';

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <button type="button" class="btn btn-ghost" style="min-height:40px" data-action="go" data-to="ordens">← Voltar às ordens</button>
    <div style="display:flex;align-items:center;gap:12px"><span class="mono" style="font-size:22px;font-weight:600">OS ${o.numero}</span>${badge(o)}</div>
  </div>
  <div class="card steps" style="padding:18px 20px">${etapas}</div>
  <div class="row">
    <div class="main-col">
      <section class="card stack">
        <h2 style="margin:0">Registro</h2>
        <div class="info">
          <div><span>Cliente</span><b>${esc(o.cliente)}</b></div>
          <div><span>CPF</span><b>${esc(o.cpf)}</b></div>
          <div><span>Equipamento</span><b>${esc(o.equip)}</b></div>
          <div><span>Senha do dispositivo</span><div style="display:flex;align-items:center;gap:8px"><span class="mono" style="font-size:15px">${senha}</span>${o.senha ? `<button type="button" class="btn-link" style="font-size:13px;font-weight:600" data-action="toggleSenha">${state.showSenha ? 'Ocultar' : 'Mostrar'}</button>` : ''}</div></div>
          <div><span>Origem</span><b>${o.origem === 'Portal' ? 'Portal do cliente' : 'Balcão'}</b></div>
        </div>
        <div><span class="lbl" style="display:block;margin-bottom:6px;font-size:12px;color:var(--muted)">Descrição do defeito</span><p class="defeito">${esc(o.defeito)}</p></div>
        <div class="info" style="padding-top:14px;border-top:1px solid var(--line)">
          <div><span>Serviço</span><b>${esc(o.servico)}</b></div>
          <div><span>Diagnóstico (entrega do aparelho)</span><b>${fmt(o.data)} às ${o.hora}</b></div>
          <div><span>Execução do serviço</span><b>${o.sData ? fmt(o.sData) + ' às ' + o.sHora : 'Definida no pré-orçamento'}</b></div>
          <div><span>Técnico</span><b>${esc(o.tecnico)}</b></div>
        </div>
      </section>

      <section class="card stack" style="gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="margin:0">Pré-orçamento</h2>${pill(o.orc, ORC_CLASS[o.orc])}</div>
        ${o.itens.length ? `<div class="scroll">
          <div class="thead t-orc"><span>Serviço</span><span>Qtd</span><span>Peça</span><span>Mão de obra</span><span>Subtotal</span><span></span></div>
          ${o.itens.map((i, idx) => `<div class="trow t-orc" style="padding:8px 0"><span>${esc(i.desc)}</span><span>${i.qtd}</span><span>${i.custo ? brl(i.custo) : '—'}</span><span>${i.mao ? brl(i.mao) : '—'}</span><b>${brl(i.qtd * (i.mao + i.custo))}</b><span>${canEditOrc ? `<button type="button" class="icon-x" aria-label="Remover item" data-action="remover" data-idx="${idx}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : ''}</span></div>`).join('')}
          <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:10px;font-size:16px;min-width:560px"><span style="color:var(--muted)">Total</span><b>${brl(totalOf(o))}</b></div>
        </div>` : '<p style="margin:0;font-size:14px;color:var(--muted)">Nenhum serviço ainda. Descreva abaixo o que será feito e quanto custa.</p>'}
        ${canEditOrc ? formOrcamento(o) + agendaServico(o) : (o.sData ? `<div class="ref"><b>Data para realizar o serviço</b>${curto(o.sData)} às ${o.sHora} · ${esc(o.tecnico)}</div>` : '')}
        ${o.orc === 'Pendente' && o.itens.length && !o.sData && !closed ? '<p class="hint" style="margin:0;font-size:13px">Escolha a data para realizar o serviço para liberar a resposta do cliente.</p>' : ''}
        ${o.orc === 'Pendente' && o.itens.length && o.sData && !closed ? `<div class="decisao"><span>Resposta do cliente ao pré-orçamento de ${brl(totalOf(o))}, serviço em ${curto(o.sData)} às ${o.sHora} (simulação):</span>
          <div style="display:flex;gap:8px"><button type="button" class="btn btn-danger" style="min-height:40px" data-action="recusar">Recusar</button><button type="button" class="btn btn-ok" style="min-height:40px" data-action="aprovar">Aprovar</button></div></div>` : ''}
      </section>
    </div>

    <aside class="card stack" style="flex:1 1 280px;min-width:0;gap:12px">
      <h2 style="margin:0">Ações da OS</h2>
      ${showIniciar ? `<button type="button" class="btn btn-primary btn-lg" data-action="iniciar"${bloqueado ? ' disabled' : ''}>Iniciar reparo</button>` : ''}
      ${bloqueio ? `<p style="margin:0;padding:10px 12px;border-radius:8px;background:#F1F5F9;font-size:13px;color:var(--text-2)">${bloqueio}</p>` : ''}
      ${o.status === 'Em andamento' ? '<button type="button" class="btn btn-ok btn-lg" data-action="concluir">Confirmar serviço e encerrar OS</button>' : ''}
      ${!closed ? '<button type="button" class="btn btn-danger btn-lg" data-action="cancelarOS">Cancelar serviço</button>' : '<p style="margin:0;font-size:14px;color:var(--muted)">Esta OS está encerrada. Nenhuma ação pendente.</p>'}
    </aside>
  </div>`;
}

/* Formulário do pré-orçamento: o técnico descreve o serviço e informa os valores */
function formOrcamento(o) {
  const f = state.orcForm;
  const sub = Math.max(1, Math.round(num(f.qtd))) * (num(f.peca) + num(f.mao));
  return `<div class="orc-form">
    <span class="lbl" style="font-size:14px">Adicionar serviço ao orçamento</span>
    <div class="ref"><b>O cliente relatou</b>${esc(o.defeito)}</div>
    <div class="field">
      <label for="of-desc">O que será feito</label>
      <input id="of-desc" list="sugestoes" data-model="orcForm" data-key="desc" data-live-orc="1" value="${esc(f.desc)}" placeholder="Ex.: Troca da tela LCD 15,6&quot;">
      <datalist id="sugestoes">${SUGESTOES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">${SUGESTOES.slice(0, 5).map(x => `<button type="button" class="sug" data-action="sugestao" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    </div>
    <div class="grid4">
      <div class="field"><label for="of-qtd">Qtd</label><input id="of-qtd" type="number" min="1" step="1" data-model="orcForm" data-key="qtd" data-live-orc="1" value="${esc(f.qtd)}"></div>
      <div class="field"><label for="of-peca">Valor da peça</label><div class="money"><span>R$</span><input id="of-peca" inputmode="decimal" data-model="orcForm" data-key="peca" data-live-orc="1" value="${esc(f.peca)}" placeholder="0,00"></div></div>
      <div class="field"><label for="of-mao">Mão de obra</label><div class="money"><span>R$</span><input id="of-mao" inputmode="decimal" data-model="orcForm" data-key="mao" data-live-orc="1" value="${esc(f.mao)}" placeholder="0,00"></div></div>
      <div class="field"><span class="lbl">Subtotal</span><div id="of-sub" style="min-height:44px;display:flex;align-items:center;font-size:16px;font-weight:700">${brl(sub)}</div></div>
    </div>
    <span class="hint">Deixe "Valor da peça" vazio quando for só mão de obra (ex.: formatação).</span>
    ${state.orcErr ? `<div role="alert" class="alert alert-err">${esc(state.orcErr)}</div>` : ''}
    <div style="display:flex;justify-content:flex-end"><button type="button" class="btn btn-primary" data-action="addItem">Adicionar ao orçamento</button></div>
  </div>`;
}

/* Data em que o serviço será realizado (depois do diagnóstico) */
function agendaServico(o) {
  const dias = DIAS.filter(d => d >= o.data);
  const dia = state.servDia && dias.includes(state.servDia) ? state.servDia : (o.sData && dias.includes(o.sData) ? o.sData : dias[0]);
  if (!dia) return '';
  const livres = HORAS.filter(h => {
    if (dia === o.data && h <= o.hora) return false;            // só depois do diagnóstico
    const e = slot(o.tecnico, dia, h);
    return !e || (e.o === o && e.tipo === 'Serviço');            // livre ou já é o horário desta OS
  });
  return `<div class="agenda-serv">
    <span class="lbl" style="font-size:14px">Data para realizar o serviço</span>
    <span class="hint">Agenda de ${esc(o.tecnico)}. ${o.sData ? `Marcado: <b>${curto(o.sData)} às ${o.sHora}</b>.` : 'Ainda não marcada.'}</span>
    <div class="slots">${dias.map(d => `<button type="button" class="chip${d === dia ? ' on' : ''}" data-action="servDia" data-d="${d}">${curto(d)}</button>`).join('')}</div>
    <div class="slots">${livres.length ? livres.map(h => `<button type="button" class="chip${o.sData === dia && o.sHora === h ? ' on' : ''}" data-action="servHora" data-h="${h}" data-d="${dia}">${h}</button>`).join('') : '<span style="font-size:14px;color:var(--danger)">Sem horário livre nesse dia.</span>'}</div>
  </div>`;
}
