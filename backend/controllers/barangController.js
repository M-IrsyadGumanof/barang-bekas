const { pool } = require('../config/db');

// FR-19, FR-22: Lihat & Cari Barang (beserta harga aktif & stok)
exports.getAll = async (req, res) => {
  try {
    const { q, kategori } = req.query;
    let sql = `
      SELECT b.*, kb.nama_kategori, 
             COALESCE(s.jumlah_stok, 0) as stok_tersedia,
             COALESCE(h.harga_beli, 0) as harga_beli,
             COALESCE(h.harga_jual, 0) as harga_jual,
             h.tanggal_mulai_berlaku as harga_berlaku_sejak
      FROM barang b
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      LEFT JOIN stok s ON b.id_barang = s.id_barang
      LEFT JOIN harga h ON b.id_barang = h.id_barang AND h.status_harga = 'Aktif'
    `;
    const params = [];
    const conditions = [];

    if (q) {
      conditions.push('(b.nama_barang LIKE ? OR b.kode_barang LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    if (kategori) {
      conditions.push('b.id_kategori = ?');
      params.push(kategori);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY b.id_barang ASC';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAll barang:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat data barang.' });
  }
};

// FR-18, FR-27: Tambah Barang baru + harga awal + stok 0
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id_kategori, nama_barang, satuan, deskripsi, status, harga_beli, harga_jual } = req.body;

    if (!id_kategori || !nama_barang) {
      return res.status(400).json({ success: false, message: 'Kategori dan nama barang wajib diisi.' });
    }

    await connection.beginTransaction();

    // Generate kode barang (BRG-XXX)
    const [[{ maxId }]] = await connection.query('SELECT COALESCE(MAX(id_barang), 0) + 1 as maxId FROM barang');
    const kode_barang = `BRG-${String(maxId).padStart(3, '0')}`;

    const [barangResult] = await connection.query(`
      INSERT INTO barang (id_kategori, kode_barang, nama_barang, satuan, deskripsi, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id_kategori, kode_barang, nama_barang, satuan || 'kg', deskripsi || '', status || 'Aktif']);

    const id_barang = barangResult.insertId;

    // Inisialisasi stok = 0
    await connection.query('INSERT INTO stok (id_barang, jumlah_stok) VALUES (?, 0)', [id_barang]);

    // Jika harga beli & jual disertakan, buat riwayat harga master aktif
    if (harga_beli !== undefined && harga_jual !== undefined) {
      const today = new Date().toISOString().split('T')[0];
      await connection.query(`
        INSERT INTO harga (id_barang, harga_beli, harga_jual, tanggal_mulai_berlaku, status_harga)
        VALUES (?, ?, ?, ?, 'Aktif')
      `, [id_barang, Math.max(0, harga_beli), Math.max(0, harga_jual), today]);
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Barang berhasil ditambahkan.',
      data: { id_barang, kode_barang, nama_barang }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error create barang:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan barang: ' + error.message });
  } finally {
    connection.release();
  }
};

// FR-20: Ubah Barang
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_kategori, nama_barang, satuan, deskripsi, status } = req.body;

    if (!id_kategori || !nama_barang) {
      return res.status(400).json({ success: false, message: 'Kategori dan nama barang wajib diisi.' });
    }

    const [result] = await pool.query(`
      UPDATE barang
      SET id_kategori = ?, nama_barang = ?, satuan = ?, deskripsi = ?, status = ?
      WHERE id_barang = ?
    `, [id_kategori, nama_barang, satuan || 'kg', deskripsi || '', status || 'Aktif', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Data barang berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update barang:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui barang.' });
  }
};

// FR-21, BR-16: Hapus Barang jika belum pernah ada transaksi
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [[{ inBeli }]] = await pool.query(
      'SELECT COUNT(*) as inBeli FROM detail_transaksi_pembelian WHERE id_barang = ?',
      [id]
    );
    const [[{ inJual }]] = await pool.query(
      'SELECT COUNT(*) as inJual FROM detail_transaksi_penjualan WHERE id_barang = ?',
      [id]
    );

    if (inBeli > 0 || inJual > 0) {
      return res.status(400).json({
        success: false,
        message: 'Barang tidak dapat dihapus karena sudah memiliki histori transaksi (BR-16).'
      });
    }

    await pool.query('DELETE FROM harga WHERE id_barang = ?', [id]);
    await pool.query('DELETE FROM stok WHERE id_barang = ?', [id]);
    await pool.query('DELETE FROM barang WHERE id_barang = ?', [id]);

    return res.json({ success: true, message: 'Barang berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete barang:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus barang.' });
  }
};

