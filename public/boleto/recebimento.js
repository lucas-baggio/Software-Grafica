(() => {
    console.log("RECEBIMENTO")
    const tabela = document.getElementById('tabelaBoletos');
    const paginacao = document.getElementById('paginacao');

    if (!tabela || !paginacao) return;

    let boletos = [];
    let boletospdf = [];
    let paginaAtual = 1;
    const porPagina = 20;
    let totalPaginas = 1;
    let filtrosAtuais = {};

    // Função para debug
    function logBoletosPdf() {
        console.log('Estado atual de boletospdf:', {
            length: boletospdf?.length || 0,
            sample: boletospdf?.slice(0, 3) || [],
            hasData: Array.isArray(boletospdf) && boletospdf.length > 0
        });
    }

    // Função para testar a API
    async function testarAPI() {
        console.log('=== TESTE DA API ===');
        try {
            const { ok, dados, total } = await window.api.buscarTodasContasReceber();
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

        boletos.forEach(boleto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
            <td>${boleto.id}</td>
            <td>${boleto.cliente_nome || '-'}</td>
            <td>${formatarMoeda(parseFloat(boleto.valor)) || '-'}</td>
            <td>${formatarData(boleto.vencimento) || '-'}</td>
            <td>${formatarData(boleto.data_recebimento) || '-'}</td>
            <td class="status ${(boleto.status || '').toLowerCase().replace(/\s/g, '-')}">${boleto.status || '-'}</td>
            <td>
                <button onclick="visualizarBoleto(${boleto.id})"><span class="material-icons">visibility</span></button>
                <button onclick="editarBoleto(${boleto.id})"><span class="material-icons">edit</span></button>
                <button onclick="excluirBoleto(${boleto.id})"><span class="material-icons">delete</span></button>
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
                carregarBoletos();
            };
            paginacao.appendChild(btn);
        }
    }

    async function carregarBoletos() {
        const filtros = {
            pagina: paginaAtual || 1,
            limite: porPagina || 10,
            cliente: filtrosAtuais.cliente || null,
            data: filtrosAtuais.data || null,
            status: filtrosAtuais.status || null
        };

        const { ok, dados = [], total = 0 } = await window.api.buscarContasReceber(filtros);
        if (!ok) {
            alert('Erro ao carregar boletos');
            return;
        }

        // Buscar todos os boletos para o PDF (sem paginação)
        const { ok: okPdf, dados: dadosPdf = [] } = await window.api.buscarTodasContasReceber();

        // Agora o status já vem atualizado do banco de dados
        boletos = dados;
        boletospdf = dadosPdf;
        
        console.log('Boletos carregados para tabela:', boletos.length);
        console.log('Boletos carregados para PDF:', boletospdf.length);

        totalPaginas = Math.ceil(total / (filtros.limite || 1)) || 1;

        renderizarTabela();
        renderizarPaginacao();
    }

    window.visualizarBoleto = (id) => {
        const boleto = boletos.find(b => b.id === id);
        if (!boleto) return;

        Swal.fire({
            title: `Boleto #${id}`,
            html: `
      <p style="margin: 10px 0;"><strong>Cliente:</strong> ${boleto.cliente_nome}</p>
      <p style="margin: 10px 0;"><strong>Valor:</strong> ${formatarMoeda(boleto.valor)}</p>
      <p style="margin: 10px 0;"><strong>Vencimento:</strong> ${formatarData(boleto.vencimento)}</p>
      <p style="margin: 10px 0;"><strong>Status:</strong> ${boleto.status || '-'}</p>
      <p style="margin: 10px 0;"><strong>Observação:</strong> ${boleto.observacoes || '-'}</p>
    `,
            showDenyButton: boleto.status !== 'Recebido',
            confirmButtonText: 'Fechar',
            denyButtonText: 'Marcar como Recebido'
        }).then(async (result) => {
            if (result.isDenied && boleto.status !== 'Recebido') {
                const { ok } = await window.api.receberConta(boleto.id);
                if (ok) {
                    Swal.fire('Pronto', 'Boleto marcado como recebido!', 'success');
                    carregarBoletos();
                } else {
                    Swal.fire('Erro', 'Não foi possível atualizar o status.', 'error');
                }
            }
        });
    };


    // CRIAR BOLETO
    document.getElementById('btnAdicionarBoleto').addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Adicionar Boleto',
            html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <input id="cliente" class="swal2-input" placeholder="Nome do Cliente" style="width: 80%; margin: 0 auto; display: block;" />
            <input id="valor" type="text" class="swal2-input" placeholder="Valor (ex: 150,75)" style="width: 80%; margin: 0 auto; display: block;" />
            <input id="vencimento" type="date" class="swal2-input" style="width: 80%; margin: 0 auto; display: block;" />
            <select id="status" style="width: 80%; height: 50px; padding: 0 12px; font-size: 1.125em; border: 1px solid #d9d9d9; border-radius: 5px; outline: none; font-family: inherit; box-sizing: border-box; margin: 0 auto; display: block;">
                <option value="Pendente" selected>Pendente</option>
                <option value="Recebido">Recebido</option>
                <option value="Atrasado">Atrasado</option>
            </select>
            <textarea id="observacao" class="swal2-textarea" placeholder="Observações (opcional)" style="width: 80%; resize: vertical; margin: 0 auto; display: block;"></textarea>
        </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',

            didOpen: () => {
                aplicarMascaraValor(document.getElementById('valor'));
            },

            preConfirm: () => {
                const cliente = document.getElementById('cliente')?.value.trim() || document.getElementById('cliente_nome')?.value.trim();
                const raw = document.getElementById('valor').value.trim();
                const vencimento = document.getElementById('vencimento')?.value || document.getElementById('data_vencimento')?.value;
                const observacao = document.getElementById('observacao')?.value || document.getElementById('observacoes')?.value;
                const status = document.getElementById('status')?.value || 'Pendente';

                const regex = /^\d+(,\d{0,4})?$/;
                if (!regex.test(raw)) {
                    Swal.showValidationMessage('Valor inválido. Use até 4 casas decimais.');
                    return false;
                }

                const valor = parseFloat(raw.replace(',', '.'));

                if (!cliente || isNaN(valor) || !vencimento) {
                    Swal.showValidationMessage('Preencha todos os campos corretamente.');
                    return false;
                }

                return {
                    cliente_nome: cliente,
                    valor,
                    vencimento,
                    observacao,
                    status
                };
            }
        });

        if (!formValues) return;

        const payload = {
            cliente_nome: formValues.cliente_nome,
            valor: formValues.valor,
            vencimento: formValues.vencimento,
            status: formValues.status || 'Pendente',
            observacao: formValues.observacao || null
        };

        try {
            const res = await window.api.salvarContaReceber(payload);
            if (res.ok) {
                Swal.fire('Sucesso!', 'Boleto salvo com sucesso.', 'success');
                carregarBoletos();
            } else {
                throw new Error(res.error || 'Erro desconhecido.');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Falha ao salvar o boleto.', 'error');
        }
    });

    // EDITAR BOLETO
    window.editarBoleto = async (id) => {
        const boleto = boletos.find(b => b.id === id);
        if (!boleto) return;

        const { value: formValues } = await Swal.fire({
            title: `Editar Boleto #${id}`,
            html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <input id="cliente_nome" class="swal2-input" placeholder="Nome do Cliente"
                   style="width: 80%; margin: 0 auto; display: block;"
                   value="${boleto.cliente_nome || ''}" />

            <input id="valor" type="text" class="swal2-input" placeholder="Valor (ex: 150,75)"
                   style="width: 80%; margin: 0 auto; display: block;"
                   value="${(parseFloat(boleto.valor) || 0).toFixed(4).replace('.', ',')}" />

            <input id="vencimento" type="date" class="swal2-input"
                   style="width: 80%; margin: 0 auto; display: block;"
                   value="${boleto.vencimento ? new Date(boleto.vencimento).toISOString().split('T')[0] : ''}" />

            <select id="status" style="width: 80%; height: 50px; padding: 0 12px; font-size: 1.125em; border: 1px solid #d9d9d9; border-radius: 5px; outline: none; font-family: inherit; box-sizing: border-box; margin: 0 auto; display: block;">
                <option value="Pendente" ${boleto.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                <option value="Recebido" ${boleto.status === 'Recebido' ? 'selected' : ''}>Recebido</option>
                <option value="Atrasado" ${boleto.status === 'Atrasado' ? 'selected' : ''}>Atrasado</option>
            </select>

            <textarea id="observacao" class="swal2-textarea" placeholder="Observações (opcional)"
                      style="width: 80%; resize: vertical; margin: 0 auto; display: block;">${boleto.observacoes || ''}</textarea>
        </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',

            didOpen: () => {
                aplicarMascaraValor(document.getElementById('valor'));
            },

            preConfirm: () => {
                const cliente = document.getElementById('cliente_nome').value.trim();
                const raw = document.getElementById('valor').value.trim();
                const vencimento = document.getElementById('vencimento').value;
                const observacao = document.getElementById('observacao').value;
                const status = document.getElementById('status').value;

                const regex = /^\d+(,\d{0,4})?$/;
                if (!regex.test(raw)) {
                    Swal.showValidationMessage('Valor inválido. Use até 4 casas decimais.');
                    return false;
                }

                const valor = parseFloat(raw.replace(',', '.'));

                if (!cliente || isNaN(valor) || !vencimento) {
                    Swal.showValidationMessage('Preencha todos os campos corretamente.');
                    return false;
                }

                return {
                    id: boleto.id,
                    cliente_nome: cliente,
                    valor,
                    vencimento,
                    observacao,
                    status // <-- pega o status selecionado
                };
            }
        });

        if (formValues) {
            const res = await window.api.atualizarContaReceber(formValues);
            if (res.ok) {
                Swal.fire('Sucesso', 'Boleto atualizado com sucesso.', 'success');
                carregarBoletos();
            } else {
                Swal.fire('Erro', 'Não foi possível atualizar o boleto.', 'error');
            }
        }
    };


    document.getElementById('btnAplicarFiltro').addEventListener('click', () => {
        filtrosAtuais = {
            cliente: document.getElementById('filtroCliente').value.trim() || null,
            data: document.getElementById('filtroDataVencimento').value || null,
            status: document.getElementById('filtroStatus').value || null
        };
        paginaAtual = 1;
        carregarBoletos();
    });

    document.getElementById('btnLimparFiltro').addEventListener('click', () => {
        filtrosAtuais = {};
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroDataVencimento').value = '';
        document.getElementById('filtroStatus').value = 'Todos'
        paginaAtual = 1;
        carregarBoletos();
    });

    function aplicarMascaraValor(input) {
        input.addEventListener('input', () => {
            let valor = input.value;

            // Remove tudo que não for número ou vírgula
            valor = valor.replace(/[^\d,]/g, '');

            // Se o usuário digitar mais de uma vírgula, ignora as extras
            const partes = valor.split(',');
            const parteInteira = partes[0];
            const parteDecimal = partes[1] ? partes[1].slice(0, 4) : '';

            // Reatribui o valor ao campo
            input.value = partes.length > 1 ? `${parteInteira},${parteDecimal}` : parteInteira;
        });
    }



    document.querySelector('.filter').addEventListener('click', () => {
        const filtros = document.getElementById('filtrosContainer');
        filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
    });

    carregarBoletos();

    document.getElementById('btnAdicionarBoleto').addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Adicionar Boleto',
            html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <input id="cliente" class="swal2-input" placeholder="Nome do Cliente" style="width: 80%; margin: 0 auto; display: block;" />
            <input id="valor" type="text" class="swal2-input" placeholder="Valor (ex: 150,75)" style="width: 80%; margin: 0 auto; display: block;" />
            <input id="vencimento" type="date" class="swal2-input" style="width: 80%; margin: 0 auto; display: block;" />
            <select id="status" style="width: 80%; height: 50px; padding: 0 12px; font-size: 1.125em; border: 1px solid #d9d9d9; border-radius: 5px; outline: none; font-family: inherit; box-sizing: border-box; margin: 0 auto; display: block;">
                <option value="Pendente" selected>Pendente</option>
                <option value="Recebido">Recebido</option>
                <option value="Atrasado">Atrasado</option>
            </select>
            <textarea id="observacao" class="swal2-textarea" placeholder="Observações (opcional)" style="width: 80%; resize: vertical; margin: 0 auto; display: block;"></textarea>
        </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',

            didOpen: () => {
                aplicarMascaraValor(document.getElementById('valor'));
            },

            preConfirm: () => {
                const cliente = document.getElementById('cliente')?.value.trim() || document.getElementById('cliente_nome')?.value.trim();
                const raw = document.getElementById('valor').value.trim();
                const vencimento = document.getElementById('vencimento')?.value || document.getElementById('data_vencimento')?.value;
                const observacao = document.getElementById('observacao')?.value || document.getElementById('observacoes')?.value;
                const status = document.getElementById('status')?.value || 'Pendente';

                const regex = /^\d+(,\d{0,4})?$/;
                if (!regex.test(raw)) {
                    Swal.showValidationMessage('Valor inválido. Use até 4 casas decimais.');
                    return false;
                }

                const valor = parseFloat(raw.replace(',', '.'));

                if (!cliente || isNaN(valor) || !vencimento) {
                    Swal.showValidationMessage('Preencha todos os campos corretamente.');
                    return false;
                }

                return {
                    cliente_nome: cliente,
                    valor,
                    vencimento,
                    observacao,
                    status
                };
            }
        });

        if (!formValues) return;

        const payload = {
            cliente_nome: formValues.cliente_nome,
            valor: formValues.valor,
            vencimento: formValues.vencimento,
            status: formValues.status || 'Pendente',
            observacao: formValues.observacao || null
        };

        try {
            const res = await window.api.salvarContaReceber(payload);
            if (res.ok) {
                Swal.fire('Sucesso!', 'Boleto salvo com sucesso.', 'success');
                carregarBoletos();
            } else {
                throw new Error(res.error || 'Erro desconhecido.');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Falha ao salvar o boleto.', 'error');
        }
    });

    window.excluirBoleto = async (id) => {
        const confirm = await Swal.fire({
            title: 'Excluir Boleto',
            text: `Tem certeza que deseja excluir o boleto #${id}? Esta ação não poderá ser desfeita.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (confirm.isConfirmed) {
            try {
                const res = await window.api.excluirContaReceber(id);
                if (res.ok) {
                    Swal.fire('Excluído!', 'O boleto foi removido com sucesso.', 'success');
                    carregarBoletos();
                } else {
                    throw new Error(res.error || 'Erro desconhecido.');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível excluir o boleto.', 'error');
            }
        }
    };

    document.querySelector('.export-boletos')?.addEventListener('click', async () => {
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
        ${[...Array(12)].map((_, i) => {
                const mm = String(i + 1).padStart(2, '0');
                return `<option value="${mm}">${mm}</option>`;
            }).join('')}
      </select>
      <label for="ano">Ano:</label>
      <input type="number" id="ano" class="swal2-input" value="${new Date().getFullYear()}">
    `,
            preConfirm: () => {
                const mes = document.getElementById('mes')?.value;
                const ano = document.getElementById('ano')?.value;
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

        // ==== Verifica se boletospdf tem dados ====
        logBoletosPdf(); // Debug
        
        if (!boletospdf || boletospdf.length === 0) {
            // Se não tiver dados, busca novamente
            const { ok, dados = [] } = await window.api.buscarTodasContasReceber();
            if (!ok || dados.length === 0) {
                alert('Nenhum boleto encontrado para gerar o relatório.');
                return;
            }
            boletospdf = dados;
            console.log('Dados carregados para PDF:', dados.length);
        }

        // Agora o status já vem atualizado do banco de dados
        const data = boletospdf;

        // ==== Filtra pelo mês/ano escolhidos usando "vencimento" ====
        const alvoMes = parseInt(mes, 10);
        const alvoAno = parseInt(ano, 10);

        const boletosMes = data.filter((b) => {
            const d = parseBR(b?.vencimento);
            if (!d) return false;
            return d.getFullYear() === alvoAno && (d.getMonth() + 1) === alvoMes;
        });

        console.log(`Filtrados ${boletosMes.length} boletos para ${mes}/${ano} de ${data.length} total`);

        if (boletosMes.length === 0) {
            alert(`Nenhum boleto encontrado para o mês ${mes}/${ano}.`);
            return;
        }

        // ==== Monta tabela do PDF ====
        const body = boletosMes.map((b) => [
            b?.id ?? '',
            b?.cliente_nome ?? '',
            formatarData(b?.vencimento),
            b?.status ?? '',
            formatarMoeda(b?.valor)
        ]);

        const totalMes = boletosMes.reduce((acc, b) => acc + brToNumber(b?.valor), 0);

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
        doc.text('Relatório Mensal de Boletos', 105, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Referente a: ${dataRef}`, 15, 25);

        doc.autoTable({
            startY: 30,
            head: [['ID', 'Cliente', 'Vencimento', 'Status', 'Valor (R$)']],
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
                { content: `Total de Boletos: ${boletosMes.length}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
                { content: `Valor Total do Mês: ${formatarMoeda(totalMes)}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
            ]]
        });

        // ==== Abrir/salvar ====
        try {
            const blobUrl = doc.output('bloburl');
            window.open(blobUrl);
        } catch {
            doc.save(`Relatorio_Boletos_${ano}-${mes}.pdf`);
        }
    });


    // Exportar Boletos - DIÁRIO
    document.querySelector('.export-boletos-dia').addEventListener('click', async () => {
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

        const boletosDia = boletos.filter(b => {
            const data = new Date(b.created_at || b.vencimento);
            if (isNaN(data)) return false;
            const dataFormatada = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
            return dataFormatada === dataComparacao;
        });

        const body = boletosDia.map(b => [
            b.id,
            b.cliente_nome,
            formatarData(b.vencimento),
            b.status,
            formatarMoeda(b.valor)
        ]);

        const totalDia = boletosDia.reduce((acc, b) => {
            const valor = parseFloat(b.valor);
            return acc + (isNaN(valor) ? 0 : valor);
        }, 0);

        doc.setFontSize(16);
        doc.text('Relatório Diário de Boletos', 105, 15, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`Emitido em: ${dataRef}`, 15, 25);

        doc.autoTable({
            startY: 30,
            head: [['ID', 'Cliente', 'Vencimento', 'Status', 'Valor (R$)']],
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
                { content: `Total de Boletos: ${boletosDia.length}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
                { content: `Valor Total do Dia: ${formatarMoeda(totalDia)}`, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }
            ]]
        });

        const pdfBlob = doc.output('bloburl');
        window.open(pdfBlob);
    });
    
    // Testa a API para debug
    setTimeout(() => {
        testarAPI();
    }, 1000);
})();
