(() => {
  console.log("✅ Script de Orçamento carregado");

  const form = document.getElementById('formOrcamento');
  const clienteSelect = document.getElementById('clienteSelect');
  const cnpjInput = document.getElementById('cliente_cnpj');
  const itensContainer = document.getElementById('itensOrcamento');
  const btnAdicionarItem = document.getElementById('btnAdicionarItem');
  const btnImprimir = document.getElementById('btnImprimir');
  const btnSalvar = document.getElementById('btnSalvar');

  let tomSelectCliente = null;
  let clientes = [];
  let modoEdicao = false;
  let modoVisualizacao = false;
  let orcamentoId = null;

  if (window.orcamentoEditId) {
    modoEdicao = true;
    orcamentoId = window.orcamentoEditId;
  }

  if (window.orcamentoVisualizacaoId) {
    modoVisualizacao = true;
    orcamentoId = window.orcamentoVisualizacaoId;
  }

  window.api.buscarClientes({ pagina: 1, limite: 100 }).then(dados => {
    if (!dados.ok) {
      console.error("Erro ao buscar clientes");
      return;
    }

    clientes = dados.clientes; // Armazena só o array de clientes

    dados.clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nome_fantasia;
      clienteSelect.appendChild(option);
    });

    tomSelectCliente = new TomSelect('#clienteSelect', {
      create: false,
      sortField: { field: "text", direction: "asc" },
      placeholder: "Digite para buscar um cliente"
    });

    if (window.clienteIdParaSelecionar) {
      tomSelectCliente.setValue(window.clienteIdParaSelecionar);
    }

    if (modoEdicao || modoVisualizacao) {
      carregarOrcamentoParaEdicao(orcamentoId);
    }
  });


  clienteSelect.addEventListener('change', () => {
    const idSelecionado = clienteSelect.value;
    const cliente = clientes.find(c => c.id == idSelecionado);
    if (cliente && cnpjInput) {
      cnpjInput.value = cliente.cnpj || '';
    }
  });

  function criarLinhaItem(item = {}) {
    const tr = document.createElement('tr');
    tr.classList.add('item');

    tr.innerHTML = `
      <td><input type="number" class="quantidade" value="${item.quantidade || ''}" placeholder="0" style="width: 60px;" ${modoVisualizacao ? 'readonly' : ''} /></td>
      <td><input type="text" class="descricao" value="${item.descricao || ''}" placeholder="Descrição do item" style="width: 100%;" ${modoVisualizacao ? 'readonly' : ''} /></td>
      <td><input type="number" class="valor_unitario" value="${item.valor_unitario || ''}" step="0.01" placeholder="0,00" style="width: 100px;" ${modoVisualizacao ? 'readonly' : ''} /></td>
      <td class="valor_total" style="min-width: 90px;">R$ 0,00</td>
      <td>
        ${!modoVisualizacao ? `
          <button type="button" onclick="this.closest('tr').remove()">
            <span class="material-icons">delete</span>
          </button>
        ` : ''}
      </td>
    `;

    const qtdInput = tr.querySelector('.quantidade');
    const valorInput = tr.querySelector('.valor_unitario');
    const totalDisplay = tr.querySelector('.valor_total');

    function atualizarTotal() {
      const qtd = parseInt(qtdInput.value) || 0;
      const unit = parseFloat(valorInput.value) || 0;
      const total = qtd * unit;
      totalDisplay.textContent = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }

    qtdInput.addEventListener('input', atualizarTotal);
    valorInput.addEventListener('input', atualizarTotal);

    setTimeout(atualizarTotal, 0);
    itensContainer.appendChild(tr);
  }

  btnAdicionarItem.addEventListener('click', () => {
    if (!modoVisualizacao) criarLinhaItem();
  });

  async function carregarOrcamentoParaEdicao(id) {
    const data = await window.api.buscarOrcamentoCompleto(id);
    if (!data) {
      Swal.fire('Erro', 'Não foi possível carregar o orçamento.', 'error');
      return;
    }

    const { orcamento, itens } = data;

    document.getElementById('observacoes').value = orcamento.observacoes || '';
    cnpjInput.value = orcamento.cliente_cnpj || '';

    const clienteCorrespondente = clientes.find(c => c.nome_fantasia === orcamento.cliente_nome);
    if (clienteCorrespondente) {
      tomSelectCliente.setValue(clienteCorrespondente.id);
    } else {
      tomSelectCliente.clear();
    }

    itensContainer.innerHTML = '';
    itens.forEach(item => criarLinhaItem(item));

    if (modoVisualizacao) {
      desabilitarFormulario();
    }
  }
  function desabilitarFormulario() {
    document.querySelectorAll('input, select, textarea').forEach(el => el.setAttribute('disabled', true));

    btnAdicionarItem.style.display = 'none';
    btnSalvar?.remove();

    if (tomSelectCliente) {
      tomSelectCliente.disable();
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cliente_id = clienteSelect.value;
    const cliente = clientes.find(c => c.id == cliente_id);
    const cliente_nome = cliente?.nome_fantasia || '';
    const cliente_cnpj = cliente?.cnpj || '';
    const observacoes = document.getElementById('observacoes').value;

    const itens = Array.from(itensContainer.querySelectorAll('.item')).map(row => {
      const quantidade = parseInt(row.querySelector('.quantidade').value) || 0;
      const valor_unitario = parseFloat(row.querySelector('.valor_unitario').value) || 0;
      const descricao = row.querySelector('.descricao').value.trim();

      return {
        quantidade,
        descricao,
        valor_unitario,
        valor_total: quantidade * valor_unitario
      };
    }).filter(item => item.quantidade > 0 && item.valor_unitario > 0 && item.descricao);

    if (!cliente_nome || itens.length === 0) {
      Swal.fire('Erro', 'Preencha os campos obrigatórios e adicione pelo menos um item.', 'error');
      return;
    }

    const payload = {
      orcamento: {
        cliente_nome,
        cliente_cnpj,
        observacoes
      },
      itens
    };

    let res;
    if (modoEdicao) {
      res = await window.api.atualizarOrcamento({ id: orcamentoId, ...payload });
    } else {
      res = await window.api.salvarOrcamento(payload);
    }

    if (res.ok) {
      Swal.fire('Sucesso', modoEdicao ? 'Orçamento atualizado!' : 'Orçamento salvo!', 'success');
      if (!modoEdicao) {
        form.reset();
        itensContainer.innerHTML = '';
        tomSelectCliente.clear();
        window.orcamentoEditId = null;
        window.orcamentoVisualizacaoId = null;
        modoEdicao = false;
        modoVisualizacao = false;
        orcamentoId = null;
      }
      window.orcamentoEditId = null;
      window.orcamentoVisualizacaoId = null;
      modoEdicao = false;
      modoVisualizacao = false;
      orcamentoId = null;
      form.reset();
      itensContainer.innerHTML = '';
      tomSelectCliente.clear();
    } else {
      Swal.fire('Erro', 'Não foi possível salvar o orçamento.', 'error');
    }
  });

  document.getElementById('btnImprimir').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(255, 204, 0);
    doc.rect(0, 0, 10, 297, 'F');

    const logoPath = window.api.join(window.api.appPath, 'logo.png');
    const logoBase64 = window.api.readFileBase64(logoPath);
    const logoDataURL = `data:image/png;base64,${logoBase64}`;
    doc.addImage(logoDataURL, 'PNG', 20, 10, 45, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Curtolo & Curtolo Gráfica Ltda', 100, 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 0, 0);
    doc.text('CNPJ: 09.523.624/0001-29', 100, 15);
    doc.text('Telefone: (17) 3631-4165 / 99148-7110', 100, 20);
    doc.setTextColor(128, 0, 128);
    doc.text('graficaimage@graficaimage.com.br', 100, 25);
    doc.setTextColor(0);
    doc.text('Rua 27 nº 739 - Centro - Santa Fé do Sul/SP', 100, 30);

    const clienteNome = document.getElementById('clienteSelect')
      ?.selectedOptions[0]?.textContent?.trim() || 'CLIENTE';
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`${clienteNome.toUpperCase()}`, 105, 45, { align: 'center' });

    const itens = Array.from(document.querySelectorAll('.item')).map((itemEl, idx) => {
      const qtdInput = itemEl.querySelector('.quantidade');
      const descInput = itemEl.querySelector('.descricao');
      const valorInput = itemEl.querySelector('.valor_unitario');

      if (!qtdInput || !descInput || !valorInput) return null;

      const qtd = qtdInput.value;
      const desc = descInput.value;
      const valor = parseFloat(valorInput.value || 0);
      const total = qtd * valor;

      return [
        String(idx + 1).padStart(2, '0'),
        qtd,
        desc,
        valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
    }).filter(item => item !== null);

    doc.autoTable({
      startY: 55,
      head: [['Item', 'Quant.', 'Descrição', 'Valor Unit.', 'Valor Total']],
      body: itens,
      theme: 'grid',
      styles: { fontSize: 10, halign: 'left', cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 85 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      }
    });

    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Documento gerado automaticamente pelo Sistema da Gráfica', 105, finalY + 15, { align: 'center' });

    const nomeArquivo = `orcamento_${clienteNome.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(nomeArquivo);
  });

})();
