import api from './api';

export const transaksiService = {
  // Pembelian
  createPembelian: (data) => api.post('/pembelian', data),
  getAllPembelian: (params) => api.get('/pembelian', { params }),
  getPembelianById: (id) => api.get(`/pembelian/${id}`),
  getRiwayatPemasok: () => api.get('/pembelian/riwayat-saya'),

  // Penjualan
  createPenjualan: (data) => api.post('/penjualan', data),
  getAllPenjualan: (params) => api.get('/penjualan', { params }),
  getPenjualanById: (id) => api.get(`/penjualan/${id}`),

  // Stok
  getStok: () => api.get('/stok'),
  adjustStok: (data) => api.put('/stok/adjust', data),

  // Laporan
  getLaporan: (params) => api.get('/laporan', { params }),

  // Dashboard
  getPemilikDashboard: () => api.get('/dashboard/pemilik'),
  getPemasokDashboard: () => api.get('/dashboard/pemasok'),

  // Publik
  getPublicPrices: () => api.get('/public/prices'),
  verifyQr: (token) => api.get(`/public/verify/${token}`),
};

