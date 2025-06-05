const { ipcRenderer } = require('electron');

const form = document.getElementById('formCliente');
const mensagem = document.getElementById('mensagem');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const cliente = Object.fromEntries(new FormData(form).entries());

  ipcRenderer.invoke('salvar-cliente', cliente).then((res) => {
    mensagem.textContent = res.ok ? 'Cliente cadastrado com sucesso!' : 'Erro ao cadastrar cliente.';
    form.reset();
  });
});
