(() => {
    console.log("RECEBIMENTO")
    const tabela = document.getElementById('tabelaBoletos');
    const paginacao = document.getElementById('paginacao');

    if (!tabela || !paginacao) return;

    let boletos = [];
    let paginaAtual = 1;
    const porPagina = 20;
    let totalPaginas = 1;
    let filtrosAtuais = {};

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
            cliente: filtrosAtuais.cliente,
            data: filtrosAtuais.data
        };

        const { ok, dados = [], total = 0 } = await window.api.buscarContasReceber(filtros);

        if (!ok) {
            alert('Erro ao carregar boletos');
            return;
        }

        boletos = dados;
        totalPaginas = Math.ceil(total / filtros.limite) || 1;

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
                   value="${boleto.valor?.toString().replace('.', ',') || ''}" />

            <input id="vencimento" type="date" class="swal2-input"
                   style="width: 80%; margin: 0 auto; display: block;"
                   value="${boleto.vencimento ? new Date(boleto.vencimento).toISOString().split('T')[0] : ''}" />

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
                    status: boleto.status
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
            data: document.getElementById('filtroDataVencimento').value || null
        };
        paginaAtual = 1;
        carregarBoletos();
    });

    document.getElementById('btnLimparFiltro').addEventListener('click', () => {
        filtrosAtuais = {};
        document.getElementById('filtroCliente').value = '';
        document.getElementById('filtroDataVencimento').value = '';
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

})();
