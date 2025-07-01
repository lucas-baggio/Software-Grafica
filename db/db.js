const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

const dbPath = isDev
  ? path.join(__dirname, '..', 'grafica.db') 
  : path.join(process.resourcesPath, 'grafica.db');

console.log(dbPath, "DB");


const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado com sucesso.');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_fantasia TEXT,
    razao_social TEXT,
    endereco TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    telefone TEXT,
    inscricao_estadual TEXT,
    cnpj TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ordens_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    data_entrada TEXT,
    data_entrega TEXT,
    alteracao INTEGER,
    mostrar_prova INTEGER,
    cores TEXT,
    sulfite INTEGER,
    duplex INTEGER,
    couche INTEGER,
    adesivo INTEGER,
    bond INTEGER,
    copiativo INTEGER,
    vias TEXT,
    formato TEXT,
    picotar TEXT,
    so_colado INTEGER,
    numeracao TEXT,
    condicoes_pagamento TEXT,
    status TEXT DEFAULT 'Em andamento',
    FOREIGN KEY(cliente_id) REFERENCES clientes(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS itens_ordem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_servico_id INTEGER,
    quantidade INTEGER,
    descricao TEXT,
    valor_unitario REAL,
    valor_total REAL,
    FOREIGN KEY(ordem_servico_id) REFERENCES ordens_servico(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  tipo TEXT,
  descricao TEXT,
  valor REAL,
  data TEXT DEFAULT (date('now')),
  FOREIGN KEY(cliente_id) REFERENCES clientes(id)
);
`)
});

module.exports = db;
