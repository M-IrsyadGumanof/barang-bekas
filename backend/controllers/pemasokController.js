const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// FR-08, FR-11: Lihat & Cari Pemasok
exports.getAll = async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT p.*, u.username, u.email, u.status_akun
      FROM pemasok p
      LEFT JOIN users u ON p.id_user = u.id_user
    `;
    const params = [];

    if (q) {
      sql += ' WHERE p.nama_pemasok LIKE ? OR p.kode_pemasok LIKE ? OR p.nomor_telepon LIKE ?';
      const search = `%${q}%`;
      params.push(search, search, search);
    }

    sql += ' ORDER BY p.id_pemasok DESC';
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAll pemasok:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pemasok.' });
  }
};

// FR-07: Tambah Pemasok beserta pembuatan akun login
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { nama_pemasok, nomor_telepon, alamat, username, email, password } = req.body;

    if (!nama_pemasok || !nomor_telepon) {
      return res.status(400).json({ success: false, message: 'Nama dan nomor telepon pemasok wajib diisi.' });
    }

    await connection.beginTransaction();

    let id_user = null;

    // Jika username dan password disertakan, buat akun user untuk pemasok
    if (username && password) {
      // Cek apakah username sudah dipakai
      const [existing] = await connection.query('SELECT id_user FROM users WHERE username = ? OR email = ?', [username, email || '']);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Username atau Email sudah terdaftar.' });
      }

      const passHash = await bcrypt.hash(password, 10);
      const [userResult] = await connection.query(`
        INSERT INTO users (username, email, password_hash, role, status_akun)
        VALUES (?, ?, ?, 'Pemasok', 'Aktif')
      `, [username, email || `${username}@pemasok.local`, passHash]);

      id_user = userResult.insertId;
    }

    // Generate kode pemasok unik (PMS-XXX)
    const [[{ maxId }]] = await connection.query('SELECT COALESCE(MAX(id_pemasok), 0) + 1 as maxId FROM pemasok');
    const kode_pemasok = `PMS-${String(maxId).padStart(3, '0')}`;

    const [pemasokResult] = await connection.query(`
      INSERT INTO pemasok (id_user, kode_pemasok, nama_pemasok, nomor_telepon, alamat)
      VALUES (?, ?, ?, ?, ?)
    `, [id_user, kode_pemasok, nama_pemasok, nomor_telepon, alamat || '']);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Data pemasok berhasil disimpan.',
      data: {
        id_pemasok: pemasokResult.insertId,
        kode_pemasok,
        nama_pemasok,
        id_user
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error create pemasok:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan pemasok: ' + error.message });
  } finally {
    connection.release();
  }
};

// FR-09: Ubah Pemasok
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_pemasok, nomor_telepon, alamat } = req.body;

    if (!nama_pemasok || !nomor_telepon) {
      return res.status(400).json({ success: false, message: 'Nama dan nomor telepon wajib diisi.' });
    }

    const [result] = await pool.query(`
      UPDATE pemasok 
      SET nama_pemasok = ?, nomor_telepon = ?, alamat = ?
      WHERE id_pemasok = ?
    `, [nama_pemasok, nomor_telepon, alamat, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data pemasok tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Data pemasok berhasil diperbarui.' });
  } catch (error) {
    console.error('Error update pemasok:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data pemasok.' });
  }
};

// FR-10, BR-16: Hapus Pemasok hanya jika belum ada transaksi terkait
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah memiliki transaksi pembelian
    const [[{ trxCount }]] = await pool.query(
      'SELECT COUNT(*) as trxCount FROM transaksi_pembelian WHERE id_pemasok = ?',
      [id]
    );

    if (trxCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Pemasok tidak dapat dihapus karena sudah memiliki riwayat transaksi (BR-16).'
      });
    }

    // Ambil id_user jika ada untuk dibersihkan
    const [[pemasok]] = await pool.query('SELECT id_user FROM pemasok WHERE id_pemasok = ?', [id]);
    await pool.query('DELETE FROM pemasok WHERE id_pemasok = ?', [id]);

    if (pemasok && pemasok.id_user) {
      await pool.query('DELETE FROM users WHERE id_user = ?', [pemasok.id_user]);
    }

    return res.json({ success: true, message: 'Pemasok berhasil dihapus.' });
  } catch (error) {
    console.error('Error delete pemasok:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus pemasok.' });
  }
};

