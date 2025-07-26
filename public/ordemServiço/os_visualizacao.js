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

    function gerarPdfOS(os, cliente, itens, mostrarTotal = true) {
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
        doc.text("Rua 27 nº 739 – Centro – Santa Fé do Sul/SP - 15775-000", margem + 55, y + 27);

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margem + 155, y - 1, margem + 155, y + 32);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("R E C I B O", margem + 158, y + 10);
        doc.setFontSize(14);
        doc.text(`Nº ${String(os.id).padStart(5, '0')}`, margem + 166, y + 24);

        // Avança para o topo da caixa
        y += 34;
        doc.setLineWidth(0.4);

        // Variável yDados começa logo após o topo da caixa
        let yDados = y + 5;

        // Função que escreve com quebra de linha e retorna altura usada
        function escreverCampoComQuebra(label, valor, yInicial, x1, x2, estilo = "normal", larguraMax = 100, alturaLinha = 5) {
            doc.setFont("courier", estilo);
            doc.setFontSize(10);
            if (!valor) valor = '---';

            const linhas = doc.splitTextToSize(valor, larguraMax);
            doc.text(`${label}`, x1, yInicial);
            linhas.forEach((linha, i) => {
                doc.text(linha, x2, yInicial + (i * alturaLinha));
            });

            return linhas.length * alturaLinha;
        }

        const dataEntradaStr = formatarData(os.data_entrada) || "---";
        const dataEntregaStr = formatarData(os.data_entrega) || "---";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`Data Entrada: ${dataEntradaStr}`, margem + 2, yDados + 1);
        doc.text(`Data Entrega: ${dataEntregaStr}`, margem + 62, yDados + 1);
        doc.text(`Condições de Pagamento: ${os.condicoes_pagamento?.toUpperCase() || "---"}`, margem + 114, yDados + 1);
        yDados += 8; // Espaço após as datas

        // Escreve os campos com quebra e atualiza yDados conforme o conteúdo cresce
        yDados += escreverCampoComQuebra("Nome Fantasia:", cliente.nome_fantasia?.toUpperCase(), yDados, margem + 2, margem + 50);

        // Escreve as datas logo abaixo do Nome Fantasia
        

        // Continua com os outros campos normalmente
        yDados += escreverCampoComQuebra("Razão Social:", cliente.razao_social?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("Endereço:", cliente.endereco?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("Bairro:", cliente.bairro?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("Fone/Fax:", cliente.telefone?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("Fone/Fixo:", cliente.telefone_fixo?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("Cidade:", cliente.cidade?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("Insc. Estadual:", cliente.inscricao_estadual?.toUpperCase(), yDados, margem + 2, margem + 50);
        yDados += escreverCampoComQuebra("CNPJ:", cliente.cnpj?.toUpperCase(), yDados, margem + 2, margem + 50);

        // Agora que yDados final foi calculado, desenha a caixa
        const alturaCaixaCliente = yDados - y + 5;
        doc.roundedRect(margem, y, larguraPagina, alturaCaixaCliente, 2, 2);
        doc.setLineWidth(0.2);

        // Função simples pra campos de linha única
        const escreverLinha = (label, valor, offsetY, xLabel = margem + 2, xInicioValor = margem + 2, estiloValor = "normal") => {
            doc.setFont("helvetica", estiloValor);

            // Escreve o label
            doc.text(label, xLabel, y + offsetY);

            // Calcula largura do label para posicionar o valor com espaçamento
            const larguraLabel = doc.getTextWidth(label);
            const espacamento = 1; // espaço extra entre label e valor
            const xValor = xInicioValor + larguraLabel + espacamento;

            // Escreve o valor logo após o label
            doc.text(valor || '---', xValor, y + offsetY);
        };

        // Atualiza y global
        y = yDados + 5;


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
            const larguraMaximaDescricao = 97;
            const linhasDescricao = doc.splitTextToSize(item.descricao.toUpperCase(), larguraMaximaDescricao);
            const alturaItem = linhasDescricao.length * alturaLinha;

            // Quebra de página se necessário
            if (y + alturaItem > alturaUtilPagina - alturaLinha * 2) {
                doc.addPage();
                y = margem;
                doc.rect(margem, margem, larguraPagina - 1, 277);
                desenharCabecalho();
            }

            const valorTotal = item.quantidade * item.valor_unitario;
            total += valorTotal;

            // Bordas horizontais
            doc.line(margem, y, margem + larguraPagina - 1, y); // topo
            doc.line(margem, y + alturaItem, margem + larguraPagina - 1, y + alturaItem); // base

            // Bordas verticais
            doc.line(margem, y, margem, y + alturaItem); // esquerda
            doc.line(colX[1], y, colX[1], y + alturaItem);
            doc.line(colX[2], y, colX[2], y + alturaItem);
            doc.line(colX[3], y, colX[3], y + alturaItem);
            doc.line(colX[3] + 40, y, colX[3] + 40, y + alturaItem); // direita

            // Textos
            doc.setFont("helvetica", "normal");
            doc.text(String(item.quantidade), colX[0] + 2, y + 5);
            linhasDescricao.forEach((linha, i) => {
                doc.text(linha, colX[1] + 2, y + 5 + i * alturaLinha);
            });
            doc.text(formatarValor(item.valor_unitario), colX[2] + 2, y + 5);
            doc.text(formatarValor(valorTotal), colX[3] + 2, y + 5);

            y += alturaItem;
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
        doc.text(mostrarTotal ? formatarValor(total) : '', colX[3] + 2, y + 5);


        const especificacoesBrutas = [
            ["Cores:", os.cores],
            ["Sulfite:", os.sulfite],
            ["Duplex:", os.duplex],
            ["Couche:", os.couche],
            ["Adesivo:", os.adesivo],
            ["Bond:", os.bond],
            ["Copiativo:", os.copiativo],
            ["Adesivo", os.adesivo],
            ["Vias:", os.vias],
            ["Formato:", os.formato],
            ["Picotar:", os.picotar],
            ["Só colado:", os.so_colado],
            ["Numeração:", os.numeracao],
            ["Prova", os.prova],
            ["Alteração", os.alteracao],
            ["Frente e Verso:", os.FV],
        ];

        // Transforma os valores: booleans para "Sim"/"Não", nulls para "--"
        const especificacoes = especificacoesBrutas.map(([label, valor]) => {
            let texto;

            const labelNormalizado = label.toLowerCase();
            const campoEspecial = ["copiativo", "alteração", "duplex", "sulfite", "couche", "bond"]
                .some(campo => labelNormalizado.includes(campo));

            if (valor === null || valor === undefined || valor === "") {
                texto = "--";
            } else if (campoEspecial && (valor === false || valor === 0 || valor === "0")) {
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

        y += 8; // Espaço entre especificações e observações

        doc.setFont("helvetica", "bold");
        doc.text("OBSERVAÇÕES:", margem + 2, y);

        y += 8;

        const textoObservacao = os.observacao?.trim() || "--";

        // Divide o texto em múltiplas linhas com base na largura disponível
        const linhasObservacao = doc.splitTextToSize(textoObservacao.toUpperCase(), larguraPagina - margem * 2 - 4);

        // Define fonte e estilo
        doc.setFont("helvetica", "normal");

        // Renderiza as linhas de observação uma a uma
        for (const linha of linhasObservacao) {
            doc.text(linha, margem + 2, y);
            y += 6; // espaço entre linhas
        }

        // Caixa com espaço para escrever
        const alturaObservacoes = 30;

        y += alturaObservacoes + 5; // atualiza o y final caso queira colocar algo depois

        doc.autoPrint();
        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob);
    }

    function imprimir(os, cliente, itens) {
        gerarPdfOS(os, cliente, itens, true); // com total

        // Aguarda 1 segundo antes de abrir o segundo
        setTimeout(() => {
            gerarPdfOS(os, cliente, itens, false); // sem total
        }, 1000);
    }

    document.getElementById("btnImprimir").addEventListener("click", () => {
        imprimir(window.osDetalhe, window.clienteDetalhe, window.itensDetalhe);
    });


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
        document.getElementById('os_adesivo').textContent = boolToSimNao(os.adesivo);
        document.getElementById('os_numeracao').textContent = os.numeracao || '-';
        document.getElementById('os_observacao').textContent = os.observacao || '-';
        document.getElementById('os_fv').textContent = os.FV || '-';

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
                // Desabilita o botão para evitar cliques duplos
                const btn = document.getElementById('btnFinalizar');
                btn.disabled = true;

                window.api.atualizarStatusOS(osId, 'Finalizada').then(async res => {
                    if (res.ok) {
                        const hoje = new Date().toISOString().split("T")[0];

                        // ✅ Calcula total com segurança
                        const somaFinal = Array.isArray(window.itensDetalhe)
                            ? window.itensDetalhe.reduce((acc, item) => acc + (item.quantidade * parseFloat(item.valor_unitario || 0)), 0)
                            : 0;

                        const descricaoPadrao = `Recebimento OS #${osId}`;

                        const { value: formValues } = await Swal.fire({
                            title: 'Cadastrar entrada no caixa',
                            html: `
                            <input id="descricao" class="swal2-input" placeholder="Descrição" style="width: 80%;" value="${descricaoPadrao}">
                            <input id="pagamento" class="swal2-input" placeholder="Forma de Pagamento" style="width: 80%;" >
                            <input id="valor" type="number" step="0.0001" class="swal2-input" style="width: 80%;" placeholder="Valor" value="${somaFinal.toFixed(4)}">
                            <input id="data" class="swal2-input" style="width: 80%;" placeholder="Data" type="date">
                        `,
                            focusConfirm: false,
                            showCancelButton: true,
                            confirmButtonText: 'Salvar entrada',
                            cancelButtonText: 'Cancelar',
                            preConfirm: () => {
                                const valor = parseFloat(document.getElementById('valor').value);
                                if (isNaN(valor) || valor <= 0) {
                                    Swal.showValidationMessage('Insira um valor válido maior que zero.');
                                    return false;
                                }

                                return {
                                    descricao: document.getElementById('descricao').value,
                                    valor,
                                    pagamento: document.getElementById('pagamento').value,
                                    data: document.getElementById('data').value
                                };
                            }
                        });

                        if (formValues) {
                            const entrada = {
                                ordem_servico_id: parseInt(osId, 10),
                                tipo: "Entrada",
                                pagamento: formValues.pagamento,
                                descricao: formValues.descricao.trim(),
                                valor: formValues.valor,
                                data: formValues.data
                            };

                            const resCaixa = await window.api.salvarCaixa(entrada);
                            if (resCaixa.ok) {
                                Swal.fire('Entrada registrada com sucesso!', '', 'success').then(() => {
                                    window.carregarPagina('ordemServiço/ordens_listagem.html');
                                });
                            } else {
                                Swal.fire('Erro', 'A OS foi finalizada, mas houve erro ao salvar a entrada.', 'error');
                            }
                        } else {
                            // Se usuário cancelar ou não confirmar a entrada, pode recarregar lista direto
                            window.carregarPagina('ordemServiço/ordens_listagem.html');
                        }
                    } else {
                        Swal.fire('Erro', 'Não foi possível finalizar a OS.', 'error');
                    }

                    btn.disabled = false; // reabilita botão em caso de erro
                }).catch(() => {
                    Swal.fire('Erro', 'Falha na comunicação com o sistema.', 'error');
                    document.getElementById('btnFinalizar').disabled = false;
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
