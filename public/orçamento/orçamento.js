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

  window.api.buscarClientes({ pagina: 1, limite: 1000 }).then(dados => {
    if (!dados.ok) {
      console.error("Erro ao buscar clientes");
      return;
    }

    clientes = dados.clientes;

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

    tomSelectCliente.on('change', (value) => {
      const cliente = clientes.find(c => c.id == value);
      if (cliente && cnpjInput) {
        cnpjInput.value = cliente.cnpj || '';
      }
    });

    if (window.clienteIdParaSelecionar) {
      tomSelectCliente.setValue(window.clienteIdParaSelecionar);
    }

    if (modoEdicao || modoVisualizacao) {
      carregarOrcamentoParaEdicao(orcamentoId);
    }
  });


  function criarLinhaItem(item = {}) {
    const tr = document.createElement('tr');
    tr.classList.add('item');

    tr.innerHTML = `
      <td><input type="number" class="quantidade" value="${item.quantidade || ''}" placeholder="0" style="width: 60px;" ${modoVisualizacao ? 'readonly' : ''} /></td>
      <td><input type="text" class="descricao" value="${item.descricao || ''}" placeholder="Descrição do item" style="width: 100%;" ${modoVisualizacao ? 'readonly' : ''} /></td>
      <td><input type="text" class="valor_unitario" value="${item.valor_unitario || ''}" step="0.01" placeholder="0,00" style="width: 100px;" ${modoVisualizacao ? 'readonly' : ''} /></td>
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

    valorInput.addEventListener('input', function () {
      let valor = this.value;

      valor = valor.replace(/[^\d,]/g, '');

      const indexVirgula = valor.indexOf(',');
      if (indexVirgula !== -1) {
        const parteInteira = valor.slice(0, indexVirgula);
        const parteDecimal = valor.slice(indexVirgula + 1).slice(0, 4);
        this.value = `${parteInteira},${parteDecimal}`;
      } else {
        this.value = valor;
      }

      atualizarTotal();
    });


    const totalDisplay = tr.querySelector('.valor_total');

    function atualizarTotal() {
      const qtd = parseInt(qtdInput.value) || 0;
      const unit = parseFloat(valorInput.value.replace(',', '.')) || 0;
      const total = qtd * unit;

      totalDisplay.textContent = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
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
      const valor_unitario = parseFloat(row.querySelector('.valor_unitario').value.replace(',', '.')) || 0;

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
        cliente_id,
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
    } else {
      Swal.fire('Erro', 'Não foi possível salvar o orçamento.', 'error');
    }
  });

  document.getElementById('btnImprimir').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataFormatada = `${dia}/${mes}/${ano}`;

    // --- helper de campo com quebra (LABEL: valor) ---
    function escreverCampoComQuebra(label, valor, y, xLabel = 20, xValue = 60) {
      const d = escreverCampoComQuebra.doc;
      const texto = (valor && String(valor).trim()) ? String(valor).toUpperCase() : '--';
      const maxWidth = 120; // largura do valor
      const linhas = d.splitTextToSize(texto, maxWidth);

      d.setFont('helvetica', 'bold');
      d.text(label, xLabel, y);

      d.setFont('helvetica', 'normal');
      d.text(linhas, xValue, y);

      return y + (linhas.length * 6); // avança Y conforme quebras
    }
    escreverCampoComQuebra.doc = doc;

    // --- barras e logos do cabeçalho (sem mudança) ---
    doc.setFillColor(255, 204, 0);
    doc.rect(0, 0, 5, 297, 'F');
    doc.setFillColor(0);
    doc.rect(5, 0, 2, 297, 'F');
    doc.setFillColor(255, 204, 0);
    doc.rect(200, 0, 3, 50, 'F');

    const logoPath = window.api.join(window.api.appPath, 'logo.png');
    const logoBase64 = window.api.readFileBase64(logoPath);
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 20, 10, 60, 45);

    const whatsappBase64 = window.api.readFileBase64(window.api.join(window.api.appPath, 'whatsapp.png'));
    const emailBase64 = window.api.readFileBase64(window.api.join(window.api.appPath, 'email.png'));
    const pingBase64 = window.api.readFileBase64(window.api.join(window.api.appPath, 'ping.png'));

    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Curtolo & Curtolo Gráfica Ltda', 190, 22, { align: 'right' });

    doc.setTextColor(220, 0, 0);
    doc.text('CNPJ: 09.521.624/0001-29', 190, 27, { align: 'right' });
    doc.text('Inscr. Est.: 614.104.129.110', 190, 32, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.addImage(`data:image/png;base64,${whatsappBase64}`, 'PNG', 157, 36, 3, 3);
    doc.text('(17) 3631-4165', 190, 39, { align: 'right' });

    doc.addImage(`data:image/png;base64,${emailBase64}`, 'PNG', 120, 41, 3, 3);
    doc.text('graficaimage@graficaimage.com.br', 190, 44, { align: 'right' });

    doc.addImage(`data:image/png;base64,${pingBase64}`, 'PNG', 102, 46, 3, 3);
    doc.text('Rua 27 nº 739 - Centro - Santa Fé do Sul/SP', 190, 49, { align: 'right' });

    // 🔹 REMOVIDO: a "Data de Emissão" no cabeçalho (ficava colada no topo)
    // doc.setFont('helvetica', 'italic');
    // doc.setFontSize(10);
    // doc.text(`Data de Emissão: ${dataFormatada}`, 190, 54, { align: 'right' });

    const clienteId = document.getElementById('clienteSelect')?.value;
    let yDados = 90; // desce bem abaixo do cabeçalho

    // --- Nome do cliente + Data na MESMA LINHA ---
    const clienteNome = document.getElementById('clienteSelect')?.selectedOptions[0]?.textContent?.trim().toUpperCase() || 'CLIENTE';
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    // Nome alinhado à esquerda
    doc.text(clienteNome, 20, yDados);
    // Data alinhada à direita, na mesma altura
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text(`Data: ${dataFormatada}`, 190, yDados, { align: 'right' });

    yDados += 8; // um pequeno respiro

    // --- Dados do cliente / Endereço ---
    let cliente = null;
    if (clienteId) {
      cliente = await window.api.buscarClientePorId(clienteId);
    }

    if (cliente) {
      // monta o endereço completo com o que existir
      const partes = [
        cliente.endereco,            // ex: "Estrada Municipal S/N"
        cliente.numero,              // ex: "123"
        cliente.complemento,         // ex: "Rural"
        cliente.bairro,
        cliente.cidade && cliente.uf ? `${cliente.cidade}/${cliente.uf}` : (cliente.cidade || cliente.uf),
        cliente.cep && `CEP: ${cliente.cep}`
      ].filter(Boolean);

      const enderecoCompleto = partes.join(', ').replace(/,\s*,/g, ', ').toUpperCase();

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const maxWidth = 160;
      const linhas = doc.splitTextToSize(enderecoCompleto, maxWidth);
      doc.text(linhas, 20, yDados);
      yDados += linhas.length * 6;
    }

    // --- Tabela de itens ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');

    const itens = [];
    let contadorItem = 1;
    
    Array.from(document.querySelectorAll('.item')).forEach((itemEl) => {
      const qtdInput = itemEl.querySelector('.quantidade');
      const descInput = itemEl.querySelector('.descricao');
      const valorInput = itemEl.querySelector('.valor_unitario');
      if (!qtdInput || !descInput || !valorInput) return;

      const qtd = parseFloat(qtdInput.value || '0');
      const desc = (descInput.value || '').trim();
      const valor = parseFloat((valorInput.value || '0').replace(',', '.'));
      if (!qtd || !desc || !valor) return;

      const total = qtd * valor;
      itens.push([
        String(contadorItem).padStart(2, '0'),
        qtd.toString(),
        desc,
        `R$ ${valor.toFixed(4).replace('.', ',')}`,
        `R$ ${total.toFixed(4).replace('.', ',')}`
      ]);
      contadorItem++;
    });

    const totalGeral = itens.reduce((acc, curr) => {
      const valorStr = curr[4];
      const numero = parseFloat(valorStr.replace(/[^\d,-]+/g, '').replace(',', '.'));
      return acc + (isNaN(numero) ? 0 : numero);
    }, 0);

    doc.autoTable({
      startY: yDados + 5,
      head: [['Item', 'Quant.', 'Descrição', 'Valor Unit.', 'Valor Total']],
      body: itens,
      foot: [[
        { content: 'TOTAL GERAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: `R$ ${totalGeral.toFixed(4).replace('.', ',')}`, styles: { halign: 'right', fontStyle: 'bold' } }
      ]],
      theme: 'grid',
      styles: { fontSize: 10, halign: 'left', cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'center' },
      footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', halign: 'right' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { halign: 'right', cellWidth: 36 },
        4: { halign: 'right', cellWidth: 36 }
      },
      tableWidth: 193,
      margin: { left: 21 }
    });

    // --- Adicionar observações após a tabela ---
    const observacoes = document.getElementById('observacoes')?.value?.trim();
    if (observacoes) {
      const finalY = doc.lastAutoTable.finalY || (yDados + 5 + (itens.length * 8) + 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES:', 20, finalY + 10);
      
      doc.setFont('helvetica', 'normal');
      const maxWidth = 170;
      const linhasObs = doc.splitTextToSize(observacoes.toUpperCase(), maxWidth);
      doc.text(linhasObs, 20, finalY + 20);
    }

    // impressão/preview
    const clienteNomeSan = clienteNome.replace(/\s+/g, '_').toLowerCase();
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob);
  });




})();
