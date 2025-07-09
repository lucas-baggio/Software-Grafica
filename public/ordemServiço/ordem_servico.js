(() => {
  console.log("Ordem de Serviço JS carregado");

  const formOS = document.getElementById('formOS');
  const clienteSelect = document.getElementById('clienteSelect');
  const itensContainer = document.getElementById('itensContainer');
  const osId = window.osEditId;

  let tomSelectCliente = null;
  let clienteIdParaSelecionar = null;

  window.api.buscarClientes({ pagina: 1, limite: 100 }).then(resposta => {
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


  if (osId) {
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

      formOS.data_entrada.value = os.data_entrada;
      formOS.data_entrega.value = os.data_entrega;
      formOS.prova.value = os.mostrar_prova ? "Sim" : "Não";
      formOS.alteracao.value = os.alteracao ? "sim" : "nao";
      formOS.cores.value = os.cores;
      formOS.sulfite.value = os.sulfite;
      formOS.duplex.value = os.duplex;
      formOS.couche.value = os.couche;
      formOS.bond.value = os.bond;
      formOS.formato.value = os.formato;
      formOS.picotar.value = os.picotar;
      formOS.condicoes_pagamento.value = os.condicoes_pagamento;
      formOS.numeracao.value = os.numeracao;

      formOS.copiativo.checked = !!os.copiativo;
      formOS.so_colado.checked = !!os.so_colado;

      const viasMarcadas = os.vias?.split(',') || [];
      viasMarcadas.forEach(via => {
        const checkbox = document.querySelector(`input[name="vias"][value="${via.trim()}"]`);
        if (checkbox) checkbox.checked = true;
      });

      itens.forEach(item => {
        adicionarItem();
        const itensDOM = document.querySelectorAll('#itensContainer .item');
        const ultimo = itensDOM[itensDOM.length - 1];
        ultimo.querySelector('.quantidade').value = item.quantidade;
        ultimo.querySelector('.descricao').value = item.descricao;
        ultimo.querySelector('.valor_unitario').value = item.valor_unitario;
      });

      window.editandoOS = true;
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
        <input type="number" step="0.01" placeholder="Valor Unitário" class="valor_unitario" required>
      </div>
      <div class="col-1 d-flex align-items-center">
        <button type="button" onclick="this.closest('.item').remove()">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;
    itensContainer.appendChild(div);
  }
  window.adicionarItem = adicionarItem;

  function getViasSelecionadas() {
    const checkboxes = document.querySelectorAll('input[name="vias"]:checked');
    return Array.from(checkboxes).map(cb => cb.value).join(', ');
  }

  formOS.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(formOS);
    const os = Object.fromEntries(formData.entries());

    os.cliente_id = clienteSelect.value;
    os.alteracao = formOS.alteracao.value === "Sim" ? 1 : 0;
    os.mostrar_prova = formOS.prova.value === "Sim" ? 1 : 0;
    os.copiativo = formOS.copiativo.checked ? 1 : 0;
    os.so_colado = formOS.so_colado.checked ? 1 : 0;
    os.vias = getViasSelecionadas();

    const itens = Array.from(itensContainer.querySelectorAll('.item')).map(item => {
      const quantidade = parseInt(item.querySelector('.quantidade').value) || 0;
      const valor_unitario = parseFloat(item.querySelector('.valor_unitario').value) || 0;

      return {
        quantidade,
        descricao: item.querySelector('.descricao').value,
        valor_unitario,
        valor_total: quantidade * valor_unitario
      };
    });

    const somaFinal = itens.reduce((total, item) => total + item.valor_total, 0);

    console.log(os);


    const envio = window.editandoOS
      ? window.api.atualizarOS({ id: osId, os, itens })
      : window.api.salvarOS({ os, itens });

    envio.then(res => {

      if (res.ok) {
        Swal.fire({
          title: 'Sucesso!',
          text: window.editandoOS ? 'Ordem de Serviço atualizada!' : 'Ordem de Serviço salva com sucesso!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        const hoje = new Date().toISOString().split('T')[0];
        console.log(window.editandoOS)

        if (window.editandoOS) {
          console.log(osId);
          

          const caixa = window.api.buscarCaixaPorOs(osId);
          caixa.then(lancamentos => {
            const entradaExistente = lancamentos.find(l => l.tipo === "Entrada");

            if (!entradaExistente) {
              console.warn("Nenhuma entrada existente encontrada para essa OS.");
              return;
            }

            const entradaAtualizada = {
              id: entradaExistente.id,
              ordem_servico_id: parseInt(osId, 10),
              tipo: "Entrada",
              descricao: entradaExistente.descricao || "",
              destinatario: entradaExistente.destinatario || "",
              valor: somaFinal,
              data: hoje
            };

            console.log(entradaAtualizada);
            window.api.atualizarCaixa(entradaAtualizada);
          });
  } else {
    const entrada = {
      "ordem_servico_id": parseInt(res.id, 10),
      "tipo": "Entrada",
      "descricao": "",
      "valor": somaFinal,
      "data": hoje
    }

          console.log(entrada);


    window.api.salvarCaixa(entrada);
  }

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
}) ();
