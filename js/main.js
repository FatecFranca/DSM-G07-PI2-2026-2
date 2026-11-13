

/* ===== Início ====
   só desenha a tela de login.
   Com o banco: carregar os dados da API antes (GUIA.md, passo 6):

*/

async function initializeApp() {
  try {
    const data = await apiGet('/tecnicos/');
    state.tecnicos = data.tecnicos;
    if (state.tecnicos.length && !state.tecnicos.some(t => t.nome === state.form.tecnico)) {
      state.form.tecnico = state.tecnicos[0].nome;
    }
  } catch (error) {
    state.apiError = `Não foi possível carregar os técnicos do backend: ${error.message}`;
  }
  render();
}

initializeApp();
