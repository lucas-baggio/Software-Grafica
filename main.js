const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { conectarDB, getPool } = require('./db/db');
const { autoUpdater } = require('electron-updater');

// Menu.setApplicationMenu(null);

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('🔍 Verificando atualizações...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow(`⬇️ Atualização disponível: v${info.version}. Baixando...`);
});

autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('✅ Nenhuma atualização encontrada.');
});

autoUpdater.on('download-progress', (progress) => {
  const porcentagem = progress.percent.toFixed(1);
  sendStatusToWindow(`📦 Baixando atualização... ${porcentagem}%`);
});

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('🚀 Atualização pronta! Reiniciando...');

  const janela = BrowserWindow.getAllWindows()[0];
  if (janela) {
    janela.webContents.send('update-finalizar'); // avisa o renderer para mostrar isso no SweetAlert
  }

  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 3000);
});

function safeString(str) {
  return typeof str === 'string'
    ? Buffer.from(str, 'binary').toString('utf8')
    : str;
}



autoUpdater.on('error', (err) => {
  sendStatusToWindow(`❌ Erro ao atualizar: ${err.message}`);
});


// Envia mensagens para o renderer
function sendStatusToWindow(texto) {
  const janela = BrowserWindow.getAllWindows()[0];
  if (janela) {
    janela.webContents.send('update-mensagem', texto);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      additionalArguments: [`--appPath=${__dirname}`]
    }
  });
  win.maximize();
  win.loadFile('public/layout.html');
}

app.whenReady().then(async () => {
  await conectarDB();
  createWindow();
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 1000);
});

ipcMain.handle('salvar-cliente', async (_, dados) => {
  const db = getPool();

  const query = `INSERT INTO clientes (
    nome_fantasia, razao_social, endereco, bairro,
    cidade, uf, telefone, telefone_fixo, inscricao_estadual, cnpj
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const [result] = await db.execute(query, [
    dados.nome_fantasia,
    dados.razao_social,
    dados.endereco,
    dados.bairro,
    dados.cidade,
    dados.uf,
    dados.telefone,
    dados.telefone_fixo,
    dados.inscricao_estadual,
    dados.cnpj
  ]);

  return { ok: true, id: result.insertId };
});

ipcMain.handle('buscar-clientes', async (_, params) => {
  const db = getPool();

  const pagina = Number.isInteger(parseInt(params?.pagina)) ? parseInt(params.pagina) : 1;
  const limite = Number.isInteger(parseInt(params?.limite)) ? parseInt(params.limite) : 20;
  const offset = (pagina - 1) * limite;

  const filtros = [];
  const valores = [];

  if (params?.nome) {
    filtros.push('LOWER(nome_fantasia) LIKE ?');
    valores.push(`%${params.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}%`);
  }

  if (params?.cnpj) {
    filtros.push('LOWER(cnpj) LIKE ?');
    valores.push(`%${params.cnpj.toLowerCase()}%`);
  }

  if (params?.telefone) {
    filtros.push('(LOWER(telefone) LIKE ? OR LOWER(telefone_fixo) LIKE ?)');
    const tel = `%${params.telefone.toLowerCase()}%`;
    valores.push(tel, tel);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

  const query = `
  SELECT id, nome_fantasia, cnpj, telefone, telefone_fixo, razao_social
  FROM clientes
  ${where}
  ORDER BY nome_fantasia ASC
  LIMIT ${limite} OFFSET ${offset}
`;

  const queryParams = [...valores]; // sem limite e offset

  try {
    console.log('SQL final:', query);
    console.log('Params finais:', queryParams);

    const [clientes] = await db.execute(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM clientes
      ${where}
    `;
    const [[{ total }]] = await db.execute(countQuery, valores);

    return { ok: true, clientes, total };
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    return { ok: false, error: 'Erro ao buscar clientes' };
  }
});




ipcMain.handle('buscar-cliente-id', async (_, id) => {
  const db = getPool();
  const [[row]] = await db.execute(`SELECT * FROM clientes WHERE id = ?`, [id]);
  return row;
});

