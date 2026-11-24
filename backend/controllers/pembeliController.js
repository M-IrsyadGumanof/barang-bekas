const { pool } = require('../config/db');

// FR-14, FR-17: Lihat & Cari Pembeli
exports.getAll = async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM pembeli';
    const params = [];

    if (q) {
      sql += ' WHERE nama_pembeli LIKE ? OR kode_pembeli LIKE ? OR nomor_telepon LIKE ?';
      const search = `%${q}%`;
      params.push(search, search, search);
    }

    sql += ' ORDER BY id_pembeli DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAll pembeli:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat data pembeli.' });
  }
};

// FR-13: Tambah Pembeli
exports.create = async (req, res) => {
  try {
    const { nama_pembeli, nomor_telepon, alamat, jenis_pembeli } = req.body;

    if (!nama_pembeli || !nomor_telepon) {
      return res.status(400).json({ success: false, message: 'Nama dan nomor telepon pembeli wajib diisi.' });
    }

    const [[{ maxId }]] = await pool.query('SELECT COALESCE(MAX(id_pembeli), 0) + 1 as maxId FROM pembeli');
    const kode_pembeli = `PBL-${String(maxId).padStart(3, '0')}`;

    const [result] = await pool.query(`
      INSERT INTO pembeli (kode_pembeli, nama_pembeli, nomor_telepon, alamat, jenis_pembeli)
      VALUES (?, ?, ?, ?, ?)
    `, [kode_pembeli, nama_pembeli, nomor_telepon, alamat || '', jenis_pembeli || 'Pabrik Pengolahan']);

    return res.status(201).json({
      success: true,
      message: 'Data pembeli berhasil ditambahkan.',
      data: { id_pembeli: result.insertId, kode_pembeli, nama_pembeli }
    });
  } catch (error) {
    console.error('Error create pembeli:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan pembeli.' });
  }
};

// FR-15: Ubah Pembeli
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_pembeli, nomor_telepon, alamat, jenis_pembeli } = req.body;

    if (!nama_pembeli || !nomor_telepon) {
      return res.status(400).json({ success: false, message: 'Nama dan nomor telepon wajib diisi.' });
    }

    const [result] = await pool.query(`
      UPDATE pembeli 
      SET nama_pembeli = ?, nomor_telepon = ?, alamat = ?, jenis_pembeli = ?
      WHERE id_pembeli = ?
    `, [nama_pembeli, nomor_telepon, alamat, jenis_pembeli || 'Pabrik Pengolahan', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data pembeli tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Data pembeli berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update pembeli:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pembeli.' });
  }
};

// FR-16, BR-16: Hapus Pembeli
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [[{ trxCount }]] = await pool.query(
      'SELECT COUNT(*) as trxCount FROM transaksi_penjualan WHERE id_pembeli = ?',
      [id]
    );

    if (trxCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Pembeli tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan (BR-16).'
      });
    }

    await pool.query('DELETE FROM pembeli WHERE id_pembeli = ?', [id]);
    return res.json({ success: true, message: 'Pembeli berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete pembeli:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus pembeli.' });
  }
};

