import api from './api';

export const masterService = {
  // Pemasok
  getPemasok: (q) => api.get('/pemasok', { params: { q } }),
  createPemasok: (data) => api.post('/pemasok', data),
  updatePemasok: (id, data) => api.put(`/pemasok/${id}`, data),
  deletePemasok: (id) => api.delete(`/pemasok/${id}`),

  // Pembeli
  getPembeli: (q) => api.get('/pembeli', { params: { q } }),
  createPembeli: (data) => api.post('/pembeli', data),
  updatePembeli: (id, data) => api.put(`/pembeli/${id}`, data),
  deletePembeli: (id) => api.delete(`/pembeli/${id}`),

  // Kategori
  getKategori: () => api.get('/kategori'),
  createKategori: (data) => api.post('/kategori', data),
  updateKategori: (id, data) => api.put(`/kategori/${id}`, data),
  deleteKategori: (id) => api.delete(`/kategori/${id}`),

  // Barang
  getBarang: (params) => api.get('/barang', { params }),
  createBarang: (data) => api.post('/barang', data),
  updateBarang: (id, data) => api.put(`/barang/${id}`, data),
  deleteBarang: (id) => api.delete(`/barang/${id}`),

  // Harga
  getHargaHistory: (id_barang) => api.get('/harga/history', { params: { id_barang } }),
  setNewPrice: (data) => api.post('/harga', data),
};

