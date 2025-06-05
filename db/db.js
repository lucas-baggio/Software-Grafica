const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'grafica.db');
const db = new sqlite3.Database(dbPath);

// Criação das tabelas
db.serialize(() => {
  // Clientes
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

  // Ordens de Serviço
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
    numeracao INTEGER,
    condicoes_pagamento TEXT,
    FOREIGN KEY(cliente_id) REFERENCES clientes(id)
  )`);

  // Itens da Ordem
  db.run(`CREATE TABLE IF NOT EXISTS itens_ordem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_servico_id INTEGER,
    quantidade INTEGER,
    descricao TEXT,
    valor_unitario REAL,
    valor_total REAL,
    FOREIGN KEY(ordem_servico_id) REFERENCES ordens_servico(id)
  )`);
});

module.exports = db;
