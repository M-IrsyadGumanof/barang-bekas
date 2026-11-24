const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test koneksi database saat start
testConnection();

// Registrasi Rute REST API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/pemasok', require('./routes/pemasokRoutes'));
app.use('/api/pembeli', require('./routes/pembeliRoutes'));
app.use('/api/kategori', require('./routes/kategoriRoutes'));
app.use('/api/barang', require('./routes/barangRoutes'));
app.use('/api/harga', require('./routes/hargaRoutes'));
app.use('/api/pembelian', require('./routes/transaksiPembelianRoutes'));
app.use('/api/penjualan', require('./routes/transaksiPenjualanRoutes'));
app.use('/api/stok', require('./routes/stokRoutes'));
app.use('/api/laporan', require('./routes/laporanRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// Health check & status setup endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    message: 'Backend server berjalan dengan baik.',
    database_connected: dbStatus,
    database_name: process.env.DB_NAME || 'db_pengepul_barang_bekas',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'Setup REST API Sistem Informasi Pengelolaan Usaha Pengepul Barang Bekas (Mitra: K.A.G)',
    author: 'Muhammad Irsyad Gumanof (2411082031)',
    health_check: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} tidak ditemukan.` });
});

// Error handling global
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
});

