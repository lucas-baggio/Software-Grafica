(() => {
  const tabela = document.getElementById('tabelaOS');
  if (!tabela) return;

  let clientes = [];
  let paginaAtual = 1;
  const porPagina = 20;
  let totalPaginas = 1;

  function renderizarTabela() {
    tabela.innerHTML = '';
    clientes.forEach(cliente => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cliente.id}</td>
        <td>${cliente.nome_fantasia}</td>
        <td>${cliente.cnpj}</td>
        <td>${cliente.razao_social || '-'}</td>
        <td>${cliente.telefone || '-'} / ${cliente?.telefone_fixo || '-'}</td>
        <td>
          <button onclick="editarCliente(${cliente.id})"><span class="material-icons">edit</span></button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  }

  function renderizarPaginacao() {
    const paginacao = document.getElementById('paginacao');
    if (!paginacao) return;

    paginacao.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
      btn.onclick = () => {
        paginaAtual = i;
        carregarClientes();
      };
      paginacao.appendChild(btn);
    }
  }

  async function carregarClientes() {
    const { ok, clientes: dados, total } = await window.api.buscarClientes({ pagina: paginaAtual, limite: porPagina });

    if (!ok) {
      alert('Erro ao carregar clientes');
      return;
    }

    clientes = dados;
    totalPaginas = Math.ceil(total / porPagina);
    renderizarTabela();
    renderizarPaginacao();
  }

  carregarClientes();

  window.editarCliente = function (id) {
    window.clienteEditId = id;
    carregarPagina('clientes/clientes.html');
  };

  window.excluirCliente = function (id) {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação irá remover permanentemente o cliente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        window.api.excluirCliente(id).then(res => {
          if (res.ok) {
            Swal.fire('Excluído!', 'Cliente removido com sucesso.', 'success');
            carregarClientes();
          } else {
            Swal.fire('Erro!', 'Não foi possível excluir o cliente.', 'error');
          }
        });
      }
    });
  };

  document.querySelector('.filter').addEventListener('click', () => {
    const filtros = document.getElementById('filtrosContainer');
    filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnAplicarFiltro').addEventListener('click', async () => {
    const nome = document.getElementById('nome').value.trim();
    const cnpj = document.getElementById('cnpj').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    const filtros = {
      pagina: 1,
      limite: porPagina
    };

    if (nome) filtros.nome = nome;
    if (cnpj) filtros.cnpj = cnpj;
    if (telefone) filtros.telefone = telefone;

    const { ok, clientes: dados, total } = await window.api.buscarClientes(filtros);


    if (!ok) {
      alert('Erro ao aplicar filtros');
      return;
    }

    clientes = dados;
    totalPaginas = Math.ceil(total / porPagina);
    renderizarTabela();
    renderizarPaginacao();
  });


  document.getElementById('btnLimparFiltro').addEventListener('click', () => {
    document.getElementById('nome').value = '';
    document.getElementById('cnpj').value = '';
    document.getElementById('telefone').value = '';
    paginaAtual = 1;
    carregarClientes();
  });
})();
