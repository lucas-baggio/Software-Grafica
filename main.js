const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const db = require('./db/db');

// Menu.setApplicationMenu(null);

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

app.whenReady().then(createWindow);

ipcMain.handle('salvar-cliente', async (_, dados) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO clientes (
      nome_fantasia, razao_social, endereco, bairro,
      cidade, uf, telefone, inscricao_estadual, cnpj
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      dados.nome_fantasia,
      dados.razao_social,
      dados.endereco,
      dados.bairro,
      dados.cidade,
      dados.uf,
      dados.telefone,
      dados.inscricao_estadual,
      dados.cnpj
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error(err);
        resolve({ ok: false });
      } else {
        resolve({ ok: true, id: this.lastID });
      }
    });
  });
});

ipcMain.handle('buscar-clientes', async (_, { pagina = 1, limite = 20 }) => {
  return new Promise((resolve) => {
    const offset = (pagina - 1) * limite;

    db.all(`SELECT id, nome_fantasia, cnpj, telefone, razao_social FROM clientes LIMIT ? OFFSET ?`, [limite, offset], (err, rows) => {
      if (err) {
        console.error(err);
        resolve({ ok: false, clientes: [], total: 0 });
      } else {
        db.get(`SELECT COUNT(*) as total FROM clientes`, (err2, result) => {
          if (err2) {
            console.error(err2);
            resolve({ ok: false, clientes: [], total: 0 });
          } else {
            resolve({ ok: true, clientes: rows, total: result.total });
          }
        });
      }
    });
  });
});


ipcMain.handle('buscar-cliente-id', async (_, id) => {
  return new Promise((resolve) => {
    db.get(`SELECT * FROM clientes WHERE id = ?`, [id], (err, row) => {
      if (err) {
        console.error(err);
        resolve(null);
      } else {
        resolve(row);
      }
    });
  });
});

ipcMain.handle('atualizar-cliente', async (_, cliente) => {
  return new Promise((resolve) => {
    const query = `
      UPDATE clientes SET
        nome_fantasia = ?, razao_social = ?, endereco = ?, bairro = ?, cidade = ?, uf = ?,
        telefone = ?, inscricao_estadual = ?, cnpj = ?
      WHERE id = ?
    `;
    const params = [
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
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error(err);
        resolve({ ok: false });
      } else {
        resolve({ ok: true });
      }
    });
  });
});

ipcMain.handle('atualizar-status-os', async (_, { id, status }) => {
  return new Promise(resolve => {
    db.run(`UPDATE ordens_servico SET status = ? WHERE id = ?`, [status, id], function (err) {
      if (err) {
        console.error(err);
        return resolve({ ok: false });
      }
      resolve({ ok: true });
    });
  });
});


ipcMain.handle('salvar-os', async (_, { os, itens }) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO ordens_servico (
      cliente_id, data_entrada, data_entrega, alteracao, mostrar_prova, cores,
      sulfite, duplex, couche, adesivo, bond, copiativo, vias, formato,
      picotar, so_colado, numeracao, condicoes_pagamento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        os.cliente_id, os.data_entrada, os.data_entrega, os.alteracao, os.mostrar_prova, os.cores,
        os.sulfite || 0, os.duplex || 0, os.couche || 0, os.adesivo || 0, os.bond || 0, os.copiativo,
        os.vias, os.formato, os.picotar, os.so_colado, os.numeracao, os.condicoes_pagamento
      ],
      function (err) {
        if (err) {
          console.error(err);
          resolve({ ok: false });
        } else {
          const ordemId = this.lastID;

          const stmt = db.prepare(`INSERT INTO itens_ordem (
          ordem_servico_id, quantidade, descricao, valor_unitario, valor_total
        ) VALUES (?, ?, ?, ?, ?)`);

          for (const item of itens) {
            const total = item.quantidade * item.valor_unitario;
            stmt.run(ordemId, item.quantidade, item.descricao, item.valor_unitario, total);
          }

          stmt.finalize();
          resolve({ ok: true, id: ordemId });
        }
      });
  });
});

ipcMain.handle('listar-os', async (_, params) => {
  const pagina = params?.pagina || 1;
  const limite = params?.limite || 20;
  const offset = (pagina - 1) * limite;

  return new Promise((resolve) => {
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
      GROUP BY 
        os.id, os.data_entrada, os.data_entrega,
        os.status, c.nome_fantasia
      ORDER BY os.id DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [limite, offset], (err, rows) => {
      if (err) {
        console.error("Erro ao listar OS:", err);
        resolve({ ok: false, ordens: [], total: 0 });
      } else {
        db.get(`SELECT COUNT(*) AS total FROM ordens_servico`, (err2, result) => {
          const total = result?.total || 0;
          resolve({ ok: true, ordens: rows, total });
        });
      }
    });
  });
});


