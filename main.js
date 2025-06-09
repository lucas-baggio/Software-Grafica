const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// require('electron-reload')(__dirname, {
//   electron: require(`${__dirname}/node_modules/electron`),
//   // adiciona suporte para recarregar HTML/JS/CSS da pasta public
//   watch: [
//     path.join(__dirname, 'public'),
//     path.join(__dirname, 'db'),
//     path.join(__dirname, 'preload.js')
//   ],
//   hardReset: true,
//   hardResetMethod: 'exit'
// });

const db = require('./db/db');

function createWindow () {
  const win = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
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

ipcMain.handle('buscar-clientes', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, nome_fantasia FROM clientes ORDER BY nome_fantasia', (err, rows) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(rows);
      }
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
        resolve({ ok: true });
      }
    });
  });
});

ipcMain.handle('listar-os', async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT os.id, os.data_entrada, os.data_entrega,
             c.nome_fantasia AS cliente,
             IFNULL(SUM(io.valor_total), 0) AS total
      FROM ordens_servico os
      JOIN clientes c ON c.id = os.cliente_id
      LEFT JOIN itens_ordem io ON io.ordem_servico_id = os.id
      GROUP BY os.id
      ORDER BY os.id DESC
    `;
    db.all(query, (err, rows) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(rows);
      }
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
