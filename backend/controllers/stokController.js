const { pool } = require('../config/db');

// FR-36, FR-37, FR-38: Kelola dan Pantau Stok Barang
exports.getAllStok = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id_stok, s.id_barang, s.jumlah_stok, s.updated_at,
             b.kode_barang, b.nama_barang, b.satuan, b.status as status_barang,
             kb.nama_kategori,
             h.harga_beli as harga_beli_aktif,
             h.harga_jual as harga_jual_aktif,
             (s.jumlah_stok * COALESCE(h.harga_beli, 0)) as nilai_aset_stok
      FROM stok s
      JOIN barang b ON s.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      LEFT JOIN harga h ON b.id_barang = h.id_barang AND h.status_harga = 'Aktif'
      ORDER BY s.jumlah_stok DESC
    `);

    // Hitung total ringkasan
    let totalKg = 0;
    let totalAsetNilai = 0;
    rows.forEach(r => {
      totalKg += parseFloat(r.jumlah_stok);
      totalAsetNilai += parseFloat(r.nilai_aset_stok);
    });

    return res.json({
      success: true,
      data: rows,
      summary: {
        total_stok_kg: totalKg,
        total_nilai_aset: totalAsetNilai,
        total_item_barang: rows.length
      }
    });
  } catch (error) {
    console.error('Error getAllStok:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat data stok.' });
  }
};

// Penyesuaian stok manual (Opname / Koreksi fisik) jika diperlukan
exports.adjustStok = async (req, res) => {
  try {
    const { id_barang, jumlah_stok_baru, keterangan } = req.body;

    if (!id_barang || jumlah_stok_baru === undefined) {
      return res.status(400).json({ success: false, message: 'Barang dan jumlah stok baru wajib diisi.' });
    }

    if (parseFloat(jumlah_stok_baru) < 0) {
      return res.status(400).json({ success: false, message: 'Stok tidak boleh bernilai negatif (FR-38, BR-12).' });
    }

    await pool.query(
      'UPDATE stok SET jumlah_stok = ? WHERE id_barang = ?',
      [parseFloat(jumlah_stok_baru), id_barang]
    );

    return res.json({
      success: true,
      message: 'Stok barang berhasil disesuaikan.',
      data: { id_barang, jumlah_stok: parseFloat(jumlah_stok_baru) }
    });
  } catch (error) {
    console.error('Error adjustStok:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyesuaikan stok.' });
  }
};

