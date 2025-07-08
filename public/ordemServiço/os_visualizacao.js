(() => {
    console.log("TESTE")
    console.log("🧪 Script da OS Visualização carregado");
    console.log("window.api?", window.api);
    console.log("buscarOSDetalhada?", window.api?.buscarOSDetalhada);
    const osId = window.osVisualizacaoId;


    if (!osId) {
        alert('OS não especificada!');
        return;
    }

    console.log("API disponível?", window.api);

    const hoje = new Date().toISOString().split("T")[0];

    function gerarPdfOS(os, cliente, itens) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");

        const formatarData = (dataISO) => {
            if (!dataISO) return '';
            const [a, m, d] = dataISO.split("-");
            return `${d}/${m}/${a}`;
        };

        const formatarValor = (valor) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(valor);
        };

        const margem = 10;
        doc.setFont("courier", "normal");
        doc.setFontSize(10);

        doc.setDrawColor(0);
        doc.rect(margem, margem, 190, 270);

        const yTopoCabecalho = margem;
        const yBaseCabecalho = margem + 35;

        const logoPath = window.api.join(window.api.appPath, 'logo.png');
        const logoBase64 = window.api.readFileBase64(logoPath);
        const logoDataURL = `data:image/png;base64,${logoBase64}`;
        doc.addImage(logoDataURL, 'PNG', margem + 2, margem + 2, 45, 30);

        doc.line(margem + 50, yTopoCabecalho, margem + 50, yBaseCabecalho);

        let xGraf = margem + 65;
        let yGraf = margem + 6;
        doc.text("Telefone: (17) 3631-4165", xGraf, yGraf);
        doc.text("graficaimage@graficaimage.com.br", xGraf, yGraf += 5);
        doc.text("I.E.: 614.104.129.110", xGraf, yGraf += 5);
        doc.text("CNPJ: 09.521.624/0001-29", xGraf, yGraf += 5);
        doc.text("Rua 27, 739 – Centro", xGraf, yGraf += 5);
        doc.text("Santa Fé do Sul - SP", xGraf, yGraf += 5);

        doc.line(margem + 142, yTopoCabecalho, margem + 142, yBaseCabecalho);

        const xRecibo = margem + 150;
        const yRecibo = margem + 2;
        doc.setFont("courier", "bold");
        doc.text("RECIBO", xRecibo + 13, yRecibo + 7);
        doc.setFont("courier", "normal");
        doc.text(`Nº ${String(os.id).padStart(5, "0")}`, xRecibo + 5, yRecibo + 14);
        doc.text(`${formatarData(hoje)}`, xRecibo + 5, yRecibo + 19);

        let yClienteTop = margem + 35;
        let y = yClienteTop;
        const labelX = margem + 2;
        const valueX = margem + 50;

        const campos = [
            ["Nome Fantasia:", cliente.nome_fantasia],
            ["Razão Social:", cliente.razao_social || "---"],
            ["Endereço:", cliente.endereco || "---"],
            ["Cidade:", cliente.cidade || "---"],
            ["Fone:", cliente.telefone || "---"],
            ["I.E.:", cliente.ie || "---"],
            ["CNPJ/CPF:", cliente.cnpj || "---"],
            ["INSC. MUN.:", cliente.inscricao_estadual || "---"]
        ];

        campos.forEach(([label, valor], i) => {
            doc.setFont("courier", "bold");
            const yTexto = y + i * 6 + 4;
            doc.text(label.toUpperCase(), labelX, yTexto);
            doc.text(String(valor).toUpperCase(), valueX, yTexto);
            doc.setFont("courier", "normal");
        });

        const linhaAltura = campos.length * 6;
        const yClienteBottom = yClienteTop + linhaAltura;
        const coluna1 = margem;
        const coluna2 = margem + 48;
        const coluna3 = margem + 190;

        doc.line(coluna1, yClienteTop, coluna1, yClienteBottom);
        doc.line(coluna3, yClienteTop, coluna3, yClienteBottom);
        doc.line(coluna1, yClienteTop, coluna3, yClienteTop);
        doc.line(coluna1, yClienteBottom, coluna3, yClienteBottom);

        y += campos.length * 6 + 4;
        doc.setFont("courier", "bold");
        doc.text("OBSERVAÇÕES:", labelX, y);
        doc.setFont("courier", "normal");

        const yTabela = y + 20;
        const colX = [margem, margem + 90, margem + 120, margem + 150];
        const colW = [90, 30, 30, 30];
        const altura = 7;

        doc.setFont("courier", "bold");
        doc.rect(colX[0], yTabela, colW[0], altura);
        doc.rect(colX[1], yTabela, colW[1], altura);
        doc.rect(colX[2], yTabela, colW[2], altura);
        doc.rect(colX[3], yTabela, colW[3], altura);
        doc.text("DESCRIÇÃO", colX[0] + 2, yTabela + 5);
        doc.text("QUANT.", colX[1] + 2, yTabela + 5);
        doc.text("VALOR UN.", colX[2] + 2, yTabela + 5);
        doc.text("VALOR TOTAL", colX[3] + 2, yTabela + 5);

        const linhasNecessarias = Math.max(itens.length, 6);
        const desconto = os.desconto || 0;
        const total = itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);

        doc.setFont("courier", "normal");
        for (let i = 0; i < linhasNecessarias; i++) {
            const yLinha = yTabela + altura * (i + 1);
            doc.rect(colX[0], yLinha, colW[0], altura);
            doc.rect(colX[1], yLinha, colW[1], altura);
            doc.rect(colX[2], yLinha, colW[2], altura);
            doc.rect(colX[3], yLinha, colW[3], altura);

            if (i < itens.length) {
                const item = itens[i];
                doc.text(item.descricao.toUpperCase(), colX[0] + 2, yLinha + 5);
                doc.text(String(item.quantidade), colX[1] + 2, yLinha + 5);
                doc.text(formatarValor(item.valor_unitario), colX[2] + 2, yLinha + 5);
                doc.text(formatarValor(item.quantidade * item.valor_unitario), colX[3] + 2, yLinha + 5);
            }
        }

        let yLinha = yTabela + altura * (linhasNecessarias + 1);
        //   doc.setFont("courier", "bold");
        //   doc.rect(colX[2], yLinha, colW[1], altura);
        //   doc.text("DESCONTO R$", colX[2] + 2, yLinha + 5);
        //   doc.setFont("courier", "normal");
        //   doc.text(formatarValor(desconto), colX[3] + 2, yLinha + 5);

        //   yLinha += altura;
        doc.setFont("courier", "bold");
        doc.rect(colX[2], yLinha, colW[2] + colW[3], altura);
        doc.text("TOTAL R$", colX[2] + 2, yLinha + 5);
        doc.setFont("courier", "normal");
        doc.text(formatarValor(total), colX[3] + 2, yLinha + 5);

        yLinha += altura + 0;
        doc.setFont("courier", "bold");
        doc.text("DATA DE ENTREGA:", margem + 0, yLinha);
        doc.setFont("courier", "normal");

        doc.text(formatarData(os.data_entrega), margem + 40, yLinha);

        doc.save(`Recibo_${os.id}.pdf`);
    }


    window.api.buscarOSDetalhada(parseInt(osId)).then(res => {
        if (!res.ok) {
            alert('Erro ao carregar OS.');
            return;
        }

        const { os, cliente, itens } = res;

        window.osDetalhe = os;
        window.clienteDetalhe = cliente;
        window.itensDetalhe = itens;

        if (os.status !== 'Em andamento') {
            document.getElementById('btnCancelar').style.display = 'none';
            document.getElementById('btnFinalizar').style.display = 'none';
        }

        const formatarData = (dataISO) => {
            if (!dataISO) return '';
            const [a, m, d] = dataISO.split('-');
            return `${d}/${m}/${a}`;
        };

        const boolToSimNao = (valor) => valor ? 'Sim' : 'Não';

        document.getElementById('cliente_nome').textContent = cliente.nome_fantasia;
        document.getElementById('cliente_cnpj').textContent = cliente.cnpj;

        document.getElementById('os_id') && (document.getElementById('os_id').textContent = os.id);
        document.getElementById('os_entrada').textContent = formatarData(os.data_entrada);
        document.getElementById('os_entrega').textContent = formatarData(os.data_entrega);
        document.getElementById('os_cores').textContent = os.cores || '-';
        document.getElementById('os_formato').textContent = os.formato || '-';
        document.getElementById('os_pagamento').textContent = os.condicoes_pagamento || '-';
        document.getElementById('os_sulfite').textContent = os.sulfite || '-';
        document.getElementById('os_duplex').textContent = os.duplex || '-';
        document.getElementById('os_couche').textContent = os.couche || '-';
        document.getElementById('os_bond').textContent = os.bond || '-';
        document.getElementById('os_vias').textContent = os.vias || '-';
        document.getElementById('os_picotar').textContent = os.picotar || '-';
        document.getElementById('os_prova').textContent = os.mostrar_prova ? 'Sim' : 'Não';
        document.getElementById('os_alteracao').textContent = os.alteracao ? 'Sim' : 'Não';
        document.getElementById('os_copiativo').textContent = boolToSimNao(os.copiativo);
        document.getElementById('os_so_colado').textContent = boolToSimNao(os.so_colado);
        document.getElementById('os_numeracao').textContent = os.numeracao || '-';

        const tbody = document.getElementById('itens_os');
        itens.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${item.quantidade}</td>
        <td>${item.descricao}</td>
        <td>R$ ${item.valor_unitario.toFixed(2)}</td>
        <td>R$ ${(item.quantidade * item.valor_unitario).toFixed(2)}</td>
      `;
            tbody.appendChild(tr);
        });
    });


    document.getElementById('btnFinalizar').addEventListener('click', () => {
        Swal.fire({
            title: 'Finalizar OS?',
            text: 'Essa ação não pode ser desfeita.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, finalizar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                window.api.atualizarStatusOS(osId, 'Finalizada').then(res => {
                    if (res.ok) {
                        Swal.fire('OS finalizada!', '', 'success').then(() => {
                            window.carregarPagina('ordemServiço/ordens_listagem.html');
                        });
                    } else {
                        Swal.fire('Erro', 'Não foi possível finalizar a OS.', 'error');
                    }
                });
            }
        });
    });

    document.getElementById('btnCancelar').addEventListener('click', () => {
        Swal.fire({
            title: 'Cancelar OS?',
            text: 'Essa ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, cancelar',
            cancelButtonText: 'Voltar'
        }).then(result => {
            if (result.isConfirmed) {
                window.api.atualizarStatusOS(osId, 'Cancelada').then(res => {
                    if (res.ok) {
                        Swal.fire('OS cancelada!', '', 'success').then(() => {
                            window.carregarPagina('ordemServiço/ordens_listagem.html');
                        });
                    } else {
                        Swal.fire('Erro', 'Não foi possível cancelar a OS.', 'error');
                    }
                });
            }
        });
    });


    window.gerarPdfOS = gerarPdfOS;
})();
