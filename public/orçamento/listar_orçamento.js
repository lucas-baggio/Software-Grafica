(() => {
  const tabela = document.getElementById('tabelaOrcamentos');
  const paginacao = document.getElementById('paginacao');

  if (!tabela || !paginacao) return;

  let orcamentos = [];
  let paginaAtual = 1;
  const porPagina = 20;
  let totalPaginas = 1;

  function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  function renderizarTabela() {
    tabela.innerHTML = '';

    orcamentos.forEach(orc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${orc.id}</td>
        <td>${orc.cliente_nome}</td>
        <td>${orc.cliente_cnpj}</td>
        <td>${formatarData(orc.data)}</td>
        <td>${formatarMoeda(orc.total || 0)}</td>
        <td>
          <button onclick="verOrcamento(${orc.id})"><span class="material-icons">visibility</span></button>
          <button onclick="editarOrcamento(${orc.id})"><span class="material-icons">edit</span></button>
          <button onclick="excluirOrcamento(${orc.id})"><span class="material-icons">delete</span></button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  }

  function renderizarPaginacao() {
    paginacao.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
      btn.onclick = () => {
        paginaAtual = i;
        carregarOrcamentos();
      };
      paginacao.appendChild(btn);
    }
  }

  async function carregarOrcamentos() {
    const { ok, orcamentos: dados, total } = await window.api.buscarOrcamentos({ pagina: paginaAtual, limite: porPagina });

    if (!ok) {
      alert('Erro ao carregar orçamentos');
      return;
    }

    for (const orc of dados) {
      const resposta = await window.api.buscarOrcamentoCompleto(orc.id);
      orc.total = resposta?.itens?.reduce((acc, item) => acc + item.valor_total, 0) || 0;
    }

    orcamentos = dados;
    totalPaginas = Math.ceil(total / porPagina);
    renderizarTabela();
    renderizarPaginacao();
  }

  carregarOrcamentos();

  window.verOrcamento = (id) => {
    window.orcamentoVisualizacaoId = id;
    window.orcamentoEditId = null;
    window.carregarPagina('orçamento/orçamento.html');
  };

  window.editarOrcamento = (id) => {
    window.orcamentoEditId = id;
    window.orcamentoVisualizacaoId = null;
    window.carregarPagina('orçamento/orçamento.html');
  };

  window.excluirOrcamento = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação removerá o orçamento permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        window.api.excluirOrcamento(id).then(res => {
          if (res.ok) {
            Swal.fire('Excluído!', 'Orçamento removido com sucesso.', 'success');
            carregarOrcamentos();
          } else {
            Swal.fire('Erro', 'Não foi possível excluir o orçamento.', 'error');
          }
        });
      }
    });
  };
})();