ipcMain.handle('atualizar-cliente', async (_, cliente) => {
  const db = getPool();
  const query = `
    UPDATE clientes SET
      nome_fantasia = ?, razao_social = ?, endereco = ?, bairro = ?, cidade = ?, uf = ?,
      telefone = ?, inscricao_estadual = ?, cnpj = ?
    WHERE id = ?
  `;
  await db.execute(query, [
    cliente.nome_fantasia,
    cliente.razao_social,
    cliente.endereco,
    cliente.bairro,
    cliente.cidade,
    cliente.uf,
    cliente.telefone,
    cliente.inscricao_estadual,
    cliente.cnpj,
    cliente.id
  ]);
  return { ok: true };
});

ipcMain.handle('atualizar-status-os', async (_, { id, status }) => {
  const db = getPool();
  await db.execute(`UPDATE ordens_servico SET status = ? WHERE id = ?`, [status, id]);
  return { ok: true };
});

ipcMain.handle('salvar-os', async (_, { os, itens }) => {
  const db = getPool();

  // Converte strings vazias em null para evitar erro de data
  if (os.data_entrega === '') os.data_entrega = null;
  if (os.data_entrada === '') os.data_entrada = null;

  const insertOS = `INSERT INTO ordens_servico (
    cliente_id, data_entrada, data_entrega, alteracao, mostrar_prova, cores,
    sulfite, duplex, couche, adesivo, bond, copiativo, vias, formato,
    picotar, so_colado, numeracao, condicoes_pagamento, observacao
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const [osResult] = await db.execute(insertOS, [
    os.cliente_id,
    os.data_entrada,
    os.data_entrega,
    os.alteracao,
    os.mostrar_prova,
    os.cores,
    os.sulfite || null,
    os.duplex || null,
    os.couche || null,
    os.adesivo || null,
    os.bond || null,
    os.copiativo,
    os.vias,
    os.formato,
    os.picotar || null,
    os.so_colado || null,
    os.numeracao || null,
    os.condicoes_pagamento,
    os.observacao
  ]);

  const ordemId = osResult.insertId;

  const insertItem = `INSERT INTO itens_ordem (
    ordem_servico_id, quantidade, descricao, valor_unitario, valor_total
  ) VALUES (?, ?, ?, ?, ?)`;

  const promises = itens.map(item => {
    const total = item.quantidade * item.valor_unitario;
    return db.execute(insertItem, [ordemId, item.quantidade, item.descricao, item.valor_unitario, total]);
  });

  await Promise.all(promises);

  return { ok: true, id: ordemId };
});

ipcMain.handle('listar-os', async (_, params) => {
  const db = getPool();

  const pagina = Number.isInteger(parseInt(params?.pagina)) ? parseInt(params.pagina) : 1;
  const limite = Number.isInteger(parseInt(params?.limite)) ? parseInt(params.limite) : 20;
  const offset = (pagina - 1) * limite;

  const filtros = [];
  const valores = [];

  if (params?.cliente) {
    filtros.push('LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(' +
      'c.nome_fantasia, "á", "a"), "à", "a"), "â", "a"), "ã", "a"), "é", "e"), "ê", "e"), "í", "i"), "ó", "o"), "ô", "o"), "ú", "u")) LIKE ?');

    const clienteNormalizado = params.cliente
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    valores.push(`%${clienteNormalizado}%`);
  }

  if (params?.entrada) {
    filtros.push('os.data_entrada = ?');
    valores.push(params.entrada);
  }

  if (params?.entrega) {
    filtros.push('os.data_entrega = ?');
    valores.push(params.entrega);
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const query = `
    SELECT 
      os.id,
      os.data_entrada,
      os.data_entrega,
      os.status,
      os.created_at,
      c.nome_fantasia AS cliente,
      COALESCE(SUM(io.valor_total), 0) AS total
    FROM ordens_servico os
    JOIN clientes c ON c.id = os.cliente_id
    LEFT JOIN itens_ordem io ON io.ordem_servico_id = os.id
    ${where}
    GROUP BY 
      os.id, os.data_entrada, os.data_entrega,
      os.status, os.created_at, c.nome_fantasia
    ORDER BY os.id DESC
    LIMIT ${limite} OFFSET ${offset}
  `;

  const queryParams = [...valores]; // apenas os filtros

  try {
    const [ordens] = await db.execute(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ordens_servico os
      JOIN clientes c ON c.id = os.cliente_id
      ${where}
    `;
    const [[{ total }]] = await db.execute(countQuery, valores); // mesma lógica

    return { ok: true, ordens, total };
  } catch (error) {
    console.error('❌ Erro ao listar OS com filtros e paginação:', error);
    return { ok: false, ordens: [], total: 0 };
  }
});


