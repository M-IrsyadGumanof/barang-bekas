const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateQrDataUrl } = require('../services/qrService');

// Format: TRX-JL-YYYYMMDD-XXXX
async function generateNoTransaksiPenjualan(connection) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const prefix = `TRX-JL-${dateStr}-`;
  const [[{ count }]] = await connection.query(
    'SELECT COUNT(*) as count FROM transaksi_penjualan WHERE nomor_transaksi LIKE ?',
    [`${prefix}%`]
  );
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${sequence}`;
}

// FR-40, FR-41, FR-42, FR-43, BR-06, BR-11, BR-12, BR-13, NFR-SAFE-1
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id_pembeli, items, status_pembayaran, catatan } = req.body;
    const id_user = req.user.id_user;

    if (!id_pembeli || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Pembeli dan minimal 1 item barang wajib diisi.' });
    }

    // Validasi berat > 0 (BR-07)
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

    // 1. Validasi Stok Tersedia (SELECT FOR UPDATE) untuk mencegah overselling & stok negatif (BR-12, BR-13, FR-42)
    for (const item of items) {
      const [stokRows] = await connection.query(
        'SELECT s.jumlah_stok, b.nama_barang FROM stok s JOIN barang b ON s.id_barang = b.id_barang WHERE s.id_barang = ? FOR UPDATE',
        [item.id_barang]
      );

      const stokTersedia = stokRows.length > 0 ? parseFloat(stokRows[0].jumlah_stok) : 0;
      const namaBarang = stokRows.length > 0 ? stokRows[0].nama_barang : `Barang ID ${item.id_barang}`;
      const beratDiminta = parseFloat(item.jumlah_berat);

      if (beratDiminta > stokTersedia) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stok tidak mencukupi untuk "${namaBarang}". Tersedia: ${stokTersedia} kg, diminta: ${beratDiminta} kg (FR-42, BR-13).`
        });
      }
    }

    const nomor_transaksi = await generateNoTransaksiPenjualan(connection);
    const qr_token = crypto.randomBytes(16).toString('hex');

    // Ambil harga jual aktif per barang & hitung total
    let total_penjualan = 0;
    const processedItems = [];

    for (const item of items) {
      const [[hargaRow]] = await connection.query(
        "SELECT harga_jual FROM harga WHERE id_barang = ? AND status_harga = 'Aktif' ORDER BY tanggal_mulai_berlaku DESC LIMIT 1",
        [item.id_barang]
      );

      const harga_jual_satuan = item.harga_jual_satuan !== undefined 
        ? parseFloat(item.harga_jual_satuan) 
        : (hargaRow ? parseFloat(hargaRow.harga_jual) : 0);

      const jumlah_berat = parseFloat(item.jumlah_berat);
      const subtotal = jumlah_berat * harga_jual_satuan; // FR-41
      total_penjualan += subtotal;

      processedItems.push({
        id_barang: item.id_barang,
        jumlah_berat,
        harga_jual_satuan,
        subtotal
      });
    }

    // 2. Simpan Header Transaksi Penjualan
    const [penjualanResult] = await connection.query(`
      INSERT INTO transaksi_penjualan 
      (nomor_transaksi, id_pembeli, id_user, total_penjualan, status_transaksi, status_pembayaran, qr_token, catatan)
      VALUES (?, ?, ?, ?, 'Selesai', ?, ?, ?)
    `, [nomor_transaksi, id_pembeli, id_user, total_penjualan, status_pembayaran || 'Lunas', qr_token, catatan || '']);

    const id_penjualan = penjualanResult.insertId;

    // 3. Simpan Detail Transaksi & Kurangi Stok (BR-11, FR-43)
    for (const item of processedItems) {
      await connection.query(`
        INSERT INTO detail_transaksi_penjualan 
        (id_penjualan, id_barang, jumlah_berat, harga_jual_satuan, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [id_penjualan, item.id_barang, item.jumlah_berat, item.harga_jual_satuan, item.subtotal]);

      // Kurangi stok
      await connection.query(`
        UPDATE stok SET jumlah_stok = jumlah_stok - ? WHERE id_barang = ?
      `, [item.jumlah_berat, item.id_barang]);
    }

    // 4. Catat Pembayaran
    if (status_pembayaran === 'Lunas' || status_pembayaran === 'Sebagian') {
      const bayarAmount = req.body.jumlah_dibayar ? parseFloat(req.body.jumlah_dibayar) : total_penjualan;
      await connection.query(`
        INSERT INTO pembayaran (jenis_transaksi, id_transaksi, jumlah_dibayar, metode_pembayaran, keterangan)
        VALUES ('Penjualan', ?, ?, 'Tunai', ?)
      `, [id_penjualan, bayarAmount, `Penerimaan penjualan ${nomor_transaksi}`]);
    }

    await connection.commit();

    const qrDataUrl = await generateQrDataUrl(qr_token);

    return res.status(201).json({
      success: true,
      message: 'Transaksi penjualan berhasil dicatat dan stok berkurang.',
      data: {
        id_penjualan,
        nomor_transaksi,
        total_penjualan,
        status_pembayaran: status_pembayaran || 'Lunas',
        qr_token,
        qr_code: qrDataUrl
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error create transaksi penjualan:', error);
    return res.status(500).json({ success: false, message: 'Gagal mencatat transaksi penjualan: ' + error.message });
  } finally {
    connection.release();
  }
};

// FR-44: Lihat Daftar Seluruh Transaksi Penjualan
exports.getAll = async (req, res) => {
  try {
    const { startDate, endDate, id_pembeli } = req.query;
    let sql = `
      SELECT tp.*, pb.nama_pembeli, pb.kode_pembeli, pb.jenis_pembeli, pb.nomor_telepon, u.username as nama_pencatat
      FROM transaksi_penjualan tp
      JOIN pembeli pb ON tp.id_pembeli = pb.id_pembeli
      JOIN users u ON tp.id_user = u.id_user
    `;
    const params = [];
    const conditions = [];

    if (id_pembeli) {
      conditions.push('tp.id_pembeli = ?');
      params.push(id_pembeli);
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

    sql += ' ORDER BY tp.tanggal_transaksi DESC, tp.id_penjualan DESC';

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAll penjualan:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat transaksi penjualan.' });
  }
};

// FR-44: Detail Transaksi Penjualan
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [headers] = await pool.query(`
      SELECT tp.*, pb.nama_pembeli, pb.kode_pembeli, pb.nomor_telepon, pb.alamat as alamat_pembeli,
             pb.jenis_pembeli, u.username as nama_pencatat
      FROM transaksi_penjualan tp
      JOIN pembeli pb ON tp.id_pembeli = pb.id_pembeli
      JOIN users u ON tp.id_user = u.id_user
      WHERE tp.id_penjualan = ?
    `, [id]);

    if (headers.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi penjualan tidak ditemukan.' });
    }

    const transaksi = headers[0];

    const [items] = await pool.query(`
      SELECT dtj.*, b.nama_barang, b.satuan, b.kode_barang, kb.nama_kategori
      FROM detail_transaksi_penjualan dtj
      JOIN barang b ON dtj.id_barang = b.id_barang
      JOIN kategori_barang kb ON b.id_kategori = kb.id_kategori
      WHERE dtj.id_penjualan = ?
    `, [id]);

    const [pembayaran] = await pool.query(`
      SELECT * FROM pembayaran WHERE jenis_transaksi = 'Penjualan' AND id_transaksi = ?
    `, [id]);

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
    console.error('Error getById penjualan:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat detail penjualan.' });
  }
};

