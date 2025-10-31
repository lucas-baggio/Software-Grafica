(() => {
    const tabela = document.getElementById('tabelaContasPagar');
    const paginacao = document.getElementById('paginacaoContasPagar');

    if (!tabela || !paginacao) return;

    let contas = [];
    let contaspdf = [];
    let paginaAtual = 1;
    const porPagina = 20;
    let totalPaginas = 1;
    let filtrosAtuais = {};

    // Função para debug
    function logContasPdf() {
        console.log('Estado atual de contaspdf:', {
            length: contaspdf?.length || 0,
            sample: contaspdf?.slice(0, 3) || [],
            hasData: Array.isArray(contaspdf) && contaspdf.length > 0
        });
    }

    // Função para testar a API
    async function testarAPI() {
        console.log('=== TESTE DA API PAGAMENTO ===');
        try {
            const { ok, dados, total } = await window.api.buscarTodasContasPagar();
            console.log('Resultado da API:', { ok, total, dados: dados?.length || 0 });
            if (dados && dados.length > 0) {
                console.log('Primeiro registro:', dados[0]);
                console.log('Estrutura dos dados:', Object.keys(dados[0]));
            }
        } catch (error) {
            console.error('Erro ao testar API:', error);
        }
        console.log('=== FIM DO TESTE ===');
    }

    function formatarData(dataISO) {
        if (!dataISO) return '-';
        const data = new Date(dataISO);
        if (isNaN(data)) return '-';
        return data.toLocaleDateString('pt-BR');
    }

    function formatarMoeda(valor) {
        if (valor === null || valor === undefined || valor === '') {
            return 'R$ 0,0000';
        }

        const numero = typeof valor === 'string'
            ? parseFloat(valor.replace(',', '.'))
            : parseFloat(valor);

        return `R$ ${numero.toFixed(4).replace('.', ',')}`;
    }

    function renderizarTabela() {
        tabela.innerHTML = '';
        contas.forEach(conta => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${conta.id}</td>
                <td>${conta.fornecedor_nome || '-'}</td>
                <td>${formatarMoeda(conta.valor) || '-'}</td>
                <td>${formatarData(conta.vencimento) || '-'}</td>
                <td>${formatarData(conta.data_pagamento) || '-'}</td>
                <td class="status ${(conta.status || '').toLowerCase().replace(/\s/g, '-')}">${conta.status || '-'}</td>
                <td>
                    <button onclick="visualizarConta(${conta.id})"><span class="material-icons">visibility</span></button>
                    <button onclick="editarConta(${conta.id})"><span class="material-icons">edit</span></button>
                    <button onclick="excluirConta(${conta.id})"><span class="material-icons">delete</span></button>
                </td>
            `;
            tabela.appendChild(tr);
        });
    }

    function renderizarPaginacao() {
        paginacao.innerHTML = '';
        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
            btn.onclick = () => {
                paginaAtual = i;
                carregarContas();
            };
            paginacao.appendChild(btn);
        }
    }

    async function carregarContas() {
        const filtros = {
            pagina: paginaAtual,
            limite: porPagina,
            fornecedor: filtrosAtuais.fornecedor || '',
            data: filtrosAtuais.data || '',
            status: filtrosAtuais.status || null
        };

        const { ok, dados = [], total = 0 } = await window.api.listarContasPagar(filtros);
        if (!ok) return alert('Erro ao carregar contas a pagar');

        // Buscar todas as contas para o PDF (sem paginação)
        const { ok: okPdf, dados: dadosPdf = [] } = await window.api.buscarTodasContasPagar();

        // Agora o status já vem atualizado do banco de dados
        contas = dados;
        contaspdf = dadosPdf;

        console.log('Contas carregadas para tabela:', contas.length);
        console.log('Contas carregadas para PDF:', contaspdf.length);

        totalPaginas = Math.ceil(total / porPagina) || 1;

        renderizarTabela();
        renderizarPaginacao();
    }


    window.visualizarConta = async (id) => {
        const conta = contas.find(c => c.id === id);
        if (!conta) return;

        const result = await Swal.fire({
            title: `Conta #${id}`,
            html: `
                <p style="margin: 10px 0;"><strong>Fornecedor:</strong> ${conta.fornecedor_nome}</p>
                <p style="margin: 10px 0;"><strong>Valor:</strong> ${formatarMoeda(conta.valor)}</p>
                <p style="margin: 10px 0;"><strong>Vencimento:</strong> ${formatarData(conta.vencimento)}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> ${conta.status}</p>
                <p style="margin: 10px 0;"><strong>Observações:</strong> ${conta.observacoes || '-'}</p>
            `,
            showDenyButton: conta.status !== 'Pago',
            confirmButtonText: 'Fechar',
            denyButtonText: 'Marcar como Pago'
        });

        if (result.isDenied) {
            const { ok } = await window.api.pagarConta(conta.id);
            if (ok) {
                Swal.fire('Pronto', 'Conta marcada como paga!', 'success');
                carregarContas();
            } else {
                Swal.fire('Erro', 'Não foi possível atualizar o status.', 'error');
            }
        }
    };

    window.editarConta = async (id) => {
        const conta = contas.find(c => c.id === id);
        if (!conta) return;

        const { value: formValues } = await Swal.fire({
            title: `Editar Conta #${id}`,
            html: `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <input id="fornecedor" class="swal2-input" placeholder="Fornecedor" value="${conta.fornecedor_nome}" />
                <input id="valor" class="swal2-input" placeholder="Valor" value="${(parseFloat(conta.valor) || 0).toFixed(4).replace('.', ',')}" />
                <input id="vencimento" type="date" class="swal2-input" value="${conta.vencimento ? new Date(conta.vencimento).toISOString().split('T')[0] : ''}" />
                <select id="status" style="width: 80%; height: 50px; padding: 0 12px; font-size: 1.125em; border: 1px solid #d9d9d9; border-radius: 5px; outline: none; font-family: inherit; box-sizing: border-box; margin: 0 auto; display: block;">
                    <option value="Pendente" ${conta.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Pago" ${conta.status === 'Pago' ? 'selected' : ''}>Pago</option>
                    <option value="Atrasado" ${conta.status === 'Atrasado' ? 'selected' : ''}>Atrasado</option>
                </select>
                <textarea id="observacoes" class="swal2-textarea" placeholder="Observações">${conta.observacoes || ''}</textarea>
            </div>
        `,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            focusConfirm: false,
            didOpen: () => {
                const input = document.getElementById('valor');
                input.addEventListener('blur', () => {
                    const raw = input.value.trim().replace(',', '.');
                    const numero = parseFloat(raw);
                    if (!isNaN(numero)) {
                        input.value = numero.toFixed(4).replace('.', ',');
                    }
                });
            },
            preConfirm: () => {
                const raw = document.getElementById('valor').value.trim();
                const valorLimpo = raw.replace(/[^\d,]/g, '').replace(',', '.');
                const numero = parseFloat(raw.replace(',', '.'));
                if (isNaN(numero)) {
                    Swal.showValidationMessage('Valor inválido.');
                    return false;
                }
                const valor = numero.toFixed(4);


                return {
                    id: conta.id,
                    fornecedor_nome: document.getElementById('fornecedor').value.trim(),
                    valor,
                    vencimento: document.getElementById('vencimento').value,
                    observacao: document.getElementById('observacoes').value,
                    status: document.getElementById('status').value // <-- pega o status selecionado
                };
            }
        });

        if (formValues) {
            const res = await window.api.atualizarContaPagar(formValues);
            if (res.ok) {
                Swal.fire('Atualizado!', 'Conta editada com sucesso.', 'success');
                carregarContas();
            } else {
                Swal.fire('Erro', 'Falha ao atualizar.', 'error');
            }
        }
    };


    window.excluirConta = async (id) => {
        const confirm = await Swal.fire({
            title: 'Excluir Conta',
            text: `Tem certeza que deseja excluir a conta #${id}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir'
        });

        if (confirm.isConfirmed) {
            const res = await window.api.excluirContaPagar(id);
            if (res.ok) {
                Swal.fire('Excluído!', 'Conta removida com sucesso.', 'success');
                carregarContas();
            } else {
                Swal.fire('Erro', 'Falha ao excluir.', 'error');
            }
        }
    };

    document.getElementById('btnAplicarFiltroPagar').addEventListener('click', () => {
        filtrosAtuais = {
            fornecedor: document.getElementById('filtroFornecedor').value,
            status: document.getElementById('filtroStatus').value,
            data: document.getElementById('filtroDataVencimento').value
        };
        paginaAtual = 1;
        carregarContas();
    });

    document.getElementById('btnLimparFiltroPagar').addEventListener('click', () => {
        filtrosAtuais = {};
        document.getElementById('filtroFornecedor').value = '';
        document.getElementById('filtroDataVencimento').value = '';
        document.getElementById('filtroStatus').value = 'Todos'
        paginaAtual = 1;
        carregarContas();
    });

    document.querySelector('.filter').addEventListener('click', () => {
        const filtros = document.getElementById('filtrosContainer');
        filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
    });

    carregarContas();

    function parseValorComVirgula(valorStr) {
        const match = valorStr.match(/^(\d+)(,\d{0,4})?$/);
        if (!match) return NaN;
        return parseFloat(valorStr.replace(',', '.'));
    }

    document.getElementById('btnAdicionarContaPagar').addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Adicionar Conta a Pagar',
            html: `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <input id="fornecedor" class="swal2-input" placeholder="Nome do Fornecedor" style="width: 80%; margin: 0 auto; display: block;" />
                <input type="text" id="valor" inputmode="decimal" class="swal2-input" placeholder="Valor (ex: 150,75)" style="width: 80%; margin: 0 auto; display: block;" />
                <input id="vencimento" type="date" class="swal2-input" style="width: 80%; margin: 0 auto; display: block;" />
                <select id="status" style="width: 80%; height: 50px; padding: 0 12px; font-size: 1.125em; border: 1px solid #d9d9d9; border-radius: 5px; outline: none; font-family: inherit; box-sizing: border-box; margin: 0 auto; display: block;">
                    <option value="Pendente" selected>Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                </select>
                <textarea id="observacao" class="swal2-textarea" placeholder="Observações (opcional)" style="width: 80%; resize: vertical; margin: 0 auto; display: block;"></textarea>
            </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',

            didOpen: () => {
                const input = document.getElementById('valor');

                input.addEventListener('input', () => {
                    let valor = input.value;

                    // Remove tudo que não for número ou vírgula
                    valor = valor.replace(/[^\d,]/g, '');

                    // Garante apenas uma vírgula
                    const partes = valor.split(',');
                    const parteInteira = partes[0];
                    let parteDecimal = partes[1] || '';

                    parteDecimal = parteDecimal.slice(0, 4);

                    input.value = valor.includes(',') ? `${parteInteira},${parteDecimal}` : parteInteira;
                });
            },

            preConfirm: () => {
                const fornecedor = document.getElementById('fornecedor').value.trim();
                const raw = document.getElementById('valor').value.trim();
                const vencimento = document.getElementById('vencimento').value;
                const status = document.getElementById('status').value;
                const observacao = document.getElementById('observacao').value;

                const regex = /^\d+(,\d{0,4})?$/;
                if (!regex.test(raw)) {
                    Swal.showValidationMessage('Valor inválido. Use até 4 casas decimais.');
                    return false;
                }

                // ✅ SALVA COMO NÚMERO REAL, NÃO COMO STRING
                const valor = parseFloat(raw.replace(',', '.')) || 0;

                if (!fornecedor || isNaN(valor) || !vencimento) {
                    Swal.showValidationMessage('Preencha todos os campos corretamente.');
                    return false;
                }

                return { fornecedor, valor, vencimento, status, observacao };
            }

        });

        if (!formValues) return;
        const raw = document.getElementById('valor').value.trim();


        const payload = {
            fornecedor_nome: formValues.fornecedor,
            valor: Number(parseFloat(raw.replace(',', '.')).toFixed(4)),
            vencimento: formValues.vencimento,
            status: formValues.status || 'Pendente',
            observacao: formValues.observacao || null
        };

        try {
            const res = await window.api.salvarContaPagar(payload);
            if (res.ok) {
                Swal.fire('Sucesso!', 'Conta salva com sucesso.', 'success');
                carregarContas();
            } else {
                throw new Error(res.error || 'Erro desconhecido.');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Falha ao salvar a conta.', 'error');
        }
    });

    // Exportar Contas a Pagar - MENSAL
    document.querySelector('.export-boletos-pagar').addEventListener('click', async () => {
        // ==== Helpers ====
        const parseBR = (s) => {
            if (!s) return null;
            if (typeof s === 'object' && s instanceof Date) return isNaN(s) ? null : s;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
                const [dd, mm, yyyy] = s.split('/').map(Number);
                return new Date(yyyy, mm - 1, dd); // sem timezone bug
            }
            const d = new Date(s); // ISO ou timestamp
            return isNaN(d) ? null : d;
        };

        const brToNumber = (v) => {
            if (typeof v === 'number') return v;
            if (!v) return 0;
            
            // Se já é um número válido, retorna
            const num = parseFloat(v);
            if (!isNaN(num)) return num;
            
            // Se é string, converte do formato brasileiro (vírgula como decimal)
            const n = parseFloat(String(v).replace(',', '.'));
            return isNaN(n) ? 0 : n;
        };

        const formatarData = (d) => {
            const dt = parseBR(d);
            if (!dt) return '';
            return dt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        };

        const formatarMoeda = (v) => {
            const numero = brToNumber(v);
            return `R$ ${numero.toFixed(4).replace('.', ',')}`;
        };

        // ==== Modal de seleção ====
        const { value: dataSelecionada, isConfirmed } = await Swal.fire({
            title: 'Selecione o mês do relatório',
            html: `
          <label for="mes">Mês:</label>
          <select id="mes" class="swal2-input">
            ${[...Array(12)].map((_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${String(i + 1).padStart(2, '0')}</option>`).join('')}
          </select>
          <label for="ano">Ano:</label>
          <input type="number" id="ano" class="swal2-input" value="${new Date().getFullYear()}">
        `,
            preConfirm: () => {
                const mes = document.getElementById('mes').value;
                const ano = document.getElementById('ano').value;
                if (!mes || !ano) {
                    Swal.showValidationMessage('Informe mês e ano');
                    return false;
                }
                return { mes, ano };
            },
            confirmButtonText: 'Gerar PDF',
            cancelButtonText: 'Cancelar',
            showCancelButton: true,
        });

        if (!isConfirmed || !dataSelecionada) return;
        const { mes, ano } = dataSelecionada;

        // ==== Verifica se contaspdf tem dados ====
        logContasPdf(); // Debug
        
        if (!contaspdf || contaspdf.length === 0) {
            // Se não tiver dados, busca novamente
            const { ok, dados = [] } = await window.api.buscarTodasContasPagar();
            if (!ok || dados.length === 0) {
                alert('Nenhuma conta encontrada para gerar o relatório.');
                return;
            }
            contaspdf = dados;
            console.log('Dados carregados para PDF:', dados.length);
        }

        // Agora o status já vem atualizado do banco de dados
        const data = contaspdf;

        // ==== Filtra pelo mês/ano escolhidos usando "vencimento" ====
        const alvoMes = parseInt(mes, 10);
        const alvoAno = parseInt(ano, 10);

        const contasMes = data.filter((c) => {
            const d = parseBR(c?.vencimento);
            if (!d) return false;
            return d.getFullYear() === alvoAno && (d.getMonth() + 1) === alvoMes;
        });

        console.log(`Filtradas ${contasMes.length} contas para ${mes}/${ano} de ${data.length} total`);

        if (contasMes.length === 0) {
            alert(`Nenhuma conta encontrada para o mês ${mes}/${ano}.`);
            return;
        }

        // ==== Monta tabela do PDF ====
        const body = contasMes.map((c) => [
            c?.id ?? '',
            c?.fornecedor_nome ?? '',
            formatarData(c?.vencimento),
            c?.status ?? '',
            formatarMoeda(c?.valor)
        ]);

        const totalMes = contasMes.reduce((acc, c) => acc + brToNumber(c?.valor), 0);

        // ==== Gera PDF ====
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            alert('jsPDF não foi carregado na página.');
            return;
        }
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        if (typeof doc.autoTable !== 'function') {
            alert('jsPDF-AutoTable não foi carregado. Inclua o plugin antes de gerar a tabela.');
            return;
        }

        const dataRef = `01/${mes}/${ano}`;

        doc.setFontSize(16);
        doc.text('Relatório Mensal de Contas a Pagar', 105, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Referente a: ${dataRef}`, 15, 25);

        doc.autoTable({
            startY: 30,
            head: [['ID', 'Fornecedor', 'Vencimento', 'Status', 'Valor (R$)']],
            body,
            theme: 'striped',
            headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: 'center' },
            styles: { fontSize: 10, halign: 'center', cellPadding: 2 },
            columnStyles: {
                1: { halign: 'left' },
                4: { halign: 'right' }
            },
            margin: { left: 10, right: 10 },
            foot: [[
                { content: `Total de Contas: ${contasMes.length}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
                { content: `Valor Total do Mês: ${formatarMoeda(totalMes)}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
            ]]
        });

        // ==== Abrir/salvar ====
        try {
            const blobUrl = doc.output('bloburl');
            window.open(blobUrl);
        } catch {
            doc.save(`Relatorio_Contas_Pagar_${ano}-${mes}.pdf`);
        }
    });

    // Exportar Contas a Pagar - DIÁRIO
    document.querySelector('.export-boletos-pagar-dia').addEventListener('click', async () => {
        const { value: dataSelecionada } = await Swal.fire({
            title: 'Selecione a data do relatório',
            input: 'date',
            inputLabel: 'Escolha uma data',
            inputValue: new Date().toISOString().split('T')[0],
            showCancelButton: true,
            confirmButtonText: 'Gerar PDF',
            cancelButtonText: 'Cancelar'
        });

        if (!dataSelecionada) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const [ano, mes, dia] = dataSelecionada.split('-');
        const dataComparacao = `${ano}-${mes}-${dia}`;
        const dataRef = `${dia}/${mes}/${ano}`;

        const contasDia = contas.filter(b => {
            const data = new Date(b.vencimento);
            if (isNaN(data)) return false;
            const dataFormatada = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
            return dataFormatada === dataComparacao;
        });

        const body = contasDia.map(b => [
            b.id,
            b.fornecedor_nome,
            formatarData(b.vencimento),
            b.status,
            formatarMoeda(b.valor)
        ]);

        const totalDia = contasDia.reduce((acc, b) => {
            const valor = parseFloat(b.valor);
            return acc + (isNaN(valor) ? 0 : valor);
        }, 0);

        doc.setFontSize(16);
        doc.text('Relatório Diário de Contas a Pagar', 105, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Emitido em: ${dataRef}`, 15, 25);

        doc.autoTable({
            startY: 30,
            head: [['ID', 'Fornecedor', 'Vencimento', 'Status', 'Valor (R$)']],
            body,
            theme: 'striped',
            headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: 'center' },
            styles: { fontSize: 10, halign: 'center', cellPadding: 2 },
            columnStyles: {
                1: { halign: 'left' },
                4: { halign: 'right' }
            },
            margin: { left: 10, right: 10 },
            foot: [[
                { content: `Total de Contas: ${contasDia.length}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
                { content: `Valor Total do Dia: ${formatarMoeda(totalDia)}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
            ]]
        });

        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob);
    });

})();
