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

  // Boletos / Contas a Receber
  salvarContaReceber: (dados) => ipcRenderer.invoke('salvar-conta-receber', dados),
  buscarContasReceber: (params) => ipcRenderer.invoke('listar-contas-receber', params),
  buscarContaReceberPorId: (id) => ipcRenderer.invoke('buscar-conta-receber-id', id),
  atualizarContaReceber: (dados) => ipcRenderer.invoke('atualizar-conta-receber', dados),
  excluirContaReceber: (id) => ipcRenderer.invoke('excluir-conta-receber', id),
  receberConta: (id) => ipcRenderer.invoke('receber-conta', id),

  salvarContaPagar: (dados) => ipcRenderer.invoke('salvar-conta-pagar', dados),
  listarContasPagar: (filtros) => ipcRenderer.invoke('listar-contas-pagar', filtros),
  pagarConta: (id) => ipcRenderer.invoke('pagar-conta', id),
  buscarContaPagarPorId: (id) => ipcRenderer.invoke('buscar-conta-pagar-id', id),
  atualizarContaPagar: (dados) => ipcRenderer.invoke('atualizar-conta-pagar', dados),
  excluirContaPagar: (id) => ipcRenderer.invoke('excluir-conta-pagar', id),

  // Utilitários
  readFileBase64: (filePath) => fs.readFileSync(filePath, { encoding: 'base64' }),
  join: (...args) => path.join(...args),
  appPath: appPath
});

contextBridge.exposeInMainWorld('pathInfo', {
  dirname: __dirname
});

contextBridge.exposeInMainWorld('atualizador', {
  onMensagem: (callback) => ipcRenderer.on('update-mensagem', (_, msg) => callback(msg)),
  onFinalizar: (callback) => ipcRenderer.on('update-finalizar', callback)
});
