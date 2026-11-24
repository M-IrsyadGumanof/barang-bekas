const { pool } = require('../config/db');

// FR-45, FR-46, FR-47, FR-48, FR-49, FR-50, FR-51: Laporan Pembelian, Penjualan, Stok, dan Keuntungan
exports.getLaporan = async (req, res) => {
  try {
    const { startDate, endDate, id_barang, id_pemasok, id_pembeli } = req.query;

    // Filter tanggal default jika tidak diberikan: awal bulan sampai sekarang
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const filterStart = startDate || firstDayOfMonth;
    const filterEnd = endDate || todayStr;

    // 1. Rekap Pembelian
    let beliSql = `
      SELECT tp.id_pembelian, tp.nomor_transaksi, tp.tanggal_transaksi, tp.total_pembelian,
             p.nama_pemasok, dtp.id_barang, b.nama_barang, kb.nama_kategori,
             dtp.jumlah_berat, dtp.harga_beli_satuan, dtp.subtotal
      FROM transaksi_pembelian tp
      JOIN pemasok p ON tp.id_pemasok = p.id_pemasok
      JOIN detail_transaksi_pembelian dtp ON tp.id_pembelian = dtp.id_pembelian
      JOIN barang b ON dtp.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      WHERE tp.status_transaksi = 'Selesai' 
        AND DATE(tp.tanggal_transaksi) BETWEEN ? AND ?
    `;
    const beliParams = [filterStart, filterEnd];

    if (id_pemasok) {
      beliSql += ' AND tp.id_pemasok = ?';
      beliParams.push(id_pemasok);
    }
    if (id_barang) {
      beliSql += ' AND dtp.id_barang = ?';
      beliParams.push(id_barang);
    }
    beliSql += ' ORDER BY tp.tanggal_transaksi ASC';

    const [rowsBeli] = await pool.query(beliSql, beliParams);

    // 2. Rekap Penjualan
    let jualSql = `
      SELECT tp.id_penjualan, tp.nomor_transaksi, tp.tanggal_transaksi, tp.total_penjualan,
             pb.nama_pembeli, dtj.id_barang, b.nama_barang, kb.nama_kategori,
             dtj.jumlah_berat, dtj.harga_jual_satuan, dtj.subtotal
      FROM transaksi_penjualan tp
      JOIN pembeli pb ON tp.id_pembeli = pb.id_pembeli
      JOIN detail_transaksi_penjualan dtj ON tp.id_penjualan = dtj.id_penjualan
      JOIN barang b ON dtj.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      WHERE tp.status_transaksi = 'Selesai' 
        AND DATE(tp.tanggal_transaksi) BETWEEN ? AND ?
    `;
    const jualParams = [filterStart, filterEnd];

    if (id_pembeli) {
      jualSql += ' AND tp.id_pembeli = ?';
      jualParams.push(id_pembeli);
    }
    if (id_barang) {
      jualSql += ' AND dtj.id_barang = ?';
      jualParams.push(id_barang);
    }
    jualSql += ' ORDER BY tp.tanggal_transaksi ASC';

    const [rowsJual] = await pool.query(jualSql, jualParams);

    // Hitung Akumulasi Total
    let total_berat_beli = 0;
    let total_rupiah_beli = 0;
    rowsBeli.forEach(r => {
      total_berat_beli += parseFloat(r.jumlah_berat);
      total_rupiah_beli += parseFloat(r.subtotal);
    });

    let total_berat_jual = 0;
    let total_rupiah_jual = 0;
    rowsJual.forEach(r => {
      total_berat_jual += parseFloat(r.jumlah_berat);
      total_rupiah_jual += parseFloat(r.subtotal);
    });

    // Keuntungan kotor = Total Penjualan - Total Pembelian (FR-51)
    const estimasi_keuntungan_kotor = total_rupiah_jual - total_rupiah_beli;

    // 3. Rekap Stok Terkini
    const [stokRows] = await pool.query(`
      SELECT b.id_barang, b.nama_barang, b.satuan, kb.nama_kategori, s.jumlah_stok,
             h.harga_beli as harga_beli_aktif, h.harga_jual as harga_jual_aktif
      FROM stok s
      JOIN barang b ON s.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      LEFT JOIN harga h ON b.id_barang = h.id_barang AND h.status_harga = 'Aktif'
      ORDER BY s.jumlah_stok DESC
    `);

    return res.json({
      success: true,
      filter: {
        startDate: filterStart,
        endDate: filterEnd,
        id_barang: id_barang || null,
        id_pemasok: id_pemasok || null,
        id_pembeli: id_pembeli || null
      },
      summary: {
        total_berat_beli,
        total_rupiah_beli,
        total_berat_jual,
        total_rupiah_jual,
        estimasi_keuntungan_kotor
      },
      detail: {
        pembelian: rowsBeli,
        penjualan: rowsJual,
        stok: stokRows
      }
    });

  } catch (error) {
    console.error('Error getLaporan:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyusun laporan.' });
  }
};

