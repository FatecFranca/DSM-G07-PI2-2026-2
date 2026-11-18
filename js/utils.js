/* ============= Funções utilitárias ============ */

/* conversor "1.234,56" ou "1234.56" em número */
const num = v => { let t = String(v).trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isNaN(n) ? 0 : n; };
const moeda = valor => {
  let texto = String(valor).trim();
  if (!texto) return 0;
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
};

/* escapa texto antes de colocar no HTML (evita XSS) */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* '2026-10-08' - '08/10/2026' */
const fmt = d => d.split('-').reverse().join('/');

/* '2026-10-08' - 'Qui 08/10' */
const curto = d => { const p = d.split('-'); return SEMANA[new Date(d + 'T12:00:00').getDay()] + ' ' + p[2] + '/' + p[1]; };

/* 1234.5 - 'R$ 1.234,50' */
const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* Total do orçamento de uma OS */
const totalOf = o => o.itens.reduce((a, i) => a + i.qtd * (i.mao + i.custo), 0);

/* Formulários vazios */
const emptyOrcForm = () => ({ descricao:'', qtd:'1', peca:'', mao:'' });
const emptyForm = () => ({
  cliente: '',
  cpf: '',
  telefone: '',
  cep: '',
  numeroEndereco: '',
  bairro: '',
  rua: '',
  cidade: '',
  estado: '',
  referencia: '',
  equip: '',
  numeroSerie: '',
  defeito: '',
  data: PRIMEIRO_AGENDAMENTO.data,
  hora: PRIMEIRO_AGENDAMENTO.hora,
  buscar: false
});
const emptyPortal = () => ({
  nome: '',
  cpf: '',
  telefone: '',
  cep: '',
  numero: '',
  bairro: '',
  rua: '',
  cidade: '',
  estado: '',
  referencia: '',
  equip: '',
  numeroSerie: '',
  defeito: '',
  data: PRIMEIRO_AGENDAMENTO.data,
  hora: PRIMEIRO_AGENDAMENTO.hora,
  buscar: false
});
const emptyClienteCadastro = () => ({
  nome_completo: '',
  cpf: '',
  telefone: '',
  cep: '',
  numero: '',
  bairro: '',
  rua: '',
  cidade: '',
  estado: '',
  referencia: '',
  email: '',
  password: '',
  password_confirm: ''
});
