(() => {
  const tabela = document.getElementById('tabelaOS');

  if (!tabela) {
    console.warn("⚠️ Elemento #tabelaOS não encontrado.");
    return;
  }

  function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }


  function carregarTabelaOS() {
    const tabela = document.getElementById('tabelaOS');
    tabela.innerHTML = '';

    window.api.listarOS().then(ordens => {
      ordens.forEach(os => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${os.id}</td>
        <td>${os.cliente}</td>
        <td>${formatarData(os.data_entrada)}</td>
        <td>${formatarData(os.data_entrega)}</td>
        <td>${os.total.toFixed(2)}</td>
        <td>
          <button onclick="verOS(${os.id})"><span class="material-icons">visibility</span></button>
          <button onclick="editarOS(${os.id})"><span class="material-icons">edit</span></button>
          <button onclick="excluir(${os.id})"><span class="material-icons">delete</span></button>
        </td>
      `;
        tabela.appendChild(tr);
      });
    });
  }

  carregarTabelaOS()

  window.excluir = function (id) {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação não pode ser desfeita!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        window.api.excluirOS(id).then(res => {
          if (res.ok) {
            Swal.fire({
              title: 'Excluído!',
              text: 'A OS foi removida com sucesso.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
            carregarTabelaOS(); // ou carregarPagina('ordemServico/ordens_listagem.html');
          } else {
            Swal.fire('Erro', 'Não foi possível excluir a OS.', 'error');
          }
        });
      }
    });
  };
})();
