
(() => {
  console.log("Hello world");
  window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
  });

  const form = document.getElementById('formCliente');
  const mensagem = document.getElementById('mensagem');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cliente = Object.fromEntries(new FormData(form).entries());

    window.api.salvarCliente(cliente).then((res) => {
      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Cliente cadastrado com sucesso!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        form.reset();
      } else {
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível cadastrar o cliente.',
          icon: 'error'
        });
      }
    });
  });

})();