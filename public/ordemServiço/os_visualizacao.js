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

        const margem = 10;
        const alturaLinha = 7;
        const alturaUtilPagina = 270;

        const formatarData = (dataISO) => {
            if (!dataISO) return '';
            const data = new Date(dataISO);
            if (isNaN(data)) return '';
            return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
        };

        const formatarValor = (valor) => new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);

        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        const desenharBorda = () => {
            doc.setDrawColor(0);
            doc.rect(margem, margem, 190, 270);
        };
        desenharBorda(); // desenha borda na primeira página

        // Cabeçalho
        const logoPath = window.api.join(window.api.appPath, 'logo.png');
        const logoBase64 = window.api.readFileBase64(logoPath);
        const logoDataURL = `data:image/png;base64,${logoBase64}`;
        const whatsappPath = window.api.join(window.api.appPath, 'whatsapp.png');
        const whatsappBase64 = window.api.readFileBase64(whatsappPath);
        const whatsappDataURL = `data:image/png;base64,${whatsappBase64}`;

        doc.addImage(logoDataURL, 'PNG', margem + 2, margem + 2, 45, 30);
        doc.line(margem + 50, margem, margem + 50, margem + 35);

        let xGraf = margem + 65;
        let yGraf = margem + 6;
        doc.text("Telefone: (17) 3631-4165", xGraf, yGraf);
        doc.addImage(whatsappDataURL, 'PNG', 130, 12, 4, 4);
        doc.text("graficaimage@graficaimage.com.br", xGraf, yGraf += 5);
        doc.text("I.E.: 614.104.129.110", xGraf, yGraf += 5);
        doc.text("CNPJ: 09.521.624/0001-29", xGraf, yGraf += 5);
        doc.text("Rua 27, 739 – Centro", xGraf, yGraf += 5);
        doc.text("Santa Fé do Sul - SP", xGraf, yGraf += 5);
        doc.line(margem + 142, margem, margem + 142, margem + 35);

        const xRecibo = margem + 150;
        const yRecibo = margem + 2;
        doc.setFont("courier", "bold");
        doc.text("RECIBO", xRecibo + 5, yRecibo + 7);
        doc.setFont("courier", "normal");
        doc.text(`Nº ${String(os.id).padStart(5, "0")}`, xRecibo + 5, yRecibo + 14);
        // doc.text(`Emissão: ${formatarData(new Date())}`, xRecibo + 5, yRecibo + 19);

        // Dados do cliente
        let y = margem + 35;
        const campos = [
            ["Nome Fantasia:", cliente.nome_fantasia],
            ["Razão Social:", cliente.razao_social || "---"],
            ["Endereço:", cliente.endereco || "---"],
            ["Cidade:", cliente.cidade || "---"],
            ["Fone:", cliente.telefone || "---"],
            ["I.E.:", cliente.inscricao_estadual || "---"],
            ["CNPJ/CPF:", cliente.cnpj || "---"],
            ["INSC. MUN.:", cliente.inscricao_estadual || "---"]
        ];
        campos.forEach(([label, valor], i) => {
            const yTexto = y + i * 6 + 4;
            doc.setFont("courier", "bold");
            doc.text(label.toUpperCase(), margem + 2, yTexto);
            doc.setFont("courier", "normal");
            doc.text(String(valor).toUpperCase(), margem + 50, yTexto);
        });
        y += campos.length * 6 + 12;
        doc.setFont("courier", "bold");
        doc.text("OBSERVAÇÕES:", margem + 2, y);
        y += 12;

        // Tabela de Itens
        const colX = [margem, margem + 90, margem + 120, margem + 150];
        const colW = [90, 30, 30, 30];

        const desenharCabecalhoTabela = () => {
            doc.setFont("courier", "bold");
            doc.rect(colX[0], y, colW[0], alturaLinha);
            doc.rect(colX[1], y, colW[1], alturaLinha);
            doc.rect(colX[2], y, colW[2], alturaLinha);
            doc.rect(colX[3], y, colW[3], alturaLinha);
            doc.text("DESCRIÇÃO", colX[0] + 2, y + 5);
            doc.text("QUANT.", colX[1] + 2, y + 5);
            doc.text("VALOR UN.", colX[2] + 2, y + 5);
            doc.text("VALOR TOTAL", colX[3] + 2, y + 5);
            y += alturaLinha;
        };

        desenharCabecalhoTabela();

        const total = itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);
        for (const item of itens) {
            if (y + alturaLinha > alturaUtilPagina) {
                doc.addPage();
                desenharBorda();

                y = margem;
                desenharCabecalhoTabela();
            }

            doc.setFont("courier", "normal");
            doc.rect(colX[0], y, colW[0], alturaLinha);
            doc.rect(colX[1], y, colW[1], alturaLinha);
            doc.rect(colX[2], y, colW[2], alturaLinha);
            doc.rect(colX[3], y, colW[3], alturaLinha);

            let desc = item.descricao.toUpperCase();
            if (desc.length > 34) desc = desc.slice(0, 34) + "...";

            doc.text(desc, colX[0] + 2, y + 5);
            doc.text(String(item.quantidade), colX[1] + 2, y + 5);
            doc.text(formatarValor(item.valor_unitario), colX[2] + 2, y + 5);
            doc.text(formatarValor(item.quantidade * item.valor_unitario), colX[3] + 2, y + 5);
            y += alturaLinha;
        }

        // Total
        if (y + alturaLinha > alturaUtilPagina) {
            doc.addPage();
            desenharBorda();
            y = margem;
        }
        doc.setFont("courier", "bold");
        doc.rect(colX[2], y, colW[2] + colW[3], alturaLinha);
        doc.text("TOTAL R$", colX[2] + 2, y + 5);
        doc.setFont("courier", "normal");
        doc.text(formatarValor(total), colX[3] + 2, y + 5);
        y += alturaLinha + 5;

        // Data de entrada (logo abaixo da tabela)
        if (y + 10 > alturaUtilPagina) {
            doc.addPage();
            desenharBorda();
            y = margem;
        }
        doc.setFont("courier", "bold");
        doc.text("DATA DE ENTRADA:", margem + 2, y - 7);
        doc.setFont("courier", "normal");
        doc.text(formatarData(os.data_entrada), margem + 40, y - 7);
        y += 10;

        // Especificações e condições (checar altura total estimada)
        const specs = [
            `Cores: ${os.cores || '---'}`,
            `Sulfite: ${os.sulfite ? 'Sim' : 'Não'}`,
            `Duplex: ${os.duplex ? 'Sim' : 'Não'}`,
            `Couchê: ${os.couche ? 'Sim' : 'Não'}`,
            `Adesivo: ${os.adesivo ? 'Sim' : 'Não'}`,
            `Bond: ${os.bond ? 'Sim' : 'Não'}`,
            `Copiativo: ${os.copiativo ? 'Sim' : 'Não'}`,
            `Vias: ${os.vias || '---'}`,
            `Formato: ${os.formato || '---'}`,
            `Picotar: ${os.picotar ? 'Sim' : 'Não'}`,
            `Só colado: ${os.so_colado ? 'Sim' : 'Não'}`,
            `Numeração: ${os.numeracao || '---'}`
        ];
        const alturaFinal = specs.length * 5 + 25;

        if (y + alturaFinal > alturaUtilPagina) {
            doc.addPage();
            desenharBorda();
            y = margem + 20;
        }

        // Data de entrega
        doc.setFont("courier", "bold");
        doc.text("DATA DE ENTREGA:", margem + 2, y);
        doc.setFont("courier", "normal");
        doc.text(formatarData(os.data_entrega), margem + 40, y);
        y += 10;

        // Especificações
        doc.setFont("courier", "bold");
        doc.text("ESPECIFICAÇÕES:", margem + 2, y);
        doc.setFont("courier", "normal");
        specs.forEach((linha, i) => {
            doc.text(linha, margem + 5, y + 6 + i * 5);
        });
        y += specs.length * 5 + 10;

        // Condições
        doc.setFont("courier", "bold");
        doc.text("CONDIÇÕES DE PAGAMENTO:", margem + 2, y);
        doc.setFont("courier", "normal");
        doc.text(os.condicoes_pagamento || "---", margem + 5, y + 5);

        // Finaliza
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

        function formatarData(dataISO) {
            if (!dataISO) return '';

            const data = new Date(dataISO);
            if (isNaN(data)) return '';

            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();

            return `${dia}/${mes}/${ano}`;
        }


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
        <td>R$ ${Number(item.valor_unitario).toFixed(4)}</td>
        <td>R$ ${(item.quantidade * Number(item.valor_unitario)).toFixed(4)}</td>
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
