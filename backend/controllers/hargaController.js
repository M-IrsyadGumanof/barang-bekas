const { pool } = require('../config/db');

// FR-27, FR-28, BR-14: Pengelolaan Harga & Histori Harga Transaksi
exports.getHistory = async (req, res) => {
  try {
    const { id_barang } = req.query;
    let sql = `
      SELECT h.*, b.nama_barang, b.satuan, kb.nama_kategori
      FROM harga h
      JOIN barang b ON h.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
    `;
    const params = [];

    if (id_barang) {
      sql += ' WHERE h.id_barang = ?';
      params.push(id_barang);
    }

    sql += ' ORDER BY h.tanggal_mulai_berlaku DESC, h.id_harga DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getHistory harga:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat histori harga.' });
  }
};

// Update Harga: Menetapkan harga baru sebagai 'Aktif' dan menonaktifkan harga lama (BR-14)
exports.setNewPrice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id_barang, harga_beli, harga_jual, tanggal_mulai_berlaku } = req.body;

    if (!id_barang || harga_beli === undefined || harga_jual === undefined) {
      return res.status(400).json({ success: false, message: 'Barang, harga beli, dan harga jual wajib diisi.' });
    }

    if (harga_beli < 0 || harga_jual < 0) {
      return res.status(400).json({ success: false, message: 'Harga tidak boleh bernilai negatif (BR-08).' });
    }

    await connection.beginTransaction();

    // 1. Nonaktifkan status harga lama untuk barang ini
    await connection.query(
      "UPDATE harga SET status_harga = 'Tidak Aktif' WHERE id_barang = ?",
      [id_barang]
    );

    // 2. Masukkan harga baru
    const effectiveDate = tanggal_mulai_berlaku || new Date().toISOString().split('T')[0];
    const [result] = await connection.query(`
      INSERT INTO harga (id_barang, harga_beli, harga_jual, tanggal_mulai_berlaku, status_harga)
      VALUES (?, ?, ?, ?, 'Aktif')
    `, [id_barang, harga_beli, harga_jual, effectiveDate]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Harga master berhasil diperbarui tanpa mengubah transaksi historis.',
      data: { id_harga: result.insertId, id_barang, harga_beli, harga_jual, effectiveDate }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error setNewPrice:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui harga master: ' + error.message });
  } finally {
    connection.release();
  }
};

