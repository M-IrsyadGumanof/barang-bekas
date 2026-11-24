const { pool } = require('../config/db');

// FR-24: Lihat Kategori
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT kb.*, COUNT(b.id_barang) as total_barang
      FROM kategori_barang kb
      LEFT JOIN barang b ON kb.id_kategori = b.id_kategori
      GROUP BY kb.id_kategori
      ORDER BY kb.nama_kategori ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAll kategori:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat kategori.' });
  }
};

// FR-23: Tambah Kategori
exports.create = async (req, res) => {
  try {
    const { nama_kategori, deskripsi } = req.body;
    if (!nama_kategori) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    const [result] = await pool.query(
      'INSERT INTO kategori_barang (nama_kategori, deskripsi) VALUES (?, ?)',
      [nama_kategori, deskripsi || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan.',
      data: { id_kategori: result.insertId, nama_kategori, deskripsi }
    });
  } catch (error) {
    console.error('Error create kategori:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan kategori.' });
  }
};

// FR-25: Ubah Kategori
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori, deskripsi } = req.body;

    if (!nama_kategori) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    }

    const [result] = await pool.query(
      'UPDATE kategori_barang SET nama_kategori = ?, deskripsi = ? WHERE id_kategori = ?',
      [nama_kategori, deskripsi || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Kategori berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update kategori:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kategori.' });
  }
};

// FR-26: Hapus Kategori hanya jika belum digunakan
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) as count FROM barang WHERE id_kategori = ?',
      [id]
    );

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Kategori masih digunakan oleh beberapa jenis barang dan tidak dapat dihapus.'
      });
    }

    await pool.query('DELETE FROM kategori_barang WHERE id_kategori = ?', [id]);
    return res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete kategori:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus kategori.' });
  }
};