ipcMain.handle('imprimir-pagina', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  try {
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      marginsType: 1
    });

    const { filePath } = await dialog.showSaveDialog(win, {
      title: 'Salvar PDF da Ordem de Serviço',
      defaultPath: 'ordem_servico.pdf',
      filters: [{ name: 'PDFs', extensions: ['pdf'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, pdfData);
    }
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
  }
});

ipcMain.handle('atualizar-os', async (_, { id, os, itens }) => {
  const db = getPool();

  await db.execute(`
  UPDATE ordens_servico SET
    cliente_id = ?, data_entrada = ?, data_entrega = ?, alteracao = ?, mostrar_prova = ?, cores = ?,
    sulfite = ?, duplex = ?, couche = ?, adesivo = ?, bond = ?, copiativo = ?, vias = ?, formato = ?,
    picotar = ?, so_colado = ?, numeracao = ?, condicoes_pagamento = ?, observacao = ?
  WHERE id = ?
`, [
    os.cliente_id ?? null,
    os.data_entrada || null,
    os.data_entrega || null,
    os.alteracao ?? false,
    os.mostrar_prova ?? false,
    os.cores || null,
    os.sulfite ?? 0,
    os.duplex ?? 0,
    os.couche ?? 0,
    os.adesivo ?? 0,
    os.bond ?? 0,
    os.copiativo ?? false,
    os.vias ?? null,
    os.formato || null,
    os.picotar || null,
    os.so_colado ?? false,
    os.numeracao || null,
    os.condicoes_pagamento || null,
    os.observacao,
    id
  ]);

  await db.execute(`DELETE FROM itens_ordem WHERE ordem_servico_id = ?`, [id]);

  const insertItem = `INSERT INTO itens_ordem (
    ordem_servico_id, quantidade, descricao, valor_unitario, valor_total
  ) VALUES (?, ?, ?, ?, ?)`;

  const promises = itens.map(item => {
    const total = item.quantidade * item.valor_unitario;
    return db.execute(insertItem, [id, item.quantidade, item.descricao, item.valor_unitario, total]);
  });

  await Promise.all(promises);

  return { ok: true };
});

ipcMain.handle('buscar-os-detalhada', async (_, id) => {
  const db = getPool();

  const [[os]] = await db.execute(`SELECT * FROM ordens_servico WHERE id = ?`, [id]);
  if (!os) return { ok: false };

  const [[cliente]] = await db.execute(`SELECT * FROM clientes WHERE id = ?`, [os.cliente_id]);
  if (!cliente) return { ok: false };

  const [itens] = await db.execute(`SELECT * FROM itens_ordem WHERE ordem_servico_id = ?`, [id]);

  return { ok: true, os, cliente, itens };
});

ipcMain.handle('excluir-os', async (_, id) => {
  const db = getPool();

  await db.execute(`DELETE FROM caixa WHERE ordem_servico_id = ?`, [id]);

  await db.execute(`DELETE FROM itens_ordem WHERE ordem_servico_id = ?`, [id]);

  await db.execute(`DELETE FROM ordens_servico WHERE id = ?`, [id]);

  return { ok: true };
});


