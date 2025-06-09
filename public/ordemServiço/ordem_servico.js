console.log("Ordem de Serviço JS carregado");

const formOS = document.getElementById('formOS');
const clienteSelect = document.getElementById('clienteSelect');
const itensContainer = document.getElementById('itensContainer');

// Preenche a lista de clientes
window.api.buscarClientes().then(clientes => {
  clientes.forEach(cliente => {
    const option = document.createElement('option');
    option.value = cliente.id;
    option.textContent = cliente.nome_fantasia;
    clienteSelect.appendChild(option);
  });
});

// Adiciona item à OS
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
    <div class="col-1" style="display:flex;align-items:center;">
      <button type="button" onclick="this.closest('.item').remove()">🗑️</button>
    </div>
  `;
  itensContainer.appendChild(div);
}
window.adicionarItem = adicionarItem;

// Coleta os valores dos checkboxes de vias
function getViasSelecionadas() {
  const checkboxes = document.querySelectorAll('input[name="vias"]:checked');
  return Array.from(checkboxes).map(cb => cb.value).join(', ');
}

// Trata e envia o formulário
formOS.addEventListener('submit', (e) => {
  e.preventDefault();

  const formData = new FormData(formOS);
  const os = Object.fromEntries(formData.entries());

  os.alteracao = formOS.alteracao.checked ? 1 : 0;
  os.mostrar_prova = formOS.mostrar_prova.checked ? 1 : 0;
  os.copiativo = formOS.copiativo.checked ? 1 : 0;
  os.so_colado = formOS.so_colado.checked ? 1 : 0;
  os.numeracao = formOS.numeracao.checked ? 1 : 0;
  os.vias = getViasSelecionadas();

  const itens = Array.from(itensContainer.querySelectorAll('.item')).map(item => ({
    quantidade: parseInt(item.querySelector('.quantidade').value),
    descricao: item.querySelector('.descricao').value,
    valor_unitario: parseFloat(item.querySelector('.valor_unitario').value)
  }));

  window.api.salvarOS({ os, itens }).then(res => {
    if (res.ok) {
      Swal.fire({
        title: 'Sucesso!',
        text: 'Ordem de Serviço salva com sucesso!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      formOS.reset();
      itensContainer.innerHTML = '';
    } else {
      Swal.fire({
        title: 'Erro!',
        text: 'Não foi possível salvar a Ordem de Serviço.',
        icon: 'error'
      });
    }
  });
});
