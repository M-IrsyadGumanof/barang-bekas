import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import PemasokView from '../views/PemasokView.vue';
import PembeliView from '../views/PembeliView.vue';
import KategoriView from '../views/KategoriView.vue';
import BarangView from '../views/BarangView.vue';
import HargaView from '../views/HargaView.vue';
import TransaksiPembelianView from '../views/transaksi/TransaksiPembelianView.vue';
import TransaksiPembelianFormView from '../views/transaksi/TransaksiPembelianFormView.vue';
import TransaksiPenjualanView from '../views/transaksi/TransaksiPenjualanView.vue';
import TransaksiPenjualanFormView from '../views/transaksi/TransaksiPenjualanFormView.vue';
import StokView from '../views/StokView.vue';
import LaporanView from '../views/LaporanView.vue';
import RiwayatPemasokView from '../views/RiwayatPemasokView.vue';
import ProfilView from '../views/ProfilView.vue';
import VerifikasiQrView from '../views/VerifikasiQrView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/verifikasi/:token?',
    name: 'VerifikasiQr',
    component: VerifikasiQrView,
    meta: { public: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/pemasok',
    name: 'Pemasok',
    component: PemasokView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/pembeli',
    name: 'Pembeli',
    component: PembeliView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/kategori',
    name: 'Kategori',
    component: KategoriView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/barang',
    name: 'Barang',
    component: BarangView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/harga',
    name: 'Harga',
    component: HargaView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/pembelian',
    name: 'TransaksiPembelian',
    component: TransaksiPembelianView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/pembelian/buat',
    name: 'TransaksiPembelianForm',
    component: TransaksiPembelianFormView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/penjualan',
    name: 'TransaksiPenjualan',
    component: TransaksiPenjualanView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/penjualan/buat',
    name: 'TransaksiPenjualanForm',
    component: TransaksiPenjualanFormView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/stok',
    name: 'Stok',
    component: StokView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/laporan',
    name: 'Laporan',
    component: LaporanView,
    meta: { requiresAuth: true, role: 'Pemilik/Pengepul' }
  },
  {
    path: '/riwayat-saya',
    name: 'RiwayatPemasok',
    component: RiwayatPemasokView,
    meta: { requiresAuth: true, role: 'Pemasok' }
  },
  {
    path: '/profil',
    name: 'Profil',
    component: ProfilView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

// Route Guard untuk proteksi autentikasi dan peran (role)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (to.meta.requiresAuth) {
    if (!token) {
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }

    if (to.meta.role && user?.role !== to.meta.role) {
      // Jika peran tidak sesuai, arahkan ke dashboard
      return next({ name: 'Dashboard' });
    }
  }

  // Jika sudah login dan mencoba ke halaman login, alihkan ke dashboard
  if (to.name === 'Login' && token) {
    return next({ name: 'Dashboard' });
  }

  next();
});

export default router;

