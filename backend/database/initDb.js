const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'db_pengepul_barang_bekas';

  console.log(`Menghubungkan ke MySQL di ${host}:${port} sebagai ${user}...`);

  let connection;
  try {
    // Hubungkan tanpa database dulu untuk CREATE DATABASE
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log(`Membuat database '${dbName}' jika belum ada...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: dbName });

    console.log('Menjalankan skema DDL (schema.sql)...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('✅ Skema tabel berhasil dibuat / diverifikasi!');

    // Cek apakah data awal sudah ada
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0 || process.argv.includes('--seed')) {
      console.log('Mengisi data awal (seeding)...');

      const passAdmin = await bcrypt.hash('admin123', 10);
      const passPemasok1 = await bcrypt.hash('pemasok123', 10);
      const passPemasok2 = await bcrypt.hash('pemasok123', 10);

      // 1. Insert Users
      await connection.query(`
        INSERT INTO users (id_user, username, email, password_hash, role, status_akun) VALUES
        (1, 'admin', 'admin@kag-pengepul.com', ?, 'Pemilik/Pengepul', 'Aktif'),
        (2, 'andi_pemasok', 'andi@pemasok.com', ?, 'Pemasok', 'Aktif'),
        (3, 'budi_pemasok', 'budi@pemasok.com', ?, 'Pemasok', 'Aktif')
        ON DUPLICATE KEY UPDATE username=VALUES(username)
      `, [passAdmin, passPemasok1, passPemasok2]);

      // 2. Insert Pemasok
      await connection.query(`
        INSERT INTO pemasok (id_pemasok, id_user, kode_pemasok, nama_pemasok, nomor_telepon, alamat) VALUES
        (1, 2, 'PMS-001', 'Andi Pratama', '081234567890', 'Jl. Sawahan No. 12, Padang'),
        (2, 3, 'PMS-002', 'Budi Santoso', '082198765432', 'Jl. Khatib Sulaiman No. 45, Padang')
        ON DUPLICATE KEY UPDATE nama_pemasok=VALUES(nama_pemasok)
      `);

      // 3. Insert Pembeli (Pabrik / Pengepul Besar)
      await connection.query(`
        INSERT INTO pembeli (id_pembeli, kode_pembeli, nama_pembeli, nomor_telepon, alamat, jenis_pembeli) VALUES
        (1, 'PBL-001', 'PT Pabrik Daur Ulang Mandiri', '0751-892341', 'Kawasan Industri By Pass KM 14, Padang', 'Pabrik Pengolahan'),
        (2, 'PBL-002', 'CV Sentosa Logam Perkasa', '0751-678912', 'Jl. Raya Lubuk Begalung No. 88, Padang', 'Pengepul Besar')
        ON DUPLICATE KEY UPDATE nama_pembeli=VALUES(nama_pembeli)
      `);

      // 4. Insert Kategori Barang
      await connection.query(`
        INSERT INTO kategori_barang (id_kategori, nama_kategori, deskripsi) VALUES
        (1, 'Kertas & Karton', 'Berbagai olahan kertas, kardus, koran, dan karton bekas'),
        (2, 'Plastik', 'Botol plastik, botol PET, emberan, dan plastik keras'),
        (3, 'Logam & Besi', 'Besi tua, besi cor, rangka motor/mobil, seng'),
        (4, 'Kaleng & Aluminium', 'Kaleng minuman, aluminium tebal/tipis, tembaga')
        ON DUPLICATE KEY UPDATE nama_kategori=VALUES(nama_kategori)
      `);

      // 5. Insert Barang
      await connection.query(`
        INSERT INTO barang (id_barang, id_kategori, kode_barang, nama_barang, satuan, deskripsi, status) VALUES
        (1, 1, 'BRG-KRD', 'Kardus Bekas Box', 'kg', 'Kardus coklat tebal bebas air dan lem basah', 'Aktif'),
        (2, 1, 'BRG-KRT', 'Kertas HVS & Buku', 'kg', 'Kertas putih bekas kantor dan buku pelajaran', 'Aktif'),
        (3, 2, 'BRG-PET', 'Botol Plastik PET Bening', 'kg', 'Botol air mineral bersih tanpa tutup/label tebal', 'Aktif'),
        (4, 3, 'BRG-BSI', 'Besi Tua Campur', 'kg', 'Potongan besi cor dan rangka besi konstruksi', 'Aktif'),
        (5, 4, 'BRG-KLG', 'Kaleng Minuman & Makanan', 'kg', 'Kaleng susu dan minuman soda bekas', 'Aktif'),
        (6, 4, 'BRG-ALM', 'Aluminium Tebal', 'kg', 'Wajan, velg motor bekas, kusen aluminium', 'Aktif')
        ON DUPLICATE KEY UPDATE nama_barang=VALUES(nama_barang)
      `);

      // 6. Insert Harga Master
      await connection.query(`
        INSERT INTO harga (id_harga, id_barang, harga_beli, harga_jual, tanggal_mulai_berlaku, status_harga) VALUES
        (1, 1, 2000.00, 2800.00, '2026-09-01', 'Aktif'),
        (2, 2, 1500.00, 2200.00, '2026-09-01', 'Aktif'),
        (3, 3, 3500.00, 4800.00, '2026-09-01', 'Aktif'),
        (4, 4, 4500.00, 6000.00, '2026-09-01', 'Aktif'),
        (5, 5, 2500.00, 3600.00, '2026-09-01', 'Aktif'),
        (6, 6, 15000.00, 19500.00, '2026-09-01', 'Aktif')
        ON DUPLICATE KEY UPDATE harga_beli=VALUES(harga_beli), harga_jual=VALUES(harga_jual)
      `);

      // 7. Insert Stok Awal
      await connection.query(`
        INSERT INTO stok (id_stok, id_barang, jumlah_stok) VALUES
        (1, 1, 250.00),
        (2, 2, 120.00),
        (3, 3, 180.00),
        (4, 4, 500.00),
        (5, 5, 90.00),
        (6, 6, 65.00)
        ON DUPLICATE KEY UPDATE jumlah_stok=VALUES(jumlah_stok)
      `);

      console.log('✅ Data seeder berhasil dimasukkan!');
      console.log('----------------------------------------------------');
      console.log('Akun Login Default:');
      console.log('1. Pemilik/Admin : username: admin, password: admin123');
      console.log('2. Pemasok       : username: andi_pemasok, password: pemasok123');
      console.log('----------------------------------------------------');
    } else {
      console.log('ℹ️ Data tabel sudah ada. Lewati seeder (gunakan --seed untuk memaksa isi).');
    }

  } catch (error) {
    console.error('❌ Gagal menginisialisasi basis data:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

initDatabase();

