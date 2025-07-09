console.log("✅ Preload.js carregado");

const fs = require('fs');
const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');

const appPath = process.resourcesPath;

contextBridge.exposeInMainWorld('api', {
  // Clientes
  salvarCliente: (dados) => ipcRenderer.invoke('salvar-cliente', dados),
  buscarClientes: (params) => ipcRenderer.invoke('buscar-clientes', params),
  buscarClientePorId: (id) => ipcRenderer.invoke('buscar-cliente-id', id),
  atualizarCliente: (cliente) => ipcRenderer.invoke('atualizar-cliente', cliente),

  // Ordens de Serviço
  salvarOS: (dados) => ipcRenderer.invoke('salvar-os', dados),
  listarOS: (params) => ipcRenderer.invoke('listar-os', params),
  excluirOS: (id) => ipcRenderer.invoke('excluir-os', id),
  buscarOSDetalhada: (id) => ipcRenderer.invoke('buscar-os-detalhada', id),
  atualizarOS: (dados) => ipcRenderer.invoke('atualizar-os', dados),
  atualizarStatusOS: (id, status) => ipcRenderer.invoke('atualizar-status-os', { id, status }),

  // Impressão
  imprimirPagina: () => ipcRenderer.invoke('imprimir-pagina'),

  // Caixa
  salvarCaixa: (dados) => ipcRenderer.invoke('salvar-caixa', dados),
  atualizarCaixa: (dados) => ipcRenderer.invoke('atualizar-caixa', dados),
  buscarCaixaPorOs: (id) => ipcRenderer.invoke('buscar-caixa-por-os', id),
  buscarCaixa: (params) => ipcRenderer.invoke('buscar-caixa', params),
  deletarCaixa: (id) => ipcRenderer.invoke('excluir-caixa', id),

  // Orçamentos
  salvarOrcamento: (dados) => ipcRenderer.invoke('salvar-orcamento', dados),
  buscarOrcamentos: (params) => ipcRenderer.invoke('buscar-orcamentos', params),
  buscarOrcamentoCompleto: (id) => ipcRenderer.invoke('buscar-orcamento-completo', id),
  atualizarOrcamento: (dados) => ipcRenderer.invoke('atualizar-orcamento', dados),
  excluirOrcamento: (id) => ipcRenderer.invoke('excluir-orcamento', id),
  imprimirOrcamento: (id) => ipcRenderer.invoke('imprimir-orcamento', id),

  readFileBase64: (filePath) => fs.readFileSync(filePath, { encoding: 'base64' }),
  join: (...args) => path.join(...args),
  appPath: appPath

});

contextBridge.exposeInMainWorld('pathInfo', {
  dirname: __dirname
});
