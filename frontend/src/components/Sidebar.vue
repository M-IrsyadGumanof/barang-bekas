<template>
  <aside 
    class="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static flex flex-col justify-between"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div>
      <!-- Brand Sidebar Header -->
      <div class="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
            KG
          </div>
          <div>
            <h1 class="text-sm font-bold text-white tracking-wide">K.A.G SISTEM</h1>
            <p class="text-[10px] text-slate-400">Pengepul Barang Bekas</p>
          </div>
        </div>
        <button @click="$emit('close')" class="lg:hidden p-1 text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="px-4 py-4 space-y-1.5 text-xs font-medium">
        <!-- Common Route -->
        <router-link 
          to="/dashboard" 
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
          :class="$route.path === '/dashboard' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
        >
          <LayoutDashboard class="w-4 h-4" />
          Dashboard
        </router-link>

        <!-- Menu Khusus Pemilik/Pengepul -->
        <template v-if="authStore.isPemilik">
          <div class="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Operasional
          </div>

          <router-link 
            to="/pembelian" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path.startsWith('/pembelian') ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Scale class="w-4 h-4" />
            Pembelian (Timbang)
          </router-link>

          <router-link 
            to="/penjualan" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path.startsWith('/penjualan') ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Truck class="w-4 h-4" />
            Penjualan (Pabrik)
          </router-link>

          <router-link 
            to="/stok" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/stok' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Boxes class="w-4 h-4" />
            Kelola Stok Gudang
          </router-link>

          <div class="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Data Master
          </div>

          <router-link 
            to="/barang" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/barang' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Package class="w-4 h-4" />
            Data Barang
          </router-link>

          <router-link 
            to="/kategori" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/kategori' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Layers class="w-4 h-4" />
            Kategori Barang
          </router-link>

          <router-link 
            to="/harga" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/harga' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Coins class="w-4 h-4" />
            Kelola Harga Master
          </router-link>

          <router-link 
            to="/pemasok" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/pemasok' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Users class="w-4 h-4" />
            Data Pemasok
          </router-link>

          <router-link 
            to="/pembeli" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/pembeli' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Building2 class="w-4 h-4" />
            Data Pembeli / Pabrik
          </router-link>

          <div class="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Analisis & Laporan
          </div>

          <router-link 
            to="/laporan" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/laporan' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <TrendingUp class="w-4 h-4" />
            Laporan & Keuntungan
          </router-link>
        </template>

        <!-- Menu Khusus Pemasok (FR-33, FR-12) -->
        <template v-if="authStore.isPemasok">
          <div class="pt-3 pb-1 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Area Pemasok
          </div>

          <router-link 
            to="/riwayat-saya" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/riwayat-saya' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <Receipt class="w-4 h-4" />
            Riwayat Setoran Timbang
          </router-link>

          <router-link 
            to="/profil" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition"
            :class="$route.path === '/profil' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
          >
            <UserCircle class="w-4 h-4" />
            Profil Saya
          </router-link>
        </template>
      </nav>
    </div>

    <!-- Footer Sidebar -->
    <div class="p-4 border-t border-slate-800 text-[11px] text-slate-400">
      <div class="flex items-center justify-between">
        <span>K.A.G Pengepul Web</span>
        <span class="text-emerald-400 font-mono">v1.0</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { 
  LayoutDashboard, Scale, Truck, Boxes, Package, Layers, 
  Coins, Users, Building2, TrendingUp, Receipt, UserCircle, X 
} from 'lucide-vue-next';

defineProps({
  isOpen: Boolean
});

defineEmits(['close']);

const authStore = useAuthStore();
</script>

