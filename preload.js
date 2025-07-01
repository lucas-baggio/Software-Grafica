console.log("✅ Preload.js carregado");

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  salvarCliente: (dados) => ipcRenderer.invoke('salvar-cliente', dados),
  buscarClientes: () => ipcRenderer.invoke('buscar-clientes'),
  buscarClientePorId: (id) => ipcRenderer.invoke('buscar-cliente-id', id),
  atualizarCliente: (cliente) => ipcRenderer.invoke('atualizar-cliente', cliente),
  salvarOS: (dados) => ipcRenderer.invoke('salvar-os', dados),
  listarOS: () => ipcRenderer.invoke('listar-os'),
  excluirOS: (id) => ipcRenderer.invoke('excluir-os', id),
  buscarOSDetalhada: (id) => ipcRenderer.invoke('buscar-os-detalhada', id),
  atualizarOS: (dados) => ipcRenderer.invoke('atualizar-os', dados),
  imprimirPagina: () => ipcRenderer.invoke('imprimir-pagina'),
  atualizarStatusOS: (id, status) => ipcRenderer.invoke('atualizar-status-os', { id, status }),
  salvarCaixa: (dados) => ipcRenderer.invoke('salvar-caixa', dados),
  buscarCaixa: () => ipcRenderer.invoke('buscar-caixa')
});
