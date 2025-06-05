const tabela = document.getElementById('tabelaOS');
console.log(window.api);

window.api.listarOS().then(ordens => {
  ordens.forEach(os => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${os.id}</td>
      <td>${os.cliente}</td>
      <td>${os.data_entrada}</td>
      <td>${os.data_entrega}</td>
      <td>${os.total.toFixed(2)}</td>
      <td>
        <button onclick="alert('Visualizar OS ${os.id}')">👁️</button>
        <button onclick="alert('Editar OS ${os.id}')">✏️</button>
        <button onclick="excluir(${os.id})">🗑️</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
});

function excluir(id) {
  if (confirm('Deseja realmente excluir esta OS?')) {
    window.api.excluirOS(id).then(res => {
      if (res.ok) location.reload();
      else alert('Erro ao excluir');
    });
  }
}
