(() => {
  console.log("Ordem de Serviço JS carregado");

  const formOS = document.getElementById('formOS');
  const clienteSelect = document.getElementById('clienteSelect');
  // formOS.prova.addEventListener('change', () => {
  //   if (formOS.prova.value === "Sim" && formOS.alteracao.value.toLowerCase() === "sim") {
  //     formOS.alteracao.value = "nao";
  //   }
  // });

  // formOS.alteracao.addEventListener('change', () => {
  //   if (formOS.alteracao.value.toLowerCase() === "sim" && formOS.prova.value === "Sim") {
  //     formOS.prova.value = "Não";
  //   }
  // });


  const itensContainer = document.getElementById('itensContainer');

  const osId = localStorage.getItem('osEditId');
  if (osId) localStorage.removeItem('osEditId'); // Remove imediatamente após carregar

  const editando = !!osId;
  window.editandoOS = editando;
  window.osEditId = osId;

  let tomSelectCliente = null;
  let clienteIdParaSelecionar = null;

  window.api.buscarClientes({ pagina: 1, limite: 1000 }).then(resposta => {
    if (!resposta.ok) {
      console.error("Erro ao buscar clientes");
      return;
    }

    const { clientes } = resposta;

    clientes.forEach(cliente => {
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

    if (clienteIdParaSelecionar) {
      tomSelectCliente.setValue(clienteIdParaSelecionar);
    }
  });

  if (editando) {
    window.api.buscarOSDetalhada(parseInt(osId)).then(res => {
      if (!res.ok) {
        alert('Erro ao buscar OS para edição');
        return;
      }

      const { os, itens } = res;

      clienteIdParaSelecionar = os.cliente_id;
      if (tomSelectCliente) {
        tomSelectCliente.setValue(clienteIdParaSelecionar);
      }

      formOS.data_entrada.value = os.data_entrada ? new Date(os.data_entrada).toISOString().split('T')[0] : '';
      formOS.data_entrega.value = os.data_entrega ? new Date(os.data_entrega).toISOString().split('T')[0] : '';

      formOS.prova.value = os.mostrar_prova ? "Sim" : "Não";
      formOS.alteracao.value = os.alteracao ? "sim" : "nao";

      formOS.prova.addEventListener('change', () => {
        if (formOS.prova.value === "Sim") {
          formOS.alteracao.value = "nao";
        }
      });

      formOS.alteracao.addEventListener('change', () => {
        if (formOS.alteracao.value.toLowerCase() === "sim") {
          formOS.prova.value = "Não";
        }
      });

      formOS.cores.value = os.cores;
      formOS.sulfite.value = os.sulfite;
      formOS.duplex.value = os.duplex;
      formOS.couche.value = os.couche;
      formOS.bond.value = os.bond;
      formOS.formato.value = os.formato;
      formOS.picotar.value = os.picotar;
      formOS.condicoes_pagamento.value = os.condicoes_pagamento;
      formOS.numeracao.value = os.numeracao;
      formOS.observacao.value = os.observacao;
      formOS.FV.value = os.FV;

      formOS.copiativo.checked = !!os.copiativo;
      formOS.adesivo.checked = !!os.adesivo;
      formOS.so_colado.checked = !!os.so_colado;

      formOS.vias.value = os.vias || "";

      itens.forEach(item => {
        adicionarItem();
        const itensDOM = document.querySelectorAll('#itensContainer .item');
        const ultimo = itensDOM[itensDOM.length - 1];
        ultimo.querySelector('.quantidade').value = item.quantidade;
        ultimo.querySelector('.descricao').value = item.descricao;
        ultimo.querySelector('.valor_unitario').value = parseFloat(item.valor_unitario).toFixed(4).replace('.', ',');
      });
    });
  }

  function adicionarItem() {
    const div = document.createElement('div');
    div.className = 'item row';
    div.innerHTML = `
    <div class="col-2">
      <input type="number" placeholder="Quantidade" class="quantidade" required>
    </div>
    <div class="col-6">
      <input type="text" placeholder="Descrição" class="descricao" required>
    </div>
    <div class="col-3">
      <input type="text" placeholder="Valor Unitário" class="valor_unitario" required>
    </div>
    <div class="col-1 d-flex align-items-center">
      <button type="button" onclick="this.closest('.item').remove()">
        <span class="material-icons">delete</span>
      </button>
    </div>
  `;

    const inputValor = div.querySelector('.valor_unitario');

    inputValor.addEventListener('input', function () {
      // Remove caracteres inválidos, exceto dígitos e vírgula
      let valor = this.value.replace(/[^\d,]/g, '');

      const partes = valor.split(',');

      if (partes.length > 2) {
        // Se tiver mais de uma vírgula, remove as extras
        valor = partes[0] + ',' + partes[1];
      } else if (partes.length === 2 && partes[1].length > 4) {
        // Limita a parte decimal a no máximo 4 dígitos
        partes[1] = partes[1].substring(0, 4);
        valor = partes[0] + ',' + partes[1];
      }

      this.value = valor;
    });

    inputValor.addEventListener('blur', function () {
      let valor = this.value.replace(',', '.');
      const numero = parseFloat(valor);

      if (!isNaN(numero)) {
        this.value = numero.toFixed(4).replace('.', ',');
      } else {
        this.value = '';
      }
    });

    itensContainer.appendChild(div);
  }

  window.adicionarItem = adicionarItem;

  formOS.addEventListener('submit', async (e) => {
    e.preventDefault();

    const erros = [];

    // Valida cliente
    if (!clienteSelect.value) {
      erros.push('Selecione um cliente.');
    }

    // Valida data de entrada
    if (!formOS.data_entrada.value) {
      erros.push('Informe a data de entrada.');
    }

    // Valida se há pelo menos um item
    const itensDOM = itensContainer.querySelectorAll('.item');
    if (itensDOM.length === 0) {
      erros.push('Adicione pelo menos um item.');
    }

    // Valida campos de cada item
    itensDOM.forEach((item, index) => {
      const qtd = item.querySelector('.quantidade').value.trim();
      const desc = item.querySelector('.descricao').value.trim();
      const val = item.querySelector('.valor_unitario').value.trim();

      if (!qtd || isNaN(parseInt(qtd))) erros.push(`Item ${index + 1}: Quantidade inválida.`);
      if (!desc) erros.push(`Item ${index + 1}: Descrição obrigatória.`);
      if (!val || isNaN(parseFloat(val.replace(',', '.')))) erros.push(`Item ${index + 1}: Valor unitário inválido.`);
    });

    // Exibe os erros, se houver
    if (erros.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Verifique os campos:',
        html: `<ul style="text-align:left">${erros.map(e => `<li>${e}</li>`).join('')}</ul>`,
        confirmButtonText: 'Corrigir'
      });
      return;
    }

    // Captura dados do formulário
    const formData = new FormData(formOS);
    const os = Object.fromEntries(formData.entries());

    os.cliente_id = clienteSelect.value;
    os.alteracao = formOS.alteracao.value === "Sim" ? 1 : 0;
    os.mostrar_prova = formOS.prova.value === "Sim" ? 1 : 0;

    formOS.prova.addEventListener('change', () => {
      if (formOS.prova.value === "Sim") {
        formOS.alteracao.value = "nao";
      }
    });

    formOS.alteracao.addEventListener('change', () => {
      if (formOS.alteracao.value.toLowerCase() === "sim") {
        formOS.prova.value = "Não";
      }
    });

    os.copiativo = formOS.copiativo.checked ? 1 : 0;
    os.so_colado = formOS.so_colado.checked ? 1 : 0;
    os.adesivo = formOS.adesivo.checked ? 1 : 0;
    os.vias = formOS.vias.value || "";
    os.FV = formOS.FV.value || "";
    os.observacao = formOS.observacao.value || "";

    const itens = Array.from(itensDOM).map(item => {
      const quantidade = parseInt(item.querySelector('.quantidade').value) || 0;
      const valor_unitario = parseFloat(item.querySelector('.valor_unitario').value.replace(',', '.')) || 0;

      return {
        quantidade,
        descricao: item.querySelector('.descricao').value,
        valor_unitario,
        valor_total: parseFloat((quantidade * valor_unitario).toFixed(4))
      };
    });

    const somaFinal = parseFloat(itens.reduce((total, item) => total + item.valor_total, 0).toFixed(4));

    const hoje = new Date().toISOString().split('T')[0];

    const envio = editando
      ? window.api.atualizarOS({ id: osId, os, itens })
      : window.api.salvarOS({ os, itens });

    envio.then(async res => {
      if (res.ok) {
        await Swal.fire({
          title: 'Sucesso!',
          text: editando ? 'Ordem de Serviço atualizada!' : 'Ordem de Serviço salva com sucesso!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        window.editandoOS = false;
        window.osEditId = null;
        localStorage.removeItem('osEditId');

        formOS.reset();
        itensContainer.innerHTML = '';
        if (tomSelectCliente) tomSelectCliente.clear();
        clienteIdParaSelecionar = null;
      } else {
        Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível salvar a Ordem de Serviço.',
          icon: 'error'
        });
      }
    });
  });

  window.addEventListener('beforeunload', () => {
    if (window.editandoOS) {
      localStorage.removeItem('osEditId');
    }
  });


})();
