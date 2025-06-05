const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  salvarCliente: (dados) => ipcRenderer.invoke('salvar-cliente', dados),
  buscarClientes: () => ipcRenderer.invoke('buscar-clientes'),
  salvarOS: (dados) => ipcRenderer.invoke('salvar-os', dados),
  listarOS: () => ipcRenderer.invoke('listar-os'),
  excluirOS: (id) => ipcRenderer.invoke('excluir-os', id)
});
