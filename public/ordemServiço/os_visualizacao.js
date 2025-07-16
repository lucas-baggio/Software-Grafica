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

        const margem = 1;
        const larguraPagina = 209;
        const alturaLinha = 7;
        const alturaUtilPagina = 277;
        let y = 2;

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

        // Borda da página
        doc.setDrawColor(0);
        doc.rect(margem, margem, larguraPagina - 1, 277);

        const topoX = margem;
        const topoY = y - 1;
        const topoW = 208;
        const topoH = 33; // altura total do bloco
        doc.setLineWidth(0.4); // espessura da borda
        doc.roundedRect(topoX, topoY, topoW, topoH, 2, 2); // raio 2mm
        doc.setLineWidth(0.2);

        // // Borda externa do bloco do cabeçalho (logo, dados e RECIBO)
        // doc.setLineWidth(0.8); // negrito
        // doc.roundedRect(margem, y, 190, 34, 2, 2);
        // doc.setLineWidth(0.2); // volta ao padrão


        // Logo
        const logoPath = window.api.join(window.api.appPath, 'logo.png');
        const logoBase64 = window.api.readFileBase64(logoPath);
        const logoDataURL = `data:image/png;base64,${logoBase64}`;
        const whatsappPath = window.api.join(window.api.appPath, 'whatsapp.png');
        const whatsappBase64 = window.api.readFileBase64(whatsappPath);
        const whatsappDataURL = `data:image/png;base64,${whatsappBase64}`;
        doc.addImage(logoDataURL, 'PNG', margem + 2, y, 40, 30);

        // Dados da gráfica
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(10);
        doc.text("Curtolo & Carrilo Gráfica Ltda", margem + 50, y + 4);
        doc.setFont("helvetica", "bolditalic");
        // Parte 1: "CNPJ:"
        doc.setTextColor(200, 0, 0); // vermelho escuro, por exemplo
        doc.text("CNPJ:", margem + 50, y + 9);

        // Parte 2: valor + Insc. Est. + valor
        doc.setTextColor(0, 0, 0); // volta pro preto
        doc.text(" 09.521.624/0001-29      ", margem + 60, y + 9);

        doc.setTextColor(200, 0, 0);
        doc.text("Insc. Est.:", margem + 95, y + 9);

        doc.setTextColor(0, 0, 0); // volta pro preto
        doc.text(" 614.104.128.110", margem + 111, y + 9);

        doc.setFont("helvetica", "bold");

        doc.text("(17) 3631-4165", margem + 50, y + 17);
        doc.text("graficaimage@graficaimage.com.br", margem + 50, y + 22);
        doc.text("Rua 27 nº 739 – Centro – Santa Fé do Sul/SP", margem + 50, y + 27);

        doc.setDrawColor(0); // preto
        doc.setLineWidth(0.5); // mais grosso que o padrão (0.2)
        doc.line(margem + 155, y - 1, margem + 155, y + 32); // (x1, y1, x2, y2)

        // RECIBO e Nº
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("R E C I B O", margem + 158, y + 10);
        doc.setFontSize(14);
        doc.text(`Nº ${String(os.id).padStart(5, '0')}`, margem + 158, y + 24);

        // Caixa de cliente
        y += 34;
        doc.setLineWidth(0.4); // borda bold (opcional)
        doc.roundedRect(margem, y, larguraPagina - 1, 48, 2, 2); // raio 2mm nos cantos
        doc.setLineWidth(0.2);
        doc.setFont("courier", "bold");
        doc.setFontSize(10);
        const escreverLinha = (label, valor, offsetY, x1 = margem + 2, x2 = margem + 50) => {
            doc.text(`${label}`, x1, y + offsetY);
            doc.setFont("courier", "normal");
            doc.text(`${valor || '---'}`, x2, y + offsetY);
            doc.setFont("courier", "bold");
        };

        escreverLinha("Nome Fantasia:", cliente.nome_fantasia?.toUpperCase(), 5);
        escreverLinha("Razão Social:", cliente.razao_social?.toUpperCase(), 10);
        escreverLinha("Endereço:", cliente.endereco?.toUpperCase(), 15);
        escreverLinha("Bairro:", cliente.bairro?.toUpperCase(), 20);
        escreverLinha("Fone/Fax:", cliente.telefone?.toUpperCase(), 25);
        escreverLinha("Cidade:", cliente.cidade?.toUpperCase(), 30);
        escreverLinha("Insc. Estadual:", cliente.inscricao_estadual?.toUpperCase(), 35);
        escreverLinha("CNPJ:", cliente.cnpj?.toUpperCase(), 40);
        escreverLinha("Data Entrada:", formatarData(os.data_entrada), 45, margem + 2, margem + 40);
        escreverLinha("Data Entrega:", formatarData(os.data_entrega), 45, margem + 70, margem + 110);
        escreverLinha("Condições de Pagamento:", os.condicoes_pagamento?.toUpperCase(), 45, margem + 120, margem + 160);

        y += 50;

        // Tabela de Itens
        const colX = [margem, margem + 30, margem + 130, margem + 160];
        const colW = [30, 100, 30, 30];

        // Desenha cabeçalho com borda arredondada em cima
        const desenharCabecalho = () => {
            doc.setFont("courier", "bold");

            // Cabeçalho com borda superior arredondada
            doc.setLineWidth(0.4);
            doc.roundedRect(margem, y, larguraPagina - 1, alturaLinha, 2, 2); // cria todos os cantos arredondados

            // “Apaga” a parte inferior com uma linha preta
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);
            doc.line(margem, y + alturaLinha, margem + larguraPagina - 1, y + alturaLinha); // base reta
            doc.setLineWidth(0.2); // volta ao normal


            // Linhas internas verticais (retas, não arredondadas)
            doc.line(colX[1], y, colX[1], y + alturaLinha); // entre QUANT e DESCRIÇÃO
            doc.line(colX[2], y, colX[2], y + alturaLinha); // entre DESC e VALOR UNIT
            doc.line(colX[3], y, colX[3], y + alturaLinha); // entre VALOR UNIT e VALOR

            // Textos
            doc.text("QUANT", colX[0] + 2, y + 5);
            doc.text("DESCRIÇÃO", colX[1] + 2, y + 5);
            doc.text("VALOR UNIT", colX[2] + 2, y + 5);
            doc.text("VALOR", colX[3] + 2, y + 5);

            y += alturaLinha;
        };

        desenharCabecalho();

        // Corpo dos itens
        let total = 0;
        doc.setFont("courier", "normal");
        doc.setLineWidth(0.4);

        for (const item of itens) {
            if (y + alturaLinha > alturaUtilPagina - alturaLinha * 2) {
                doc.addPage();
                y = margem;
                doc.rect(margem, margem, larguraPagina - 1, 277);
                desenharCabecalho();
            }

            // Linhas horizontais e verticais
            doc.line(margem, y, margem + larguraPagina - 1, y); // linha superior
            doc.line(colX[1], y, colX[1], y + alturaLinha);
            doc.line(colX[2], y, colX[2], y + alturaLinha);
            doc.line(colX[3], y, colX[3], y + alturaLinha);

            const desc = item.descricao.length > 55 ? item.descricao.slice(0, 55) + "..." : item.descricao;
            const valorTotal = item.quantidade * item.valor_unitario;
            total += valorTotal;

            doc.text(String(item.quantidade), colX[0] + 2, y + 5);
            doc.text(desc.toUpperCase(), colX[1] + 2, y + 5);
            doc.text(formatarValor(item.valor_unitario), colX[2] + 2, y + 5);
            doc.text(formatarValor(valorTotal), colX[3] + 2, y + 5);
            y += alturaLinha;
        }

        // Total com fundo bold e borda arredondada inferior
        if (y + alturaLinha > alturaUtilPagina) {
            doc.addPage();
            y = margem;
            doc.rect(margem, margem, larguraPagina, 277);
        }

        // "Valor Total" linha final
        doc.setFont("courier", "bold");

        // Borda inferior arredondada
        doc.setLineWidth(0.4);
        doc.roundedRect(margem, y, larguraPagina - 1, alturaLinha, 2, 2);
        doc.setLineWidth(0.4);
        doc.setDrawColor(0); // preto
        doc.line(margem, y, margem + larguraPagina - 1, y); // linha do topo

        doc.setLineWidth(0.2);

        // Linha vertical de separação do valor final
        doc.line(margem + 160, y, margem + 160, y + alturaLinha);

        // Textos
        doc.text("VALOR TOTAL", margem + 2, y + 5);
        doc.text(formatarValor(total), margem + 165, y + 5);


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
