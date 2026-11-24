const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_kag_pengepul_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Login Controller (FR-01, FR-02)
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email dan Password wajib diisi.'
      });
    }

    // Cari user berdasarkan username atau email
    const [users] = await pool.query(
      `SELECT u.*, p.id_pemasok, p.nama_pemasok, p.kode_pemasok 
       FROM users u 
       LEFT JOIN pemasok p ON u.id_user = p.id_user 
       WHERE u.username = ? OR u.email = ? LIMIT 1`,
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid. Username/Email tidak ditemukan.'
      });
    }

    const user = users[0];

    if (user.status_akun !== 'Aktif') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Silakan hubungi pemilik usaha.'
      });
    }

    // Verifikasi password hash (FR-03, NFR-SEC-1)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid. Password salah.'
      });
    }

    // Buat JWT Token (NFR-SEC-2)
    const payload = {
      id_user: user.id_user,
      username: user.username,
      email: user.email,
      role: user.role,
      id_pemasok: user.id_pemasok || null,
      nama_pemasok: user.nama_pemasok || null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id_user: user.id_user,
        username: user.username,
        email: user.email,
        role: user.role,
        id_pemasok: user.id_pemasok,
        nama_pemasok: user.nama_pemasok
      }
    });

  } catch (error) {
    console.error('Error saat login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login.'
    });
  }
};

/**
 * Get Current User Profile (FR-12)
 */
exports.getProfile = async (req, res) => {
  try {
    const id_user = req.user.id_user;

    const [users] = await pool.query(
      `SELECT u.id_user, u.username, u.email, u.role, u.status_akun, u.created_at,
              p.id_pemasok, p.kode_pemasok, p.nama_pemasok, p.nomor_telepon, p.alamat
       FROM users u
       LEFT JOIN pemasok p ON u.id_user = p.id_user
       WHERE u.id_user = ?`,
      [id_user]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Error getProfile:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat profil pengguna.' });
  }
};

