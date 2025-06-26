(() => {
  const tabela = document.getElementById('tabelaOS');

  if (!tabela) {
    console.warn("⚠️ Elemento #tabelaOS não encontrado.");
    return;
  }

  let ordens = [];
  let paginaAtual = 1;
  const porPagina = 20;

  function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function renderizarTabela(lista = ordens) {
    const tabela = document.getElementById('tabelaOS');
    tabela.innerHTML = '';

    const inicio = (paginaAtual - 1) * porPagina;
    const fim = inicio + porPagina;
    const ordensPagina = lista.slice(inicio, fim);

    ordensPagina.forEach(os => {
      console.log(os);
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
      <td>${os.id}</td>
      <td>${os.cliente}</td>
      <td>${formatarData(os.data_entrada)}</td>
      <td>${formatarData(os.data_entrega)}</td>
      <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.total)}</td>
      <td class="status ${os.status.toLowerCase().replace(/\s/g, '-')}">${os.status}</td>
      <td>
        <button onclick="verOS(${os.id})"><span class="material-icons">visibility</span></button>
        <button onclick="editarOS(${os.id})"><span class="material-icons">edit</span></button>
        <button onclick="excluir(${os.id})"><span class="material-icons">delete</span></button>
      </td>
    `;
      tabela.appendChild(tr);
    });

    renderizarPaginacao(lista);
  }

  function renderizarPaginacao(lista = ordens) {
    const paginacao = document.getElementById('paginacao');
    if (!paginacao) return;

    paginacao.innerHTML = '';
    const totalPaginas = Math.ceil(lista.length / porPagina);

    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
      btn.onclick = () => {
        paginaAtual = i;
        renderizarTabela(lista);
      };
      paginacao.appendChild(btn);
    }
  }


  function carregarTabelaOS() {
    window.api.listarOS().then(dados => {
      ordens = dados;
      paginaAtual = 1;
      renderizarTabela();
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
            carregarTabelaOS(); 
          } else {
            Swal.fire('Erro', 'Não foi possível excluir a OS.', 'error');
          }
        });
      }
    });
  };

  function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

  window.verOS = function (id) {
    window.osVisualizacaoId = id;
    window.carregarPagina(`ordemServiço/os_visualizacao.html`);
  };

  window.editarOS = function (id) {
    window.osEditId = id;
    carregarPagina('ordemServiço/ordem_servico.html');
  }

  document.querySelector('.filter').addEventListener('click', () => {
    const filtros = document.getElementById('filtrosContainer');
    filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnAplicarFiltro').addEventListener('click', () => {
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const entrada = document.getElementById('filtroDataEntrada').value;
    const entrega = document.getElementById('filtroDataEntrega').value;

    const filtradas = ordens.filter(os => {
      const clienteOk = cliente ? os.cliente.toLowerCase().includes(cliente) : true;
      const entradaOk = entrada ? os.data_entrada === entrada : true;
      const entregaOk = entrega ? os.data_entrega === entrega : true;
      return clienteOk && entradaOk && entregaOk;
    });

    paginaAtual = 1;
    renderizarTabela(filtradas);
  });

  document.getElementById('btnLimparFiltro').addEventListener('click', () => {
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroDataEntrada').value = '';
    document.getElementById('filtroDataEntrega').value = '';
    paginaAtual = 1;
    renderizarTabela(ordens);
  });


  document.querySelector('.export').addEventListener('click', async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
  const anoAtual = hoje.getFullYear();

  const dataAtual = `${dia}/${mesAtual}/${anoAtual}`;

  const ordensMes = ordens.filter(os => {
    const [ano, mes] = os.data_entrada.split('-');
    return ano == anoAtual && mes == mesAtual;
  });

  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('Gráfica - Relatório Mensal de Ordens de Serviço', 105, 15, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Emitido em: ${dataAtual}`, 15, 25);

  const body = ordensMes.map(os => [
    os.id,
    os.cliente,
    formatarData(os.data_entrada),
    formatarData(os.data_entrega),
    formatarMoeda(os.total),
    os.status
  ]);

const totalMes = ordensMes.reduce((acc, os) => acc + os.total, 0);

doc.autoTable({
  startY: 30,
  head: [['ID', 'Cliente', 'Entrada', 'Entrega', 'Total (R$)', 'Status']],
  body,
  theme: 'striped',
  headStyles: { fillColor: [0, 123, 255], textColor: 255, halign: 'center' },
  styles: { fontSize: 10, halign: 'center' },
  margin: { left: 10, right: 10 },
  foot: [[
  { content: `Total de OS: ${ordensMes.length}`, colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
  { content: `Valor Total do Mês: ${formatarMoeda(totalMes)}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
]]
});

  const yFinal = doc.lastAutoTable.finalY + 10;

  doc.setDrawColor(200);
  doc.line(10, 285, 200, 285);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Relatório gerado automaticamente pelo Sistema da Gráfica', 105, 290, { align: 'center' });

  doc.save(`relatorio_os_${mesAtual}_${anoAtual}.pdf`);
});

})();
