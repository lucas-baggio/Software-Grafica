(() => {
  const tabelaEntradas = document.getElementById('tabelaEntradas');
  const paginacao = document.getElementById('paginacao');
  const btnNovaSaida = document.getElementById('btnNovaSaida');

  const cardEntrada = document.getElementById('totalEntradas');
  const cardSaida = document.getElementById('totalSaidas');
  const cardSaldo = document.getElementById('saldoFinal');

  let paginaAtual = 1;
  const porPagina = 20;
  let totalPaginas = 1;
  let ultimosDados = [];

  function formatarData(dataISO) {
    if (!dataISO) return '';

    const data = new Date(dataISO);
    if (isNaN(data)) return '';

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
  }


  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(valor);
  }

  async function carregarEntradas() {
    const { ok, dados, total } = await window.api.buscarCaixa({ pagina: paginaAtual, limite: porPagina });

    if (!ok) {
      alert("Erro ao carregar dados do caixa");
      return;
    }

    ultimosDados = dados;
    totalPaginas = Math.ceil(total / porPagina);

    tabelaEntradas.innerHTML = '';
    let totalEntrada = 0;
    let totalSaida = 0;

    dados.forEach(ent => {
      if (ent.tipo.toLowerCase().includes('entrada')) {
        const valor = parseFloat(ent.valor);
        if (!isNaN(valor)) totalEntrada += valor;
      }

      if (ent.tipo.toLowerCase().includes('saída') || ent.tipo.toLowerCase().includes('saida')) {
        const valor = parseFloat(ent.valor);
        if (!isNaN(valor)) totalSaida += valor;
      }


      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ent.id}</td>
        <td>${ent.nome_exibicao || '-'}</td>
        <td>${ent.tipo}</td>
        <td>${ent.pagamento || '-'}</td>
        <td>${formatarData(ent.data)}</td>
        <td>${formatarMoeda(ent.valor)}</td>
        <td>
          <button onclick="excluir(${ent.id})"><span class="material-icons">delete</span></button>
        </td>
      `;
      tabelaEntradas.appendChild(tr);
    });

    if (cardEntrada) cardEntrada.textContent = formatarMoeda(totalEntrada);
    if (cardSaida) cardSaida.textContent = formatarMoeda(totalSaida);
    if (cardSaldo) cardSaldo.textContent = formatarMoeda(totalEntrada - totalSaida);

    renderizarPaginacao();
  }

  function renderizarPaginacao() {
    paginacao.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
      btn.onclick = () => {
        paginaAtual = i;
        carregarEntradas();
      };
      paginacao.appendChild(btn);
    }
  }

  btnNovaSaida.addEventListener('click', () => {
    Swal.fire({
      title: 'Nova Saída',
      html: `
      <input id="resp" class="swal2-input" placeholder="Responsável">
      <input id="desc" class="swal2-input" placeholder="Descrição">
      <input id="valor" type="text" class="swal2-input" placeholder="Valor">
    `,
      didOpen: () => {
        const input = document.getElementById('valor');

        input.addEventListener('input', function () {
          let valor = this.value.replace(/[^\d,]/g, '');

          const partes = valor.split(',');
          const parteInteira = partes[0];
          const parteDecimal = partes[1] ? partes[1].slice(0, 4) : '';

          const valorFormatado = parteDecimal ? `${parteInteira},${parteDecimal}` : parteInteira;

          const numero = parseFloat(valorFormatado.replace(',', '.'));

          if (!isNaN(numero)) {
            this.value = numero.toFixed(4).replace('.', ',');
          } else {
            this.value = valorFormatado;
          }
        });

      },
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      preConfirm: () => {
        const descricao = document.getElementById('desc').value;
        const destinatario = document.getElementById('resp').value;
        const valorStr = document.getElementById('valor').value;

        const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
        const tipo = "Saída";

        if (!descricao || !destinatario || isNaN(valor) || valor <= 0) {
          Swal.showValidationMessage('Preencha todos os campos corretamente');
          return false;
        }

        return { descricao, destinatario, valor, tipo };
      }
    }).then(result => {
      if (result.isConfirmed) {
        window.api.salvarCaixa(result.value).then(res => {
          if (res.ok) carregarEntradas();
          else Swal.fire('Erro', 'Não foi possível salvar a saída.', 'error');
        });
      }
    });
  });

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
        window.api.deletarCaixa(id).then(res => {
          if (res.ok) {
            Swal.fire('Excluído!', 'O lançamento foi removido com sucesso.', 'success');
            carregarEntradas();
          } else {
            Swal.fire('Erro', 'Não foi possível excluir o caixa.', 'error');
          }
        });
      }
    });
  };

  carregarEntradas();
})();
