/*TELA DE NOVA ORDEM DE SERVIÇO*/
function viewNova() {
  const f = state.form;

  return `<div class="row">
    <section class="card stack" style="flex:999 1 520px;min-width:0;padding:24px">
      <h2 style="margin:0;font-size:18px">Registro de O.S.</h2>

      <p class="hint" style="margin:0">
        A ordem será associada ao técnico autenticado.
      </p>

      <h3 style="margin:0">Dados do cliente</h3>
      <div class="grid-auto">
        ${input('n-cli', 'Nome completo', 'form', 'cliente')}
        ${input('n-cpf', 'CPF (11 dígitos)', 'form', 'cpf', 'maxlength="14" placeholder="000.000.000-00"')}
        ${input('n-tel', 'Telefone', 'form', 'telefone')}
        ${input('n-cep', 'CEP', 'form', 'cep', 'maxlength="8"')}
        ${input('n-numero', 'Número do endereço', 'form', 'numeroEndereco')}
        ${input('n-bairro', 'Bairro', 'form', 'bairro')}
        ${input('n-rua', 'Rua', 'form', 'rua')}
        ${input('n-cidade', 'Cidade', 'form', 'cidade')}
        ${input('n-estado', 'Estado (UF)', 'form', 'estado', 'maxlength="2"')}
        ${input('n-ref', 'Referência (opcional)', 'form', 'referencia')}
      </div>

      <h3 style="margin:0">Dados do aparelho</h3>
      <div class="grid-auto">
        ${input('n-eq', 'Tipo de aparelho', 'form', 'equip')}
        ${input('n-serie', 'Número de série (opcional)', 'form', 'numeroSerie')}
      </div>
      ${textarea('n-def', 'Descrição do aparelho e problema', 'form', 'defeito', 'Descreva o aparelho e o problema relatado.')}

      <h3 style="margin:0">Agendamento</h3>
      <p class="hint" style="margin:0">
        A data e a hora serão combinadas pelo backend em um único campo do banco.
      </p>
      <div class="grid-auto" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
        ${selectF('n-dt', 'Data', 'form', 'data', DIAS, curto)}
        ${selectF('n-hr', 'Horário', 'form', 'hora', horariosDisponiveis(f.data))}
      </div>

      <label style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" data-model="form" data-key="buscar"${f.buscar ? ' checked' : ''}>
        Será necessário buscar o aparelho?
      </label>

      ${state.formErr ? `<div role="alert" class="alert alert-err">${esc(state.formErr)}</div>` : ''}

      <div style="display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap">
        <button type="button" class="btn btn-ghost btn-lg" data-action="go" data-to="ordens">
          Cancelar
        </button>
        <button type="button" class="btn btn-primary btn-lg" data-action="criar">
          Registrar serviço
        </button>
      </div>
    </section>
  </div>`;
}