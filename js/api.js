const API_BASE_URL = '/api';

async function lerResposta(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { erro: text || `Erro HTTP ${response.status}` };
    }
  }

  if (!response.ok) {
    const error = new Error(data.erro || `Erro HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin'
  });
  return lerResposta(response);
}

function cookieValue(nome) {
  const item = document.cookie
    .split('; ')
    .find(parte => parte.startsWith(`${nome}=`));

  return item ? decodeURIComponent(item.split('=').slice(1).join('=')) : '';
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const opcoes = {
    method,
    headers,
    credentials: 'same-origin'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(body);
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
      credentials: 'same-origin'
    });
    await lerResposta(csrfResponse);

    const csrf = cookieValue('csrftoken');
    if (!csrf) {
      throw new Error('O Django não forneceu o cookie CSRF.');
    }
    headers['X-CSRFToken'] = csrf;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, opcoes);
  if (response.status === 204) return null;
  return lerResposta(response);
}

function normalizarOrdem(ordem) {
  const agendamentos = (ordem.agendamentos || []).map(agendamento => {
    const data = new Date(agendamento.data);
    const valida = !Number.isNaN(data.getTime());
    const pad = valor => String(valor).padStart(2, '0');
    return {
      data: valida
        ? `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
        : '',
      hora: valida ? `${pad(data.getHours())}:${pad(data.getMinutes())}` : '',
      buscar: agendamento.buscar,
      status: agendamento.status
    };
  });
  const agendamento = agendamentos[0] || null;
  const observacao = ordem.aparelho?.observacao || '';
  const equipamento = observacao.match(/^Equipamento:\s*(.*)$/m);
  const problema = observacao.match(/^Problema:\s*(.*)$/m);
  const itens = (ordem.orcamento?.itens || []).map(item => ({
    idServico: String(item.id_servico),
    desc: item.descricao,
    qtd: Number(item.quantidade),
    mao: Number(item.mao_de_obra),
    custo: Number(item.custo_item)
  }));

  return {
    id: String(ordem.id),
    numero: ordem.numero_os,
    cliente: ordem.cliente?.nome_completo || '',
    cpf: ordem.cliente?.cpf || '',
    telefone: ordem.cliente?.telefone || '',
    equip: equipamento ? equipamento[1] : observacao,
    defeito: problema ? problema[1] : '',
    numeroSerie: ordem.aparelho?.numero_serie || '',
    tecnico: ordem.tecnico?.nome || '',
    data: agendamento?.data || '',
    hora: agendamento?.hora || '',
    buscar: agendamento ? agendamento.buscar : false,
    statusAgendamento: agendamento?.status || '',
    agendamentos,
    orc: ordem.orcamento?.status || 'Sem orçamento',
    itens,
    servico: itens.map(item => item.desc).join(', ') || '—'
  };
}
