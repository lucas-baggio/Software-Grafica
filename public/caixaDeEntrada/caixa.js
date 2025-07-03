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
    window.api.buscarCaixa().then(dados => {
      tabelaEntradas.innerHTML = '';
      console.log(dados);
      
      dados.forEach(ent => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${ent.id}</td>
          <td>${ent.nome_fantasia}</td>
          <td>${ent.tipo}</td>
          <td>${formatarData(ent.data)}</td>
          <td>${formatarValor(ent.valor)}</td>
        `;
        tabelaEntradas.appendChild(tr);
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

  carregarEntradas();
})();