ipcMain.handle('salvar-caixa', async (_, lancamento) => {
  const db = getPool();
  const query = `
    INSERT INTO caixa (ordem_servico_id, tipo, descricao, pagamento, destinatario, valor, data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    lancamento.ordem_servico_id ?? null,
    lancamento.tipo ?? null,
    lancamento.descricao ?? null,
    lancamento.pagamento ?? null,
    lancamento.destinatario ?? null,
    lancamento.valor ?? null,
    lancamento.data || new Date().toISOString().split('T')[0]
  ];

  const [result] = await db.execute(query, params);
  return { ok: true, id: result.insertId };
});

ipcMain.handle('buscar-caixa-por-os', async (_, ordemServicoId) => {
  const db = getPool();
  const [rows] = await db.execute(`
    SELECT 
      id,
      ordem_servico_id,
      tipo,
      descricao,
      destinatario,
      pagamento,
      valor,
      data
    FROM caixa
    WHERE ordem_servico_id = ?
    ORDER BY data DESC, id DESC
  `, [ordemServicoId]);

  return rows;
});

ipcMain.handle('atualizar-caixa', async (_, lancamento) => {
  const db = getPool();
  const query = `
    UPDATE caixa
    SET 
      ordem_servico_id = ?,
      tipo = ?,
      descricao = ?,
      destinatario = ?,
      valor = ?,
      data = ?
    WHERE id = ?
  `;

  const params = [
    lancamento.ordem_servico_id,
    lancamento.tipo,
    lancamento.descricao,
    lancamento.destinatario,
    lancamento.valor,
    lancamento.data || new Date().toISOString().split('T')[0],
    lancamento.id
  ];

  const [result] = await db.execute(query, params);
  return { ok: true, changes: result.affectedRows };
});

ipcMain.handle('buscar-caixa', async (_, { pagina = 1, limite = 20 }) => {
  const db = getPool();
  const page = parseInt(pagina);
  const perPage = parseInt(limite);
  const offset = (page - 1) * perPage;

  try {
    const query = `
      SELECT
      caixa.id,
      caixa.ordem_servico_id,
      caixa.tipo,
      caixa.descricao,
      caixa.destinatario,
      caixa.valor,
      caixa.data,
      caixa.pagamento,
      CASE
        WHEN caixa.tipo = 'Entrada' THEN clientes.nome_fantasia
        ELSE caixa.destinatario
      END AS nome_exibicao
    FROM caixa
    LEFT JOIN ordens_servico ON caixa.ordem_servico_id = ordens_servico.id
    LEFT JOIN clientes ON ordens_servico.cliente_id = clientes.id
    WHERE caixa.ordem_servico_id IS NULL OR ordens_servico.status = 'Finalizada'
    ORDER BY caixa.data DESC, caixa.id DESC
    LIMIT ${perPage} OFFSET ${offset}

    `;

    const [dados] = await db.execute(query);
    const [[{ total }]] = await db.execute(`
      SELECT COUNT(*) as total
      FROM caixa
      LEFT JOIN ordens_servico ON caixa.ordem_servico_id = ordens_servico.id
      WHERE caixa.ordem_servico_id IS NULL OR ordens_servico.status = 'Finalizada'
    `);


    return { ok: true, dados, total };
  } catch (error) {
    console.error('❌ Erro ao buscar caixa:', error);
    return { ok: false, dados: [], total: 0 };
  }
});

ipcMain.handle('excluir-caixa', async (_, id) => {
  const db = getPool();
  const [result] = await db.execute(`DELETE FROM caixa WHERE id = ?`, [id]);
  return { ok: true };
});

ipcMain.handle('salvar-orcamento', async (_, { orcamento, itens }) => {
  const db = getPool();

  const insertOrcamento = `
    INSERT INTO orcamentos (cliente_nome, cliente_cnpj, observacoes)
    VALUES (?, ?, ?)
  `;

  const [result] = await db.execute(insertOrcamento, [
    orcamento.cliente_nome,
    orcamento.cliente_cnpj,
    orcamento.observacoes
  ]);

  const orcamentoId = result.insertId;

  const insertItem = `
    INSERT INTO itens_orcamento (orcamento_id, quantidade, descricao, valor_unitario, valor_total)
    VALUES (?, ?, ?, ?, ?)
  `;

  const promises = itens.map(item => {
    return db.execute(insertItem, [
      orcamentoId,
      item.quantidade,
      item.descricao,
      item.valor_unitario,
      item.valor_total
    ]);
  });

  await Promise.all(promises);

  return { ok: true };
});

ipcMain.handle('buscar-orcamentos', async (_, { pagina = 1, limite = 20, cliente = '', data = '' }) => {
  const db = getPool();
  const offset = (parseInt(pagina) - 1) * parseInt(limite);
  const limit = parseInt(limite);

  const where = [];
  const params = [];

  if (cliente) {
    where.push(`o.cliente_nome LIKE ?`);
    params.push(`%${cliente}%`);
  }

  if (data) {
    where.push(`DATE(o.data) = ?`);
    params.push(data);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const query = `
      SELECT o.id, o.data, o.cliente_nome, o.cliente_cnpj
      FROM orcamentos o
      ${whereSQL}
      ORDER BY o.data DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM orcamentos o
      ${whereSQL}
    `;

    const [orcamentos] = await db.execute(query, params);
    const [[{ total }]] = await db.execute(countQuery, params);

    return { ok: true, orcamentos, total };
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos:', error);
    return { ok: false, orcamentos: [], total: 0 };
  }
});


ipcMain.handle('buscar-orcamento-completo', async (_, id) => {
  const db = getPool();

  const [[orcamento]] = await db.execute(`SELECT * FROM orcamentos WHERE id = ?`, [id]);
  if (!orcamento) return null;

  const [itens] = await db.execute(`SELECT * FROM itens_orcamento WHERE orcamento_id = ?`, [id]);

  return { orcamento, itens };
});

ipcMain.handle('excluir-orcamento', async (_, id) => {
  const db = getPool();

  await db.execute(`DELETE FROM itens_orcamento WHERE orcamento_id = ?`, [id]);
  await db.execute(`DELETE FROM orcamentos WHERE id = ?`, [id]);

  return { ok: true };
});

ipcMain.handle('atualizar-orcamento', async (_, { id, orcamento, itens }) => {
  const db = getPool();

  await db.execute(
    `UPDATE orcamentos SET cliente_nome = ?, cliente_cnpj = ?, observacoes = ? WHERE id = ?`,
    [orcamento.cliente_nome, orcamento.cliente_cnpj, orcamento.observacoes, id]
  );

  await db.execute(`DELETE FROM itens_orcamento WHERE orcamento_id = ?`, [id]);

  const insertItem = `
    INSERT INTO itens_orcamento (orcamento_id, quantidade, descricao, valor_unitario, valor_total)
    VALUES (?, ?, ?, ?, ?)
  `;

  const promises = itens.map(item => {
    return db.execute(insertItem, [
      id,
      item.quantidade,
      item.descricao,
      item.valor_unitario,
      item.valor_total
    ]);
  });

  await Promise.all(promises);

  return { ok: true };
});

ipcMain.handle('salvar-conta-receber', async (_, conta) => {
  const db = getPool();

  const query = `
    INSERT INTO contas_receber (
      cliente_nome, valor, vencimento, data_recebimento, status, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const clienteNome = conta.cliente_nome ?? 'Desconhecido';
  const valor = conta.valor ?? 0;
  const vencimento = conta.vencimento ?? null;
  const dataRecebimento = conta.data_recebimento ?? null;
  const status = conta.status ?? 'Pendente';
  const observacoes = conta.observacao ?? null;

  const [result] = await db.execute(query, [
    clienteNome,
    valor,
    vencimento,
    dataRecebimento,
    status,
    observacoes
  ]);

  return { ok: true, id: result.insertId };
});

ipcMain.handle('listar-contas-receber', async (_, filtros = {}) => {
  const db = getPool();

  const pagina = parseInt(filtros.pagina) || 1;
  const limite = parseInt(filtros.limite) || 20;
  const offset = (pagina - 1) * limite;

  const where = [];
  const params = [];

  if (filtros.cliente) {
    where.push(`cr.cliente_nome LIKE ?`);
    params.push(`%${filtros.cliente}%`);
  }

  if (filtros.status) {
    where.push(`cr.status = ?`);
    params.push(filtros.status);
  }

  if (filtros.data) {
    where.push(`DATE(cr.vencimento) = ?`);
    params.push(filtros.data);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    SELECT 
      cr.id,
      cr.cliente_nome,
      cr.valor,
      cr.vencimento,
      cr.data_recebimento,
      cr.status,
      cr.observacoes
    FROM contas_receber cr
    ${whereSQL}
    ORDER BY cr.vencimento ASC
    LIMIT ${limite} OFFSET ${offset}
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM contas_receber cr
    ${whereSQL}
  `;

  try {
    const [dados] = await db.execute(query, params);
    const [[{ total }]] = await db.execute(countQuery, params);

    return { ok: true, dados, total };
  } catch (err) {
    console.error('❌ Erro ao listar contas a receber:', err);
    return { ok: false, dados: [], total: 0 };
  }
});


ipcMain.handle('receber-conta', async (_, id) => {
  const db = getPool();

  const hoje = new Date().toISOString().split('T')[0];

  const query = `
    UPDATE contas_receber
    SET status = 'Recebido', data_recebimento = ?
    WHERE id = ?
  `;

  await db.execute(query, [hoje, id]);

  return { ok: true };
});

ipcMain.handle('buscar-contas-receber', async (_, id) => {
  const db = getPool();
  const [[conta]] = await db.execute(`
    SELECT * FROM contas_receber WHERE id = ?
  `, [id]);

  return { ok: !!conta, conta };
});

ipcMain.handle('atualizar-conta-receber', async (_, dados) => {
  const db = getPool();

  const query = `
    UPDATE contas_receber SET
      cliente_nome = ?, valor = ?, vencimento = ?, 
      data_recebimento = ?, status = ?, observacoes = ?
    WHERE id = ?
  `;

  const params = [
    dados.cliente_nome ?? null,
    dados.valor ?? null,
    dados.vencimento ?? null,
    dados.data_recebimento ?? null,
    dados.status ?? null,
    dados.observacao ?? null,
    dados.id ?? null
  ];

  await db.execute(query, params);
  return { ok: true };
});

ipcMain.handle('excluir-conta-receber', async (_, id) => {
  const db = getPool();
  await db.execute('DELETE FROM contas_receber WHERE id = ?', [id]);
  return { ok: true };
});

ipcMain.handle('salvar-conta-pagar', async (_, conta) => {
  const db = getPool();

  const query = `
    INSERT INTO contas_pagar (
      fornecedor_nome, valor, vencimento, data_pagamento, status, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const fornecedor = conta.fornecedor_nome ?? 'Desconhecido';
  const valor = conta.valor ?? 0;
  const vencimento = conta.vencimento ?? null;
  const dataPagamento = conta.data_pagamento ?? null;
  const status = conta.status ?? 'Pendente';
  const observacoes = conta.observacao ?? null;

  const [result] = await db.execute(query, [
    fornecedor,
    valor,
    vencimento,
    dataPagamento,
    status,
    observacoes
  ]);

  return { ok: true, id: result.insertId };
});

ipcMain.handle('listar-contas-pagar', async (_, filtros = {}) => {
  const db = getPool();

  const pagina = parseInt(filtros.pagina) || 1;
  const limite = parseInt(filtros.limite) || 20;
  const offset = (pagina - 1) * limite;

  const where = [];
  const params = [];

  if (filtros.fornecedor) {
    where.push(`cp.fornecedor_nome LIKE ?`);
    params.push(`%${filtros.fornecedor}%`);
  }

  if (filtros.status) {
    where.push(`cp.status = ?`);
    params.push(filtros.status);
  }

  if (filtros.data) {
    where.push(`DATE(cp.vencimento) = ?`);
    params.push(filtros.data);
  }

  const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    SELECT 
      cp.id,
      cp.fornecedor_nome,
      cp.valor,
      cp.vencimento,
      cp.data_pagamento,
      cp.status,
      cp.observacoes
    FROM contas_pagar cp
    ${whereSQL}
    ORDER BY cp.vencimento ASC
    LIMIT ${limite} OFFSET ${offset}
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM contas_pagar cp
    ${whereSQL}
  `;

  try {
    const [dados] = await db.execute(query, params);
    const [[{ total }]] = await db.execute(countQuery, params);

    return { ok: true, dados, total };
  } catch (err) {
    console.error('❌ Erro ao listar contas a pagar:', err);
    return { ok: false, dados: [], total: 0 };
  }
});


ipcMain.handle('pagar-conta', async (_, id) => {
  const db = getPool();
  const hoje = new Date().toISOString().split('T')[0];

  const query = `
    UPDATE contas_pagar
    SET status = 'Pago', data_pagamento = ?
    WHERE id = ?
  `;

  await db.execute(query, [hoje, id]);
  return { ok: true };
});


ipcMain.handle('buscar-conta-pagar', async (_, id) => {
  const db = getPool();
  const [[conta]] = await db.execute(`
    SELECT * FROM contas_pagar WHERE id = ?
  `, [id]);

  return { ok: !!conta, conta };
});


ipcMain.handle('atualizar-conta-pagar', async (_, dados) => {
  const db = getPool();

  const query = `
    UPDATE contas_pagar SET
      fornecedor_nome = ?, valor = ?, vencimento = ?, 
      data_pagamento = ?, status = ?, observacoes = ?
    WHERE id = ?
  `;

  const params = [
    dados.fornecedor_nome ?? null,
    dados.valor ?? null,
    dados.vencimento ?? null,
    dados.data_pagamento ?? null,
    dados.status ?? null,
    dados.observacao ?? null,
    dados.id ?? null
  ];

  await db.execute(query, params);
  return { ok: true };
});


ipcMain.handle('excluir-conta-pagar', async (_, id) => {
  const db = getPool();
  await db.execute('DELETE FROM contas_pagar WHERE id = ?', [id]);
  return { ok: true };
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
