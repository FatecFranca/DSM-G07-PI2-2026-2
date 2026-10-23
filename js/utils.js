/* ============= Funções utilitárias ============ */

/* conversor "1.234,56" ou "1234.56" em número */
const num = v => { let t = String(v).trim(); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isNaN(n) ? 0 : n; };

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

/* OS encerrada? */
const isClosed = o => o.status === 'Concluído' || o.status === 'Cancelado';

/* Item do catálogo (usado só nos dados de exemplo) */
const item = (i, q = 1) => ({ ...CATALOGO[i], qtd: q });

/* Formulários vazios */
const emptyOrcForm = () => ({ desc:'', qtd:'1', peca:'', mao:'' });
const emptyForm = () => ({ cliente:'', cpf:'', equip:'', servico:'Formatação', defeito:'', senha:'', tecnico:'João Pedro', data:'2026-10-09', hora:'08:00' });
const emptyPortal = () => ({ nome:'', cpf:'', tel:'', equip:'', defeito:'', data:'2026-10-09', hora:'' });
