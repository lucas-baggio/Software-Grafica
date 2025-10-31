(() => {
  console.log("Cadastro de Cliente JS carregado");

  const form = document.getElementById('formCliente');
  const telefone = document.getElementById('telefone');
  const telefoneFixo = document.getElementById('telefone_fixo');
  const cnpj = document.getElementById('cnpj');
  const cpf = document.getElementById('cpf');

  // Máscara para celular
  IMask(telefone, {
    mask: '(00) 00000-0000'
  });

  // Máscara para telefone fixo
  IMask(telefoneFixo, {
    mask: '(00) 0000-0000'
  });

  // Máscara para CNPJ
  IMask(cnpj, {
    mask: '00.000.000/0000-00'
  });

  IMask(cpf, {
    mask: '000.000.000-00'
  });

  const clienteId = window.clienteEditId;

  if (clienteId) {
    window.api.buscarClientePorId(clienteId).then(cliente => {
      if (!cliente) {
        Swal.fire('Erro!', 'Cliente não encontrado.', 'error');
        return;
      }

      for (const campo in cliente) {
        const input = document.querySelector(`[name="${campo}"]`);
        if (input) input.value = cliente[campo];
      }

      document.querySelector('h1').textContent = 'Editar Cliente';
    });
  }

    form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cliente = Object.fromEntries(new FormData(form).entries());

    // 🔍 Verifica se já existe um cliente com mesmo nome_fantasia
    const buscaDuplicado = await window.api.buscarClientes({
      nome: cliente.nome_fantasia
    });

    const clienteExistente = buscaDuplicado?.ok
      ? buscaDuplicado.clientes.find(c =>
          c.nome_fantasia.trim().toLowerCase() === cliente.nome_fantasia.trim().toLowerCase() &&
          String(c.id) !== String(clienteId || '') // ignora o próprio cliente ao editar
        )
      : null;

    if (clienteExistente) {
      Swal.fire('Erro!', 'Já existe um cliente com esse nome fantasia.', 'error');
      return;
    }

    // prossegue com o salvamento
    const salvar = clienteId
      ? window.api.atualizarCliente({ id: clienteId, ...cliente })
      : window.api.salvarCliente(cliente);

    salvar.then(res => {
      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: clienteId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          if (!clienteId) form.reset();
          else {
            window.clienteEditId = null;
            localStorage.removeItem('clienteEditId');
            carregarPagina('clientes/listagem.html');
          }
        });
      } else {
        Swal.fire('Erro!', 'Não foi possível salvar o cliente.', 'error');
      }
    });
  });


})();
