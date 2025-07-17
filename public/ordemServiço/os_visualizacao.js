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

        const margem = 5;
        const larguraPagina = 210 - margem * 2; // 200mm úteis
        const alturaLinha = 7;
        const alturaUtilPagina = 297 - margem * 2; // 287mm úteis
        let y = margem + 1;

        const formatarData = (dataISO) => {
            if (!dataISO) return '';
            const data = new Date(dataISO);
            if (isNaN(data)) return '';
            return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
        };

        const formatarValor = (valor) => {
            const valorFixado = Number(valor).toFixed(4); // fixa em 4 casas sem arredondar
            const [inteiro, decimal] = valorFixado.split(".");
            const valorFormatado = new Intl.NumberFormat("pt-BR", {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
            }).format(Number(`${inteiro}.${decimal}`));
            return `R$ ${valorFormatado}`;
        };


        // Borda da página
        doc.setDrawColor(0);
        // doc.rect(margem, margem, larguraPagina, alturaUtilPagina);

        const topoX = margem;
        const topoY = y - 1;
        const topoW = larguraPagina;
        const topoH = 33;
        doc.setLineWidth(0.4);
        doc.roundedRect(topoX, topoY, topoW, topoH, 2, 2);
        doc.setLineWidth(0.2);

        // Logo
        const logoPath = window.api.join(window.api.appPath, 'logo.png');
        const logoBase64 = window.api.readFileBase64(logoPath);
        const logoDataURL = `data:image/png;base64,${logoBase64}`;
        const whatsappPath = window.api.join(window.api.appPath, 'whatsapp.png');
        const whatsappBase64 = window.api.readFileBase64(whatsappPath);
        const whatsappDataURL = `data:image/png;base64,${whatsappBase64}`;
        const emailPath = window.api.join(window.api.appPath, 'email.png');
        const emailBase64 = window.api.readFileBase64(emailPath);
        const emailDataURL = `data:image/png;base64,${emailBase64}`;
        const pingPath = window.api.join(window.api.appPath, 'ping.png');
        const pingBase64 = window.api.readFileBase64(pingPath);
        const pingDataURL = `data:image/png;base64,${pingBase64}`;
        doc.addImage(logoDataURL, 'PNG', margem + 2, y, 40, 30);

        // Dados da gráfica
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(10);
        doc.text("Curtolo & Curtolo Gráfica Ltda", margem + 50, y + 4);
        doc.setTextColor(200, 0, 0);
        doc.text("CNPJ:", margem + 50, y + 9);
        doc.setTextColor(0, 0, 0);
        doc.text("09.521.624/0001-29", margem + 62, y + 9);
        doc.setTextColor(200, 0, 0);
        doc.text("Insc. Est.:", margem + 95, y + 9);
        doc.setTextColor(0, 0, 0);
        doc.text("614.104.128.110", margem + 113, y + 9);

        doc.setFont("helvetica", "bold");
        doc.addImage(whatsappDataURL, 'PNG', margem + 50, y + 14, 4, 4);
        doc.text("(17) 3631-4165", margem + 55, y + 17);
        doc.addImage(emailDataURL, 'PNG', margem + 50, y + 19, 4, 4);
        doc.text("graficaimage@graficaimage.com.br", margem + 55, y + 22);
        doc.addImage(pingDataURL, 'PNG', margem + 50, y + 24, 4, 4);
        doc.text("Rua 27 nº 739 – Centro – Santa Fé do Sul/SP", margem + 55, y + 27);

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margem + 155, y - 1, margem + 155, y + 32);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("R E C I B O", margem + 158, y + 10);
        doc.setFontSize(14);
        doc.text(`Nº ${String(os.id).padStart(5, '0')}`, margem + 166, y + 24);

        y += 34;
        doc.setLineWidth(0.4);
        doc.roundedRect(margem, y, larguraPagina, 48, 2, 2);
        doc.setLineWidth(0.2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        const escreverLinha = (label, valor, offsetY, x1 = margem + 2, x2 = margem + 50, estiloValor = "normal") => {
            doc.setFont("helvetica", estiloValor);
            doc.text(`${label}`, x1, y + offsetY);
            doc.setFont("helvetica", estiloValor);
            doc.text(`${valor || '---'}`, x2, y + offsetY);
        };
        doc.setFont("helvetica", "normal");
        escreverLinha("Nome Fantasia:", cliente.nome_fantasia?.toUpperCase(), 5, margem + 2, margem + 50, "normal");
        escreverLinha("Razão Social:", cliente.razao_social?.toUpperCase(), 10, margem + 2, margem + 50, "normal");
        escreverLinha("Endereço:", cliente.endereco?.toUpperCase(), 15, margem + 2, margem + 50, "normal");
        escreverLinha("Bairro:", cliente.bairro?.toUpperCase(), 20, margem + 2, margem + 50, "normal");
        escreverLinha("Fone/Fax:", cliente.telefone?.toUpperCase(), 25, margem + 2, margem + 50, "normal");
        escreverLinha("Cidade:", cliente.cidade?.toUpperCase(), 30, margem + 2, margem + 50, "normal");
        escreverLinha("Insc. Estadual:", cliente.inscricao_estadual?.toUpperCase(), 35, margem + 2, margem + 50, "normal");
        escreverLinha("CNPJ:", cliente.cnpj?.toUpperCase(), 40, margem + 2, margem + 50, "normal");

        // Datas com valor em negrito
        escreverLinha("Data Entrada:", formatarData(os.data_entrada), 45, margem + 2, margem + 30, "bold");
        escreverLinha("Data Entrega:", formatarData(os.data_entrega), 45, margem + 60, margem + 90, "bold");

        // Condição de pagamento normal
        escreverLinha("Condições de Pagamento:", os.condicoes_pagamento?.toUpperCase(), 45, margem + 110, margem + 160, "normal");



        y += 50;

        function desenharCabecalhoPerfeito(x, y, largura, altura, raio = 2, segmentos = 12) {
            const direita = x + largura;
            const topoY = y;
            const baseY = y + altura;

            doc.setLineWidth(0.4);
            doc.setDrawColor(0);

            // Linha esquerda (reta até o início da curva)
            doc.line(x, baseY, x, topoY + raio);

            // Curva superior esquerda
            let xPrev = x;
            let yPrev = topoY + raio;
            for (let i = 1; i <= segmentos; i++) {
                const angle = (Math.PI / 2) * (i / segmentos);
                const xCurrent = x + raio - raio * Math.cos(angle);
                const yCurrent = topoY + raio - raio * Math.sin(angle);
                doc.line(xPrev, yPrev, xCurrent, yCurrent);
                xPrev = xCurrent;
                yPrev = yCurrent;
            }

            // Linha superior
            doc.line(x + raio, topoY, direita - raio, topoY);

            // Curva superior direita
            xPrev = direita - raio;
            yPrev = topoY;
            for (let i = 1; i <= segmentos; i++) {
                const angle = (Math.PI / 2) * (i / segmentos);
                const xCurrent = direita - raio + raio * Math.sin(angle);
                const yCurrent = topoY + raio - raio * Math.cos(angle);
                doc.line(xPrev, yPrev, xCurrent, yCurrent);
                xPrev = xCurrent;
                yPrev = yCurrent;
            }

            // Linha direita
            doc.line(direita, topoY + raio, direita, baseY);

            // Linha inferior reta
            doc.line(x, baseY, direita, baseY);
        }


        // Tabela de Itens
        const colX = [margem, margem + 30, margem + 130, margem + 160];
        const colW = [30, 100, 30, 30];

        const desenharCabecalho = () => {
            const larguraTotal = colX[3] + 40 - margem;
            desenharCabecalhoPerfeito(margem, y, larguraTotal, alturaLinha, 2, 12);

            // Linhas verticais internas
            doc.line(colX[1], y, colX[1], y + alturaLinha);
            doc.line(colX[2], y, colX[2], y + alturaLinha);
            doc.line(colX[3], y, colX[3], y + alturaLinha);

            // Textos
            doc.setFont("helvetica", "bold");
            doc.text("QUANT", colX[0] + 2, y + 5);
            doc.text("DESCRIÇÃO", colX[1] + 2, y + 5);
            doc.text("VALOR UNIT", colX[2] + 2, y + 5);
            doc.text("VALOR", colX[3] + 2, y + 5);

            y += alturaLinha;
        };

        desenharCabecalho();

        function truncarTexto(doc, texto, larguraMaxima) {
            let truncado = texto;
            while (doc.getTextWidth(truncado + "...") > larguraMaxima && truncado.length > 0) {
                truncado = truncado.slice(0, -1);
            }
            return truncado + (truncado.length < texto.length ? "..." : "");
        }


        // Corpo dos itens
        let total = 0;
        doc.setFont("helvetica", "normal");
        doc.setLineWidth(0.4);

        for (const item of itens) {
            if (y + alturaLinha > alturaUtilPagina - alturaLinha * 2) {
                doc.addPage();
                y = margem;
                doc.rect(margem, margem, larguraPagina - 1, 277);
                desenharCabecalho();
            }

            // Linhas horizontais (superior e inferior da célula)
            doc.line(margem, y, margem + larguraPagina - 1, y); // linha superior
            doc.line(margem, y + alturaLinha, margem + larguraPagina - 1, y + alturaLinha); // linha inferior

            // Linhas verticais (divisórias e bordas laterais)
            doc.line(margem, y, margem, y + alturaLinha); // borda esquerda
            doc.line(colX[1], y, colX[1], y + alturaLinha);
            doc.line(colX[2], y, colX[2], y + alturaLinha);
            doc.line(colX[3], y, colX[3], y + alturaLinha);
            doc.line(colX[3] + 40, y, colX[3] + 40, y + alturaLinha); // borda direita, ajuste se sua última coluna for menor/maior


            const larguraMaximaDescricao = 97; // margem segura
            const desc = truncarTexto(doc, item.descricao.toUpperCase(), larguraMaximaDescricao);
            const valorTotal = item.quantidade * item.valor_unitario;
            total += valorTotal;

            doc.text(String(item.quantidade), colX[0] + 2, y + 5);
            doc.text(desc, colX[1] + 2, y + 5);
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
        // Linha final: VALOR TOTAL
        doc.setFont("helvetica", "bold");
        doc.setLineWidth(0.4);
        doc.setDrawColor(0);

        // Desenha todas as bordas da última linha
        const colFinal = colX[3] + 40; // borda direita total (igual às outras linhas)

        function desenharLinhaValorTotalPerfeita(x, y, largura, altura, raio = 2, segmentos = 12) {
            const direita = x + largura;
            const baseY = y + altura;

            doc.setLineWidth(0.4);
            doc.setDrawColor(0);

            // Linha superior (reta)
            doc.line(x, y, direita, y);

            // Linha direita (reta até o início da curva)
            doc.line(direita, y, direita, baseY - raio);

            // Curva inferior direita
            let xPrev = direita;
            let yPrev = baseY - raio;
            for (let i = 1; i <= segmentos; i++) {
                const angle = (Math.PI / 2) * (i / segmentos); // de 0 a 90 graus
                const xCurrent = direita - raio + raio * Math.cos(angle);
                const yCurrent = baseY - raio + raio * Math.sin(angle);
                doc.line(xPrev, yPrev, xCurrent, yCurrent);
                xPrev = xCurrent;
                yPrev = yCurrent;
            }

            // Linha inferior (reta entre as curvas)
            doc.line(x + raio, baseY, direita - raio, baseY);

            // Curva inferior esquerda
            xPrev = x + raio;
            yPrev = baseY;
            for (let i = 1; i <= segmentos; i++) {
                const angle = (Math.PI / 2) * (i / segmentos); // Ângulo de 0 a 90 graus
                // Ajuste para o quadrante correto: a curva começa em (x+raio, baseY) e vai para (x, baseY-raio)
                // O centro do círculo para esta curva é (x+raio, baseY-raio)
                const xCurrent = x + raio - raio * Math.cos(Math.PI / 2 - angle); // Inverte o ângulo para o quadrante correto
                const yCurrent = baseY - raio + raio * Math.sin(Math.PI / 2 - angle); // Inverte o ângulo para o quadrante correto
                doc.line(xPrev, yPrev, xCurrent, yCurrent);
                xPrev = xCurrent;
                yPrev = yCurrent;
            }

            // Linha esquerda (reta até o topo)
            doc.line(x, baseY - raio, x, y);
        }

        desenharLinhaValorTotalPerfeita(margem, y, colFinal - margem, alturaLinha, 2, 10);

        // Textos
        doc.text("VALOR TOTAL", colX[0] + 2, y + 5);
        doc.text(formatarValor(total), colX[3] + 2, y + 5);


        const especificacoesBrutas = [
            ["Cores:", os.cores],
            ["Sulfite:", os.sulfite],
            ["Duplex:", os.duplex],
            ["Couche:", os.couche],
            ["Adesivo:", os.adesivo],
            ["Bond:", os.bond],
            ["Copia:", os.copiativo],
            ["Vias:", os.vias],
            ["Formato:", os.formato],
            ["Picotar:", os.picotar],
            ["Só colado:", os.so_colado],
            ["Numeração:", os.numeracao]
        ];

        // Transforma os valores: booleans para "Sim"/"Não", nulls para "--"
        const especificacoes = especificacoesBrutas.map(([label, valor]) => {
            let texto;

            if (valor === null || valor === undefined || valor === "") {
                texto = "--";
            } else if (valor === true || valor === 1) {
                texto = "Sim";
            } else if (valor === false || valor === 0) {
                texto = "Não";
            } else {
                texto = String(valor).toUpperCase();
            }

            return [label, texto];
        });

        // Cabeçalho
        y += 13;
        doc.setFont("helvetica", "bold");
        doc.text("ESPECIFICAÇÕES:", margem + 2, y);
        y += 6;

        doc.setFont("helvetica", "normal");

        const col1X = margem + 2;
        const col2X = margem + 105; // metade da página (ajuste se necessário)
        const lineHeight = 6;

        for (let i = 0; i < especificacoes.length; i += 2) {
            const [label1, val1] = especificacoes[i];
            const [label2, val2] = especificacoes[i + 1] || ["", ""];

            doc.setFont("helvetica", "bold");
            doc.text(`${label1}`, col1X, y);
            doc.setFont("helvetica", "normal");
            doc.text(`${val1}`, col1X + 30, y);

            if (label2) {
                doc.setFont("helvetica", "bold");
                doc.text(`${label2}`, col2X, y);
                doc.setFont("helvetica", "normal");
                doc.text(`${val2}`, col2X + 30, y);
            }

            y += lineHeight;
        }
        doc.setDrawColor(150); // cinza claro
        doc.setLineWidth(0.3);
        doc.line(margem + 2, y, larguraPagina - margem - 2, y);
        y += 5; // Espaço entre especificações e observações

        doc.setFont("helvetica", "bold");
        doc.text("OBSERVAÇÕES:", margem + 2, y);

        y += 4; // pequeno espaço após o título // cinza claro

        // Caixa com espaço para escrever
        const alturaObservacoes = 30;

        y += alturaObservacoes + 5; // atualiza o y final caso queira colocar algo depois

        doc.autoPrint();
        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob);
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