ipcMain.handle('imprimir-pagina', async (event) => {
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
  return new Promise((resolve) => {
    db.run(`UPDATE ordens_servico SET
      cliente_id = ?, data_entrada = ?, data_entrega = ?, alteracao = ?, mostrar_prova = ?, cores = ?,
      sulfite = ?, duplex = ?, couche = ?, adesivo = ?, bond = ?, copiativo = ?, vias = ?, formato = ?,
      picotar = ?, so_colado = ?, numeracao = ?, condicoes_pagamento = ?
      WHERE id = ?`,
      [
        os.cliente_id, os.data_entrada, os.data_entrega, os.alteracao, os.mostrar_prova, os.cores,
        os.sulfite || 0, os.duplex || 0, os.couche || 0, os.adesivo || 0, os.bond || 0, os.copiativo,
        os.vias, os.formato, os.picotar, os.so_colado, os.numeracao, os.condicoes_pagamento,
        id
      ],
      function (err) {
        if (err) return resolve({ ok: false });

        db.run(`DELETE FROM itens_ordem WHERE ordem_servico_id = ?`, [id], function (err2) {
          if (err2) return resolve({ ok: false });

          const stmt = db.prepare(`INSERT INTO itens_ordem (
            ordem_servico_id, quantidade, descricao, valor_unitario, valor_total
          ) VALUES (?, ?, ?, ?, ?)`);

          for (const item of itens) {
            const total = item.quantidade * item.valor_unitario;
            stmt.run(id, item.quantidade, item.descricao, item.valor_unitario, total);
          }

          stmt.finalize();
          resolve({ ok: true });
        });
      }
    );
  });
});


ipcMain.handle('buscar-os-detalhada', async (_, id) => {
  return new Promise((resolve) => {
    db.get(`
      SELECT * FROM ordens_servico WHERE id = ?
    `, [id], (err, os) => {
      if (err || !os) return resolve({ ok: false });

      db.get(`SELECT * FROM clientes WHERE id = ?`, [os.cliente_id], (err2, cliente) => {
        if (err2 || !cliente) return resolve({ ok: false });

        db.all(`SELECT * FROM itens_ordem WHERE ordem_servico_id = ?`, [id], (err3, itens) => {
          if (err3) return resolve({ ok: false });

          resolve({ ok: true, os, cliente, itens });
        });
      });
    });
  });
});


ipcMain.handle('excluir-os', async (_, id) => {
  return new Promise((resolve) => {
    db.run(`DELETE FROM itens_ordem WHERE ordem_servico_id = ?`, [id], function (err) {
      if (err) return resolve({ ok: false });

      db.run(`DELETE FROM ordens_servico WHERE id = ?`, [id], function (err2) {
        if (err2) return resolve({ ok: false });
        resolve({ ok: true });
      });
    });
  });
});

ipcMain.handle('salvar-caixa', async (_, lancamento) => {
  return new Promise((resolve) => {
    const query = `
      INSERT INTO caixa (ordem_servico_id, tipo, descricao, destinatario, valor, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      lancamento.ordem_servico_id,
      lancamento.tipo,
      lancamento.descricao,
      lancamento.destinatario,
      lancamento.valor,
      lancamento.data || new Date().toISOString().split('T')[0]
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error('Erro ao salvar no caixa:', err);
        resolve({ ok: false });
      } else {
        resolve({ ok: true, id: this.lastID });
      }
    });
  });
});

ipcMain.handle('buscar-caixa-por-os', async (_, ordemServicoId) => {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        id,
        ordem_servico_id,
        tipo,
        descricao,
        destinatario,
        valor,
        data
      FROM caixa
      WHERE ordem_servico_id = ?
      ORDER BY date(data) DESC, id DESC
    `;

    db.all(query, [ordemServicoId], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar lançamentos do caixa por OS:', err);
        resolve([]);
      } else {
        resolve(rows);
      }
    });
  });
});


ipcMain.handle('atualizar-caixa', async (_, lancamento) => {
  return new Promise((resolve) => {
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

    db.run(query, params, function (err) {
      if (err) {
        console.error('Erro ao atualizar no caixa:', err);
        resolve({ ok: false });
      } else {
        resolve({ ok: true, changes: this.changes });
      }
    });
  });
});

