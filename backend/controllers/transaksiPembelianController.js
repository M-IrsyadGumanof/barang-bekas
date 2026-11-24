const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateQrDataUrl } = require('../services/qrService');

// Format: TRX-BL-YYYYMMDD-XXXX
async function generateNoTransaksi(connection) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const prefix = `TRX-BL-${dateStr}-`;
  const [[{ count }]] = await connection.query(
    'SELECT COUNT(*) as count FROM transaksi_pembelian WHERE nomor_transaksi LIKE ?',
    [`${prefix}%`]
  );
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${sequence}`;
}

// FR-29, FR-30, FR-31, NFR-SAFE-1, BR-06, BR-07, BR-09, BR-10, BR-14
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id_pemasok, items, status_pembayaran, catatan } = req.body;
    const id_user = req.user.id_user;

    if (!id_pemasok || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Pemasok dan minimal 1 item barang wajib diisi.' });
    }

    // Validasi item: berat > 0 (BR-07)
    for (const item of items) {
      if (!item.id_barang || !item.jumlah_berat || parseFloat(item.jumlah_berat) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah berat barang harus lebih besar dari 0 (BR-07).'
        });
      }
    }

    // Mulai Database Transaction Atomik (NFR-SAFE-1)
    await connection.beginTransaction();

    const nomor_transaksi = await generateNoTransaksi(connection);
    const qr_token = crypto.randomBytes(16).toString('hex');

    // Ambil harga beli aktif per barang & hitung total
    let total_pembelian = 0;
    const processedItems = [];

    for (const item of items) {
      const [[hargaRow]] = await connection.query(
        "SELECT harga_beli FROM harga WHERE id_barang = ? AND status_harga = 'Aktif' ORDER BY tanggal_mulai_berlaku DESC LIMIT 1",
        [item.id_barang]
      );

      // Gunakan harga custom jika ada atau harga master aktif
      const harga_beli_satuan = item.harga_beli_satuan !== undefined 
        ? parseFloat(item.harga_beli_satuan) 
        : (hargaRow ? parseFloat(hargaRow.harga_beli) : 0);

      const jumlah_berat = parseFloat(item.jumlah_berat);
      const subtotal = jumlah_berat * harga_beli_satuan; // BR-09
      total_pembelian += subtotal;

      processedItems.push({
        id_barang: item.id_barang,
        jumlah_berat,
        harga_beli_satuan,
        subtotal
      });
    }

    // 1. Simpan Header Transaksi
    const [pembelianResult] = await connection.query(`
      INSERT INTO transaksi_pembelian 
      (nomor_transaksi, id_pemasok, id_user, total_pembelian, status_transaksi, status_pembayaran, qr_token, catatan)
      VALUES (?, ?, ?, ?, 'Selesai', ?, ?, ?)
    `, [nomor_transaksi, id_pemasok, id_user, total_pembelian, status_pembayaran || 'Lunas', qr_token, catatan || '']);

    const id_pembelian = pembelianResult.insertId;

    // 2. Simpan Detail Transaksi & Tambah Stok (BR-10, FR-31)
    for (const item of processedItems) {
      await connection.query(`
        INSERT INTO detail_transaksi_pembelian 
        (id_pembelian, id_barang, jumlah_berat, harga_beli_satuan, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [id_pembelian, item.id_barang, item.jumlah_berat, item.harga_beli_satuan, item.subtotal]);

      // Tambah stok (UPSERT)
      await connection.query(`
        INSERT INTO stok (id_barang, jumlah_stok) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE jumlah_stok = jumlah_stok + ?
      `, [item.id_barang, item.jumlah_berat, item.jumlah_berat]);
    }

    // 3. Catat Riwayat Pembayaran (jika Lunas/Sebagian)
    if (status_pembayaran === 'Lunas' || status_pembayaran === 'Sebagian') {
      const bayarAmount = req.body.jumlah_dibayar ? parseFloat(req.body.jumlah_dibayar) : total_pembelian;
      await connection.query(`
        INSERT INTO pembayaran (jenis_transaksi, id_transaksi, jumlah_dibayar, metode_pembayaran, keterangan)
        VALUES ('Pembelian', ?, ?, 'Tunai', ?)
      `, [id_pembelian, bayarAmount, `Pembayaran pembelian ${nomor_transaksi}`]);
    }

    // Selesaikan transaksi
    await connection.commit();

    // Generate QR Code image (base64)
    const qrDataUrl = await generateQrDataUrl(qr_token);

    return res.status(201).json({
      success: true,
      message: 'Transaksi pembelian berhasil dicatat dan stok bertambah.',
      data: {
        id_pembelian,
        nomor_transaksi,
        total_pembelian,
        status_pembayaran: status_pembayaran || 'Lunas',
        qr_token,
        qr_code: qrDataUrl
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error create transaksi pembelian:', error);
    return res.status(500).json({ success: false, message: 'Gagal mencatat transaksi: ' + error.message });
  } finally {
    connection.release();
  }
};

// FR-32: Lihat Daftar Transaksi Pembelian (Pemilik)
exports.getAll = async (req, res) => {
  try {
    const { startDate, endDate, id_pemasok } = req.query;
    let sql = `
      SELECT tp.*, p.nama_pemasok, p.kode_pemasok, p.nomor_telepon, u.username as nama_pencatat
      FROM transaksi_pembelian tp
      JOIN pemasok p ON tp.id_pemasok = p.id_pemasok
      JOIN users u ON tp.id_user = u.id_user
    `;
    const params = [];
    const conditions = [];

    if (id_pemasok) {
      conditions.push('tp.id_pemasok = ?');
      params.push(id_pemasok);
    }

    if (startDate) {
      conditions.push('DATE(tp.tanggal_transaksi) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('DATE(tp.tanggal_transaksi) <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY tp.tanggal_transaksi DESC, tp.id_pembelian DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAll pembelian:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat transaksi pembelian.' });
  }
};

// FR-32, FR-34: Detail Transaksi Pembelian
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [headers] = await pool.query(`
      SELECT tp.*, p.nama_pemasok, p.kode_pemasok, p.nomor_telepon, p.alamat as alamat_pemasok,
             u.username as nama_pencatat
      FROM transaksi_pembelian tp
      JOIN pemasok p ON tp.id_pemasok = p.id_pemasok
      JOIN users u ON tp.id_user = u.id_user
      WHERE tp.id_pembelian = ?
    `, [id]);

    if (headers.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    const transaksi = headers[0];

    // Otorisasi Pemasok: Hanya bisa melihat miliknya sendiri (BR-04, BR-05, NFR-SEC-4)
    if (req.user.role === 'Pemasok' && req.user.id_pemasok !== transaksi.id_pemasok) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin untuk melihat transaksi ini (NFR-SEC-4).'
      });
    }

    // Ambil item detail
    const [items] = await pool.query(`
      SELECT dtp.*, b.nama_barang, b.satuan, b.kode_barang, kb.nama_kategori
      FROM detail_transaksi_pembelian dtp
      JOIN barang b ON dtp.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      WHERE dtp.id_pembelian = ?
    `, [id]);

    // Riwayat Pembayaran
    const [pembayaran] = await pool.query(`
      SELECT * FROM pembayaran WHERE jenis_transaksi = 'Pembelian' AND id_transaksi = ?
    `, [id]);

    // Generate QR Data URL
    const qrCode = transaksi.qr_token ? await generateQrDataUrl(transaksi.qr_token) : null;

    return res.json({
      success: true,
      data: {
        ...transaksi,
        items,
        pembayaran,
        qr_code: qrCode
      }
    });

  } catch (error) {
    console.error('Error getById pembelian:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail transaksi.' });
  }
};

// FR-33: Riwayat Transaksi Pemasok Sendiri
exports.getRiwayatPemasok = async (req, res) => {
  try {
    const idPemasok = req.user.id_pemasok;
    if (!idPemasok) {
      return res.status(403).json({ success: false, message: 'Akun tidak terikat dengan data pemasok.' });
    }

    const [rows] = await pool.query(`
      SELECT tp.id_pembelian, tp.nomor_transaksi, tp.tanggal_transaksi, 
             tp.total_pembelian, tp.status_pembayaran, tp.status_transaksi, tp.qr_token,
             COUNT(dtp.id_detail_pembelian) as total_item,
             COALESCE(SUM(dtp.jumlah_berat), 0) as total_berat
      FROM transaksi_pembelian tp
      LEFT JOIN detail_transaksi_pembelian dtp ON tp.id_pembelian = dtp.id_pembelian
      WHERE tp.id_pemasok = ?
      GROUP BY tp.id_pembelian
      ORDER BY tp.tanggal_transaksi DESC
    `, [idPemasok]);

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getRiwayatPemasok:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat riwayat transaksi.' });
  }
};

