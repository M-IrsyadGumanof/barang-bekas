const { pool } = require('../config/db');

// Halaman Publik: Daftar Harga Beli Transparan Terkini (BPMN To-Be)
exports.getPublicPriceList = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id_barang, b.kode_barang, b.nama_barang, b.satuan, b.deskripsi,
             kb.nama_kategori,
             h.harga_beli, h.harga_jual, h.tanggal_mulai_berlaku
      FROM barang b
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      JOIN harga h ON b.id_barang = h.id_barang AND h.status_harga = 'Aktif'
      WHERE b.status = 'Aktif'
      ORDER BY kb.nama_kategori ASC, b.nama_barang ASC
    `);

    return res.json({
      success: true,
      data: rows,
      info_usaha: {
        nama_usaha: 'K.A.G (Gudang Pengepul Barang Bekas)',
        pemilik: 'Muhammad Irsyad Gumanof',
        alamat: 'Padang, Sumatera Barat',
        telepon: '0812-3456-7890',
        jam_operasional: 'Senin - Sabtu: 08:00 - 17:00 WIB'
      }
    });
  } catch (error) {
    console.error('Error getPublicPriceList:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat daftar harga publik.' });
  }
};

// Verifikasi Bukti Transaksi via QR Token atau Nomor Transaksi
exports.verifyTransaction = async (req, res) => {
  try {
    const { token } = req.params;

    // Cari di pembelian
    const [beliRows] = await pool.query(`
      SELECT tp.nomor_transaksi, tp.tanggal_transaksi, tp.total_pembelian, tp.status_pembayaran,
             p.nama_pemasok, p.kode_pemasok, 'Pembelian' as jenis_transaksi
      FROM transaksi_pembelian tp
      JOIN pemasok p ON tp.id_pemasok = p.id_pemasok
      WHERE tp.qr_token = ? OR tp.nomor_transaksi = ?
    `, [token, token]);

    if (beliRows.length > 0) {
      const transaksi = beliRows[0];
      const [items] = await pool.query(`
        SELECT dtp.jumlah_berat, dtp.harga_beli_satuan as harga_satuan, dtp.subtotal,
               b.nama_barang, b.satuan
        FROM detail_transaksi_pembelian dtp
        JOIN transaksi_pembelian tp ON dtp.id_pembelian = tp.id_pembelian
        JOIN barang b ON dtp.id_barang = b.id_barang
        WHERE tp.nomor_transaksi = ?
      `, [transaksi.nomor_transaksi]);

      return res.json({
        success: true,
        valid: true,
        data: { ...transaksi, items }
      });
    }

    return res.status(404).json({
      success: false,
      valid: false,
      message: 'Bukti transaksi dengan QR Token / Nomor tersebut tidak ditemukan atau tidak valid.'
    });

  } catch (error) {
    console.error('Error verifyTransaction:', error);
    return res.status(500).json({ success: false, message: 'Gagal memverifikasi transaksi.' });
  }
};

