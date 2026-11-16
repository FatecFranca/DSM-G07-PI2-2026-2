function viewDetalhe() {
  const ordem = sel();
  if (!ordem) {
    return `<section class="card">
      <p class="sub">A ordem não está carregada. Volte à lista e tente novamente.</p>
      <button type="button" class="btn btn-ghost" data-action="go" data-to="ordens">Voltar às ordens</button>
    </section>`;
  }
  const editavel =
  ['Sem orçamento', 'Pendente', 'Recusado'].includes(ordem.orc) ||
  (ordem.status === 'Em andamento' && ordem.orc === 'Aprovado');
  
  const proximosStatus = {
    'Aguardando triagem': ['Cancelado'],
    'Aguardando aprovação': ['Cancelado'],
    'Agendado': ['Em andamento', 'Cancelado'],
    'Em andamento': ["Concluído", "Cancelado", "Aguardando aprovação"],
    'Concluído': [],
    'Cancelado': []
  }[ordem.status] || [];
  const agendamentos = ordem.agendamentos.length
    ? ordem.agendamentos.map(agendamento => `<div class="ref">
        <b>${fmt(agendamento.data)} às ${agendamento.hora}</b>
        ${agendamento.status ? ` · ${esc(agendamento.status)}` : ''}
        · ${agendamento.buscar ? 'buscar aparelho' : 'cliente traz o aparelho'}
      </div>`).join('')
    : '<p class="sub">Não há agendamentos registrados.</p>';

  return `
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
    <button type="button" class="btn btn-ghost" style="min-height:40px" data-action="go" data-to="ordens">← Voltar às ordens</button>
    <span class="mono" style="font-size:22px;font-weight:600">OS ${esc(ordem.numero)}</span>
  </div>
  <div class="row">
    <div class="main-col">
      <section class="card stack">
        <h2 style="margin:0">Andamento do conserto</h2>
        <div>${pill(ordem.status, STATUS_CLASS[ordem.status] || 's-triagem')}</div>
        ${proximosStatus.length ? `<div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
          <div class="field" style="min-width:220px">
            <label for="status-os">Atualizar andamento</label>
            <select id="status-os">${opts(proximosStatus, proximosStatus[0])}</select>
          </div>
          <button type="button" class="btn btn-primary" data-action="salvarStatusOS"${state.statusSaving ? ' disabled aria-busy="true"' : ''}>
            ${state.statusSaving ? 'Salvando...' : 'Salvar andamento'}
          </button>
        </div>` : '<p class="sub">Esta ordem foi encerrada.</p>'}
        ${state.statusErr ? `<div role="alert" class="alert alert-err">${esc(state.statusErr)}</div>` : ''}
      </section>
      <section class="card stack">
        <h2 style="margin:0">Dados registrados</h2>
        <div class="info">
          <div><span>Cliente</span><b>${esc(ordem.cliente)}</b></div>
          <div><span>CPF</span><b>${esc(ordem.cpf)}</b></div>
          <div><span>Telefone</span><b>${esc(ordem.telefone)}</b></div>
          <div><span>Técnico responsável</span><b>${esc(ordem.tecnico)}</b></div>
          <div><span>Equipamento</span><b>${esc(ordem.equip || '—')}</b></div>
          <div><span>Número de série</span><b>${esc(ordem.numeroSerie || '—')}</b></div>
        </div>
        <div>
          <span class="lbl" style="display:block;margin-bottom:6px;font-size:12px;color:var(--muted)">Observação / problema relatado</span>
          <p class="defeito">${esc(ordem.defeito || '—')}</p>
        </div>
      </section>

      <section class="card stack">
        <h2 style="margin:0">Agendamentos</h2>
        ${agendamentos}
      </section>

      <section class="card stack" style="gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <h2 style="margin:0">Orçamento</h2>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            ${pill(ordem.orc, ORC_CLASS[ordem.orc] || 's-triagem')}
          </div>
        </div>
        ${ordem.itens.length ? `<div class="scroll">
          <div class="thead t-orc"><span>Serviço cadastrado</span><span>Qtd</span><span>Peças</span><span>Mão de obra</span><span>Subtotal</span><span></span></div>
          ${ordem.itens.map((item, indice) => `<div class="trow t-orc" style="padding:8px 0">
            <span>${esc(item.desc)}</span>
            <span>${item.qtd}</span>
            <span>${item.custo ? brl(item.custo) : '—'}</span>
            <span>${item.mao ? brl(item.mao) : '—'}</span>
            <b>${brl(item.qtd * (item.mao + item.custo))}</b>
            <span>${editavel ? `<button type="button" class="icon-x" aria-label="Remover serviço" data-action="remover" data-idx="${indice}"${state.orcSaving ? ' disabled' : ''}>×</button>` : ''}</span>
          </div>`).join('')}
          <div style="display:flex;justify-content:flex-end;gap:12px;padding-top:10px;font-size:16px;min-width:560px">
            <span style="color:var(--muted)">Total</span><b>${brl(totalOf(ordem))}</b>
          </div>
        </div>` : '<p class="sub">Nenhum item de orçamento registrado.</p>'}
        ${editavel ? formOrcamento() : '<p class="hint">A resposta ao orçamento é registrada pelo cliente na área do cliente.</p>'}
        ${state.orcErr ? `<div role="alert" class="alert alert-err">${esc(state.orcErr)}</div>` : ''}
      </section>
    </div>
  </div>`;
}

