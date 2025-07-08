(() => {
  const tabela = document.getElementById('tabelaOS');
  if (!tabela) return;

  let ordens = [];
  let paginaAtual = 1;
  const porPagina = 20;
  let totalPaginas = 1;
  let filtrosAtuais = {};

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

  async function carregarTabelaOS() {
    const { ok, ordens: dados, total } = await window.api.listarOS({
      pagina: paginaAtual,
      limite: porPagina,
      ...filtrosAtuais
    });

    if (!ok) {
      alert('Erro ao carregar ordens de serviço');
      return;
    }

    ordens = dados;
    totalPaginas = Math.ceil(total / porPagina);
    renderizarTabela();
    renderizarPaginacao();
  }

  function renderizarTabela() {
    tabela.innerHTML = '';
    ordens.forEach(os => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${os.id}</td>
        <td>${os.cliente}</td>
        <td>${formatarData(os.data_entrada)}</td>
        <td>${formatarData(os.data_entrega)}</td>
        <td>${formatarMoeda(os.total)}</td>
        <td class="status ${os.status.toLowerCase().replace(/\s/g, '-')}">${os.status}</td>
        <td>
          <button onclick="verOS(${os.id})"><span class="material-icons">visibility</span></button>
          <button onclick="editarOS(${os.id})"><span class="material-icons">edit</span></button>
          <button onclick="excluir(${os.id})"><span class="material-icons">delete</span></button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  }

  function renderizarPaginacao() {
    const paginacao = document.getElementById('paginacao');
    if (!paginacao) return;

    paginacao.innerHTML = '';

    const maxBotoes = 5;
    const mostrarEllipsis = totalPaginas > maxBotoes + 2;

    const criarBotao = (i) => {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
      btn.onclick = () => {
        paginaAtual = i;
        carregarTabelaOS();
      };
      paginacao.appendChild(btn);
    };

    if (mostrarEllipsis) {
      criarBotao(1);

      if (paginaAtual > 3) {
        const span = document.createElement('span');
        span.textContent = '...';
        paginacao.appendChild(span);
      }

      const start = Math.max(2, paginaAtual - 1);
      const end = Math.min(totalPaginas - 1, paginaAtual + 1);
      for (let i = start; i <= end; i++) {
        criarBotao(i);
      }

      if (paginaAtual < totalPaginas - 2) {
        const span = document.createElement('span');
        span.textContent = '...';
        paginacao.appendChild(span);
      }

      criarBotao(totalPaginas);
    } else {
      for (let i = 1; i <= totalPaginas; i++) {
        criarBotao(i);
      }
    }
  }

  document.getElementById('btnAplicarFiltro').addEventListener('click', () => {
    filtrosAtuais = {
      cliente: document.getElementById('filtroCliente').value,
      entrada: document.getElementById('filtroDataEntrada').value,
      entrega: document.getElementById('filtroDataEntrega').value
    };
    paginaAtual = 1;
    carregarTabelaOS();
  });

  document.getElementById('btnLimparFiltro').addEventListener('click', () => {
    filtrosAtuais = {};
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroDataEntrada').value = '';
    document.getElementById('filtroDataEntrega').value = '';
    paginaAtual = 1;
    carregarTabelaOS();
  });

  document.querySelector('.filter').addEventListener('click', () => {
    const filtros = document.getElementById('filtrosContainer');
    filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
  });

  document.querySelector('.export').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    const dataAtual = `${dia}/${mes}/${ano}`;
    const ordensMes = ordens.filter(os => {
      const [anoOS, mesOS] = os.data_entrada.split('-');
      return anoOS == ano && mesOS == mes;
    });

    const body = ordensMes.map(os => [
      os.id,
      os.cliente,
      formatarData(os.data_entrada),
      formatarData(os.data_entrega),
      formatarMoeda(os.total),
      os.status
    ]);

    const totalMes = ordensMes.reduce((acc, os) => acc + os.total, 0);

    doc.setFontSize(16);
    doc.text('Gráfica - Relatório Mensal de Ordens de Serviço', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Emitido em: ${dataAtual}`, 15, 25);

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

    doc.save(`relatorio_os_${mes}_${ano}.pdf`);
  });

  document.querySelector('.export-dia').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    const dataAtual = `${dia}/${mes}/${ano}`;
    const dataComparacao = `${ano}-${mes}-${dia}`;
    console.log(ordens);
    
    const ordensDia = ordens.filter(os => {
      const dataCriacao = os.created_at?.substring(0, 10);
      return dataCriacao === dataComparacao;
    });

    const body = ordensDia.map(os => [
      os.id,
      os.cliente,
      formatarData(os.data_entrada),
      formatarData(os.data_entrega),
      formatarMoeda(os.total),
      os.status
    ]);

    const totalDia = ordensDia.reduce((acc, os) => acc + os.total, 0);

    doc.setFontSize(16);
    doc.text('Gráfica - Relatório Diário de Ordens de Serviço', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Emitido em: ${dataAtual}`, 15, 25);

    doc.autoTable({
      startY: 30,
      head: [['ID', 'Cliente', 'Entrada', 'Entrega', 'Total (R$)', 'Status']],
      body,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255], textColor: 255, halign: 'center' },
      styles: { fontSize: 10, halign: 'center' },
      margin: { left: 10, right: 10 },
      foot: [[
        { content: `Total de OS: ${ordensDia.length}`, colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: `Valor Total do Dia: ${formatarMoeda(totalDia)}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
      ]]
    });

    doc.save(`relatorio_os_${dia}_${mes}_${ano}.pdf`);
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

  window.verOS = function (id) {
    window.osVisualizacaoId = id;
    window.carregarPagina(`ordemServiço/os_visualizacao.html`);
  };

  window.editarOS = function (id) {
    window.osEditId = id;
    carregarPagina('ordemServiço/ordem_servico.html');
  };

  carregarTabelaOS();
})();
