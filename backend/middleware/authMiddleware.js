const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_kag_pengepul_2026';

/**
 * Middleware untuk verifikasi JWT
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Format token tidak valid. Gunakan: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id_user, username, email, role, id_pemasok }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid atau telah kedaluwarsa.'
    });
  }
};

/**
 * Middleware otorisasi khusus Pemilik/Pengepul
 */
const requirePemilik = (req, res, next) => {
  if (!req.user || req.user.role !== 'Pemilik/Pengepul') {
    return res.status(403).json({
      success: false,
      message: 'Akses dibatasi. Fitur ini hanya untuk Pemilik/Pengepul.'
    });
  }
  next();
};

/**
 * Middleware otorisasi khusus Pemasok
 */
const requirePemasok = (req, res, next) => {
  if (!req.user || req.user.role !== 'Pemasok') {
    return res.status(403).json({
      success: false,
      message: 'Akses dibatasi. Halaman ini khusus untuk Pemasok.'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requirePemilik,
  requirePemasok
};