function formOrcamento() {
  const formulario = state.orcForm;
  const subtotal = Math.max(1, Math.round(num(formulario.qtd))) *
    (num(formulario.peca) + num(formulario.mao));
  const opcoes = state.servicos.map(servico =>
    `<option value="${esc(servico.descricao)}"></option>`
  ).join('');

  return `<div class="orc-form">
    <span class="lbl" style="font-size:14px">Serviço a realizar</span>
    <div class="field">
      <label for="of-servico">Descrição do serviço</label>
      <input id="of-servico" list="of-catalogo-servicos" maxlength="150" data-model="orcForm" data-key="descricao" value="${esc(formulario.descricao)}" placeholder="Digite o serviço ou escolha uma sugestão">
      <datalist id="of-catalogo-servicos">${opcoes}</datalist>
    </div>
    <span class="hint">Você pode escolher uma sugestão ou digitar um serviço novo. Ao salvar, o serviço novo será cadastrado no catálogo.</span>
    <div class="grid4">
      <div class="field"><label for="of-qtd">Quantidade</label><input id="of-qtd" type="number" min="1" step="1" data-model="orcForm" data-key="qtd" data-live-orc="1" value="${esc(formulario.qtd)}"></div>
      <div class="field"><label for="of-peca">Custo das peças</label><div class="money"><span>R$</span><input id="of-peca" inputmode="decimal" data-model="orcForm" data-key="peca" data-live-orc="1" value="${esc(formulario.peca)}" placeholder="0,00"></div></div>
      <div class="field"><label for="of-mao">Mão de obra</label><div class="money"><span>R$</span><input id="of-mao" inputmode="decimal" data-model="orcForm" data-key="mao" data-live-orc="1" value="${esc(formulario.mao)}" placeholder="0,00"></div></div>
      <div class="field"><span class="lbl">Subtotal</span><div id="of-sub" style="min-height:44px;display:flex;align-items:center;font-size:16px;font-weight:700">${brl(subtotal)}</div></div>
    </div>
    <span class="hint">O banco grava o serviço do catálogo, quantidade e custos informados.</span>
    <div style="display:flex;justify-content:flex-end">
      <button type="button" class="btn btn-primary" data-action="addItem"${state.orcSaving ? ' disabled aria-busy="true"' : ''}>
        ${state.orcSaving ? 'Salvando...' : 'Lançar serviço no orçamento'}
      </button>
    </div>
  </div>`;
}
