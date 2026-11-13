const API_BASE_URL = '/api';

async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
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
    await fetch('/api/csrf/', { credentials: 'same-origin' });

    const csrf = cookieValue('csrftoken');
    if (!csrf) {
      throw new Error('O Django não forneceu o cookie CSRF.');
    }
    headers['X-CSRFToken'] = csrf;
  }

  const resposta = await fetch(`/api${path}`, opcoes);

  if (resposta.status === 204) {
    return null;
  }

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || `Erro HTTP ${resposta.status}`);
  }
  return dados;
}