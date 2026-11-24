-- ============================================================
-- Skema Database: Sistem Informasi Pengelolaan Usaha Pengepul Barang Bekas
-- Mitra: K.A.G (Gudang Barang Bekas)
-- Penulis: Muhammad Irsyad Gumanof (2411082031)
-- Mengacu pada Dokumen SRS & Spesifikasi Teknis (11 Tabel Inti + Pembayaran)
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_pengepul_barang_bekas;
USE db_pengepul_barang_bekas;

-- 1. Tabel users (Kredensial dan Peran Pengguna)
CREATE TABLE IF NOT EXISTS users (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Pemilik/Pengepul', 'Pemasok') NOT NULL DEFAULT 'Pemilik/Pengepul',
  status_akun ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel pemasok (Data Pemasok)
CREATE TABLE IF NOT EXISTS pemasok (
  id_pemasok INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NULL UNIQUE,
  kode_pemasok VARCHAR(20) NOT NULL UNIQUE,
  nama_pemasok VARCHAR(100) NOT NULL,
  nomor_telepon VARCHAR(20) NOT NULL,
  alamat TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pemasok_user FOREIGN KEY (id_user) REFERENCES users (id_user) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel pembeli (Data Pembeli: Pabrik / Pengepul Besar)
CREATE TABLE IF NOT EXISTS pembeli (
  id_pembeli INT AUTO_INCREMENT PRIMARY KEY,
  kode_pembeli VARCHAR(20) NOT NULL UNIQUE,
  nama_pembeli VARCHAR(100) NOT NULL,
  nomor_telepon VARCHAR(20) NOT NULL,
  alamat TEXT,
  jenis_pembeli VARCHAR(50) NOT NULL DEFAULT 'Pabrik Pengolahan',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel kategori_barang (Kategori Pengelompokan Barang)
CREATE TABLE IF NOT EXISTS kategori_barang (
  id_kategori INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(50) NOT NULL UNIQUE,
  deskripsi VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel barang (Data Barang Bekas)
CREATE TABLE IF NOT EXISTS barang (
  id_barang INT AUTO_INCREMENT PRIMARY KEY,
  id_kategori INT NOT NULL,
  kode_barang VARCHAR(20) NOT NULL UNIQUE,
  nama_barang VARCHAR(100) NOT NULL,
  satuan VARCHAR(20) NOT NULL DEFAULT 'kg',
  deskripsi TEXT NULL,
  status ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_barang_kategori FOREIGN KEY (id_kategori) REFERENCES kategori_barang (id_kategori) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel harga (Harga Master: Riwayat Harga Beli & Jual)
CREATE TABLE IF NOT EXISTS harga (
  id_harga INT AUTO_INCREMENT PRIMARY KEY,
  id_barang INT NOT NULL,
  harga_beli DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  harga_jual DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  tanggal_mulai_berlaku DATE NOT NULL,
  status_harga ENUM('Aktif', 'Tidak Aktif') NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_harga_barang FOREIGN KEY (id_barang) REFERENCES barang (id_barang) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel stok (Stok Terkini per Barang)
CREATE TABLE IF NOT EXISTS stok (
  id_stok INT AUTO_INCREMENT PRIMARY KEY,
  id_barang INT NOT NULL UNIQUE,
  jumlah_stok DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stok_barang FOREIGN KEY (id_barang) REFERENCES barang (id_barang) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel transaksi_pembelian (Header Pembelian dari Pemasok)
CREATE TABLE IF NOT EXISTS transaksi_pembelian (
  id_pembelian INT AUTO_INCREMENT PRIMARY KEY,
  nomor_transaksi VARCHAR(50) NOT NULL UNIQUE,
  tanggal_transaksi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_pemasok INT NOT NULL,
  id_user INT NOT NULL,
  total_pembelian DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status_transaksi ENUM('Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Selesai',
  status_pembayaran ENUM('Lunas', 'Sebagian', 'Belum Lunas') NOT NULL DEFAULT 'Lunas',
  qr_token VARCHAR(100) NULL UNIQUE,
  catatan TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_beli_pemasok FOREIGN KEY (id_pemasok) REFERENCES pemasok (id_pemasok) ON DELETE RESTRICT,
  CONSTRAINT fk_beli_user FOREIGN KEY (id_user) REFERENCES users (id_user) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel detail_transaksi_pembelian (Rincian Barang Pembelian)
CREATE TABLE IF NOT EXISTS detail_transaksi_pembelian (
  id_detail_pembelian INT AUTO_INCREMENT PRIMARY KEY,
  id_pembelian INT NOT NULL,
  id_barang INT NOT NULL,
  jumlah_berat DECIMAL(10, 2) NOT NULL,
  harga_beli_satuan DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_detbeli_header FOREIGN KEY (id_pembelian) REFERENCES transaksi_pembelian (id_pembelian) ON DELETE CASCADE,
  CONSTRAINT fk_detbeli_barang FOREIGN KEY (id_barang) REFERENCES barang (id_barang) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabel transaksi_penjualan (Header Penjualan ke Pembeli/Pabrik)
CREATE TABLE IF NOT EXISTS transaksi_penjualan (
  id_penjualan INT AUTO_INCREMENT PRIMARY KEY,
  nomor_transaksi VARCHAR(50) NOT NULL UNIQUE,
  tanggal_transaksi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_pembeli INT NOT NULL,
  id_user INT NOT NULL,
  total_penjualan DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status_transaksi ENUM('Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Selesai',
  status_pembayaran ENUM('Lunas', 'Sebagian', 'Belum Lunas') NOT NULL DEFAULT 'Lunas',
  qr_token VARCHAR(100) NULL UNIQUE,
  catatan TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_jual_pembeli FOREIGN KEY (id_pembeli) REFERENCES pembeli (id_pembeli) ON DELETE RESTRICT,
  CONSTRAINT fk_jual_user FOREIGN KEY (id_user) REFERENCES users (id_user) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Tabel detail_transaksi_penjualan (Rincian Barang Penjualan)
CREATE TABLE IF NOT EXISTS detail_transaksi_penjualan (
  id_detail_penjualan INT AUTO_INCREMENT PRIMARY KEY,
  id_penjualan INT NOT NULL,
  id_barang INT NOT NULL,
  jumlah_berat DECIMAL(10, 2) NOT NULL,
  harga_jual_satuan DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_detjual_header FOREIGN KEY (id_penjualan) REFERENCES transaksi_penjualan (id_penjualan) ON DELETE CASCADE,
  CONSTRAINT fk_detjual_barang FOREIGN KEY (id_barang) REFERENCES barang (id_barang) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Tabel pembayaran (Pencatatan Status Pembayaran Transaksi)
CREATE TABLE IF NOT EXISTS pembayaran (
  id_pembayaran INT AUTO_INCREMENT PRIMARY KEY,
  jenis_transaksi ENUM('Pembelian', 'Penjualan') NOT NULL,
  id_transaksi INT NOT NULL,
  jumlah_dibayar DECIMAL(12, 2) NOT NULL,
  metode_pembayaran VARCHAR(50) NOT NULL DEFAULT 'Tunai',
  tanggal_bayar DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  keterangan VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

