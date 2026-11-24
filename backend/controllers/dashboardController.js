const { pool } = require('../config/db');

/**
 * Dashboard Pemilik/Pengepul (FR-05, FR-51)
 */
exports.getPemilikDashboard = async (req, res) => {
  try {
    // 1. Jumlah Pemasok
    const [[{ total_pemasok }]] = await pool.query('SELECT COUNT(*) as total_pemasok FROM pemasok');

    // 2. Jumlah Pembeli
    const [[{ total_pembeli }]] = await pool.query('SELECT COUNT(*) as total_pembeli FROM pembeli');

    // 3. Jumlah Jenis Barang
    const [[{ total_barang }]] = await pool.query("SELECT COUNT(*) as total_barang FROM barang WHERE status = 'Aktif'");

    // 4. Total Stok Barang (kg)
    const [[{ total_stok_kg }]] = await pool.query('SELECT COALESCE(SUM(jumlah_stok), 0) as total_stok_kg FROM stok');

    // 5. Total Transaksi Pembelian & Nilai Pembelian (Pengeluaran)
    const [[pembelianStats]] = await pool.query(`
      SELECT COUNT(*) as total_transaksi_pembelian, 
             COALESCE(SUM(total_pembelian), 0) as total_nilai_pembelian
      FROM transaksi_pembelian 
      WHERE status_transaksi = 'Selesai'
    `);

    // 6. Total Transaksi Penjualan & Nilai Penjualan (Pendapatan)
    const [[penjualanStats]] = await pool.query(`
      SELECT COUNT(*) as total_transaksi_penjualan, 
             COALESCE(SUM(total_penjualan), 0) as total_nilai_penjualan
      FROM transaksi_penjualan 
      WHERE status_transaksi = 'Selesai'
    `);

    // 7. Perkiraan Keuntungan Kotor (FR-51: Penjualan - Pembelian)
    const total_nilai_penjualan = parseFloat(penjualanStats.total_nilai_penjualan);
    const total_nilai_pembelian = parseFloat(pembelianStats.total_nilai_pembelian);
    const perkiraan_keuntungan = total_nilai_penjualan - total_nilai_pembelian;

    // 8. Transaksi Pembelian Terbaru (5 transaksi)
    const [pembelianTerbaru] = await pool.query(`
      SELECT tp.id_pembelian, tp.nomor_transaksi, tp.tanggal_transaksi, 
             tp.total_pembelian, tp.status_pembayaran, p.nama_pemasok
      FROM transaksi_pembelian tp
      JOIN pemasok p ON tp.id_pemasok = p.id_pemasok
      ORDER BY tp.tanggal_transaksi DESC LIMIT 5
    `);

    // 9. Transaksi Penjualan Terbaru (5 transaksi)
    const [penjualanTerbaru] = await pool.query(`
      SELECT tp.id_penjualan, tp.nomor_transaksi, tp.tanggal_transaksi, 
             tp.total_penjualan, tp.status_pembayaran, pb.nama_pembeli
      FROM transaksi_penjualan tp
      JOIN pembeli pb ON tp.id_pembeli = pb.id_pembeli
      ORDER BY tp.tanggal_transaksi DESC LIMIT 5
    `);

    // 10. Ringkasan Stok per Barang
    const [stokBarang] = await pool.query(`
      SELECT b.id_barang, b.nama_barang, b.satuan, s.jumlah_stok, kb.nama_kategori,
             h.harga_beli, h.harga_jual
      FROM stok s
      JOIN barang b ON s.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      LEFT JOIN harga h ON b.id_barang = h.id_barang AND h.status_harga = 'Aktif'
      ORDER BY s.jumlah_stok DESC
    `);

    return res.json({
      success: true,
      data: {
        total_pemasok,
        total_pembeli,
        total_barang,
        total_stok_kg: parseFloat(total_stok_kg),
        total_transaksi_pembelian: pembelianStats.total_transaksi_pembelian,
        total_nilai_pembelian,
        total_transaksi_penjualan: penjualanStats.total_transaksi_penjualan,
        total_nilai_penjualan,
        perkiraan_keuntungan,
        pembelian_terbaru: pembelianTerbaru,
        penjualan_terbaru: penjualanTerbaru,
        stok_barang: stokBarang
      }
    });

  } catch (error) {
    console.error('Error getPemilikDashboard:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat ringkasan dashboard.' });
  }
};

/**
 * Dashboard Pemasok (FR-06)
 */
exports.getPemasokDashboard = async (req, res) => {
  try {
    const idPemasok = req.user.id_pemasok;
    if (!idPemasok) {
      return res.status(403).json({ success: false, message: 'Akun ini tidak terikat pada data pemasok.' });
    }

    // 1. Data Pemasok
    const [[pemasokInfo]] = await pool.query('SELECT * FROM pemasok WHERE id_pemasok = ?', [idPemasok]);

    // 2. Statistik Transaksi Pemasok
    const [[stats]] = await pool.query(`
      SELECT 
        COUNT(tp.id_pembelian) as total_transaksi,
        COALESCE(SUM(tp.total_pembelian), 0) as total_nilai_transaksi
      FROM transaksi_pembelian tp
      WHERE tp.id_pemasok = ? AND tp.status_transaksi = 'Selesai'
    `, [idPemasok]);

    // 3. Total Berat Barang (kg) yang telah disetor
    const [[beratStats]] = await pool.query(`
      SELECT COALESCE(SUM(dtp.jumlah_berat), 0) as total_berat_kg
      FROM detail_transaksi_pembelian dtp
      JOIN transaksi_pembelian tp ON dtp.id_pembelian = tp.id_pembelian
      WHERE tp.id_pemasok = ? AND tp.status_transaksi = 'Selesai'
    `, [idPemasok]);

    // 4. Riwayat Transaksi Terbaru Pemasok (FR-33)
    const [transaksiTerbaru] = await pool.query(`
      SELECT id_pembelian, nomor_transaksi, tanggal_transaksi, total_pembelian, 
             status_transaksi, status_pembayaran, qr_token
      FROM transaksi_pembelian
      WHERE id_pemasok = ?
      ORDER BY tanggal_transaksi DESC
      LIMIT 10
    `, [idPemasok]);

    return res.json({
      success: true,
      data: {
        pemasok: pemasokInfo,
        total_transaksi: stats.total_transaksi,
        total_nilai_transaksi: parseFloat(stats.total_nilai_transaksi),
        total_berat_kg: parseFloat(beratStats.total_berat_kg),
        transaksi_terbaru: transaksiTerbaru
      }
    });

  } catch (error) {
    console.error('Error getPemasokDashboard:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat dashboard pemasok.' });
  }
};

