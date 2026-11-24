const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_pengepul_barang_bekas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper check connection
let isDbConnected = false;

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    isDbConnected = true;
    console.log('✅ Berhasil terhubung ke basis data MySQL:', process.env.DB_NAME || 'db_pengepul_barang_bekas');
    connection.release();
    return true;
  } catch (error) {
    isDbConnected = false;
    console.warn('⚠️ Peringatan: Tidak dapat terhubung ke MySQL (' + error.message + ').');
    console.warn('💡 Pastikan layanan MySQL (seperti XAMPP / MariaDB / MySQL Server) telah aktif.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  isDbConnected: () => isDbConnected
};

