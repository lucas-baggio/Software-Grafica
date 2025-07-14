const mysql = require('mysql2/promise');

let pool;

async function conectarDB() {
  try {
    pool = await mysql.createPool({
      host: 'maglev.proxy.rlwy.net',
      port: 45698,
      user: 'root',
      password: 'xOkdKLCuGddJnSCojndIKSnODVVYNXUi',
      database: 'railway',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Conectado ao banco MySQL da Railway com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
  }
}

function getPool() {
  if (!pool) {
    throw new Error("🚨 Banco de dados não está conectado ainda.");
  }
  return pool;
}

module.exports = {
  conectarDB,
  getPool
};
