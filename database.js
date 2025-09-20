const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MariaDB (compatible con mysql2)
const dbConfig = {
  host: process.env.DB_HOST || 'mariadb',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'usuarios_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos MariaDB');
    
    // Test adicional: hacer una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de test exitosa:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos MariaDB:', error.message);
    console.error('❌ Stack completo:', error.stack);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};