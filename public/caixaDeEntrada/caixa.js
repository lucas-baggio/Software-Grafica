(() => {
  const tabelaEntradas = document.getElementById('tabelaEntradas');
  const tabelaSaidas = document.getElementById('tabelaSaidas');
  const btnNovaSaida = document.getElementById('btnNovaSaida');

  function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  function carregarEntradas() {
    window.api.buscarEntradas().then(dados => {
      tabelaEntradas.innerHTML = '';
      dados.forEach(ent => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${ent.id}</td>
          <td>${ent.cliente}</td>
          <td>${formatarData(ent.data)}</td>
          <td>${formatarValor(ent.valor)}</td>
        `;
        tabelaEntradas.appendChild(tr);
      });
    });
  }

  function carregarSaidas() {
    window.api.buscarSaidas().then(dados => {
      tabelaSaidas.innerHTML = '';
      dados.forEach(saida => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${saida.id}</td>
          <td>${saida.descricao}</td>
          <td>${formatarData(saida.data)}</td>
          <td>${formatarValor(saida.valor)}</td>
          <td>
            <button onclick="excluirSaida(${saida.id})">
              <span class="material-icons">delete</span>
            </button>
          </td>
        `;
        tabelaSaidas.appendChild(tr);
      });
    });
  }

  btnNovaSaida.addEventListener('click', () => {
    Swal.fire({
      title: 'Nova Saída',
      html: `
        <input id="desc" class="swal2-input" placeholder="Descrição">
        <input id="valor" type="number" class="swal2-input" placeholder="Valor">
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      preConfirm: () => {
        const descricao = document.getElementById('desc').value;
        const valor = parseFloat(document.getElementById('valor').value);
        return { descricao, valor };
      }
    }).then(result => {
      if (result.isConfirmed) {
        window.api.adicionarSaida(result.value).then(ok => {
          if (ok) carregarSaidas();
        });
      }
    });
  });

  window.excluirSaida = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir'
    }).then(result => {
      if (result.isConfirmed) {
        window.api.excluirSaida(id).then(ok => {
          if (ok) carregarSaidas();
        });
      }
    });
  };

  carregarEntradas();
  carregarSaidas();
})();