ipcMain.handle('buscar-caixa', async (_, { pagina = 1, limite = 20 }) => {
  return new Promise((resolve) => {
    const offset = (pagina - 1) * limite;

    const query = `
      SELECT
        caixa.id,
        caixa.ordem_servico_id,
        caixa.tipo,
        caixa.descricao,
        caixa.destinatario,
        caixa.valor,
        caixa.data,
        CASE
          WHEN caixa.tipo = 'Entrada' THEN clientes.nome_fantasia
          ELSE caixa.destinatario
        END AS nome_exibicao
      FROM caixa
      LEFT JOIN ordens_servico ON caixa.ordem_servico_id = ordens_servico.id
      LEFT JOIN clientes ON ordens_servico.cliente_id = clientes.id
      ORDER BY date(caixa.data) DESC, caixa.id DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [limite, offset], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar lançamentos do caixa:', err);
        resolve({ ok: false, dados: [], total: 0 });
      } else {
        db.get(`SELECT COUNT(*) as total FROM caixa`, (err2, res) => {
          if (err2) {
            console.error('Erro ao contar total do caixa:', err2);
            resolve({ ok: false, dados: [], total: 0 });
          } else {
            resolve({ ok: true, dados: rows, total: res.total });
          }
        });
      }
    });
  });
});

ipcMain.handle('excluir-caixa', async (_, id) => {
  return new Promise((resolve) => {
    db.run(`DELETE FROM caixa WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error('Erro ao excluir lançamento do caixa:', err);
        return resolve({ ok: false });
      }

      resolve({ ok: true });
    });
  });
});

ipcMain.handle('salvar-orcamento', async (_, { orcamento, itens }) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO orcamentos (cliente_nome, cliente_cnpj, observacoes) VALUES (?, ?, ?)`,
      [orcamento.cliente_nome, orcamento.cliente_cnpj, orcamento.observacoes],
      function (err) {
        if (err) return resolve({ ok: false });

        const orcamentoId = this.lastID;

        const stmt = db.prepare(`INSERT INTO itens_orcamento (orcamento_id, quantidade, descricao, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?)`);

        for (const item of itens) {
          stmt.run([orcamentoId, item.quantidade, item.descricao, item.valor_unitario, item.valor_total]);
        }

        stmt.finalize();
        resolve({ ok: true });
      }
    );
  });
});

ipcMain.handle('buscar-orcamentos', async (_, { pagina = 1, limite = 20, cliente = '', data = '' }) => {
  return new Promise((resolve) => {
    const offset = (pagina - 1) * limite;

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

    const whereSQL = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const query = `
      SELECT 
        o.id, o.data, o.cliente_nome, o.cliente_cnpj
      FROM orcamentos o
      ${whereSQL}
      ORDER BY date(o.data) DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM orcamentos o
      ${whereSQL}
    `;

    db.all(query, [...params, limite, offset], (err, rows) => {
      if (err) {
        console.error('Erro ao buscar orçamentos:', err);
        return resolve({ ok: false, orcamentos: [], total: 0 });
      }

      db.get(countQuery, params, (err2, totalRes) => {
        if (err2) {
          console.error('Erro ao contar orçamentos:', err2);
          return resolve({ ok: false, orcamentos: [], total: 0 });
        }

        resolve({ ok: true, orcamentos: rows, total: totalRes.total });
      });
    });
  });
});



ipcMain.handle('buscar-orcamento-completo', async (_, id) => {
  return new Promise((resolve) => {
    db.get(`SELECT * FROM orcamentos WHERE id = ?`, [id], (err, orcamento) => {
      if (err || !orcamento) return resolve(null);

      db.all(`SELECT * FROM itens_orcamento WHERE orcamento_id = ?`, [id], (err2, itens) => {
        if (err2) return resolve(null);
        resolve({ orcamento, itens });
      });
    });
  });
});

ipcMain.handle('excluir-orcamento', async (_, id) => {
  return new Promise((resolve) => {
    db.run(`DELETE FROM itens_orcamento WHERE orcamento_id = ?`, [id], function (err) {
      if (err) return resolve({ ok: false });

      db.run(`DELETE FROM orcamentos WHERE id = ?`, [id], function (err2) {
        if (err2) return resolve({ ok: false });

        resolve({ ok: true });
      });
    });
  });
});

ipcMain.handle('atualizar-orcamento', async (_, { id, orcamento, itens }) => {
  return new Promise((resolve) => {
    db.run(
      `UPDATE orcamentos SET cliente_nome = ?, cliente_cnpj = ?, observacoes = ? WHERE id = ?`,
      [orcamento.cliente_nome, orcamento.cliente_cnpj, orcamento.observacoes, id],
      function (err) {
        if (err) return resolve({ ok: false });

        db.run(`DELETE FROM itens_orcamento WHERE orcamento_id = ?`, [id], (err2) => {
          if (err2) return resolve({ ok: false });

          const stmt = db.prepare(`INSERT INTO itens_orcamento (orcamento_id, quantidade, descricao, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?)`);

          for (const item of itens) {
            stmt.run([id, item.quantidade, item.descricao, item.valor_unitario, item.valor_total]);
          }

          stmt.finalize();
          resolve({ ok: true });
        });
      }
    );
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
