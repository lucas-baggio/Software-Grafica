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

    function gerarPdfOS(os, cliente, itens) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

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

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('GRÁFICA', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Ordem de Serviço', 105, 28, { align: 'center' });
        doc.line(15, 32, 195, 32); 

        let y = 40;
        doc.setFont(undefined, 'bold');
        doc.text(`OS Nº:`, 15, y);
        doc.text(`Cliente:`, 15, y + 8);
        doc.text(`CNPJ:`, 15, y + 16);
        doc.text(`Entrada:`, 120, y);
        doc.text(`Entrega:`, 120, y + 8);

        doc.setFont(undefined, 'normal');
        doc.text(`${os.id}`, 35, y);
        doc.text(`${cliente.nome_fantasia}`, 35, y + 8);
        doc.text(`${cliente.cnpj}`, 35, y + 16);
        doc.text(`${formatarData(os.data_entrada)}`, 145, y);
        doc.text(`${formatarData(os.data_entrega)}`, 145, y + 8);

        doc.autoTable({
            startY: y + 25,
            head: [['Qtd.', 'Descrição', 'Valor Unitário', 'Subtotal']],
            body: itens.map(item => [
                item.quantidade,
                item.descricao,
                formatarValor(item.valor_unitario),
                formatarValor(item.quantidade * item.valor_unitario)
            ]),
            styles: { halign: 'center', fontSize: 11 },
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
            columnStyles: {
                1: { halign: 'left' }, 
            }
        });

        const total = itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);
        const yTotal = doc.lastAutoTable.finalY + 10;
        doc.setFont(undefined, 'bold');
        doc.text(`Total Geral: ${formatarValor(total)}`, 190, yTotal, { align: 'right' });

        doc.setFont(undefined, 'bold');
        doc.text('Condições de Pagamento:', 15, yTotal + 10);
        doc.setFont(undefined, 'normal');
        doc.text(os.condicoes_pagamento || '---', 15, yTotal + 16);

        doc.line(15, 260, 105, 260);
        doc.text('Assinatura do Cliente', 15, 265);

        const dataHoje = new Date();
        const dataStr = dataHoje.toLocaleDateString('pt-BR');
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Emitido em: ${dataStr}`, 15, 285);
        doc.text('Gráfica • Santa Fé do Sul/SP', 105, 285, { align: 'center' });

        doc.save(`OS_${os.id}.pdf`);
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
        document.getElementById('os_numeracao').textContent = boolToSimNao(os.numeracao);

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
