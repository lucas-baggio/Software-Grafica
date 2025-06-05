
const formOS = document.getElementById('formOS');
const clienteSelect = document.getElementById('clienteSelect');
const itensContainer = document.getElementById('itensContainer');

// Preenche a lista de clientes
ipcRenderer.invoke('buscar-clientes').then(clientes => {
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
  div.className = 'item';
  div.innerHTML = `
    <input type="number" placeholder="Quantidade" class="quantidade" required>
    <input type="text" placeholder="Descrição" class="descricao" required>
    <input type="number" step="0.01" placeholder="Valor Unitário" class="valor_unitario" required>
    <button type="button" onclick="this.parentNode.remove()">Remover</button>
    <br><br>
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

  // Trata os itens
  const itens = Array.from(itensContainer.querySelectorAll('.item')).map(item => ({
    quantidade: parseInt(item.querySelector('.quantidade').value),
    descricao: item.querySelector('.descricao').value,
    valor_unitario: parseFloat(item.querySelector('.valor_unitario').value)
  }));

  // Envia para o backend
  ipcRenderer.invoke('salvar-os', { os, itens }).then(res => {
    if (res.ok) {
      alert('✅ Ordem de Serviço salva com sucesso!');
      formOS.reset();
      itensContainer.innerHTML = '';
    } else {
      alert('❌ Erro ao salvar a Ordem de Serviço!');
    }
  });
});
