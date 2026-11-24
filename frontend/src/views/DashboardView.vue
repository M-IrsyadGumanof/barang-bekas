<template>
  <div class="space-y-6">
    <!-- Header Dashboard -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Selamat datang kembali, <span class="font-semibold text-emerald-700">{{ authStore.currentUser?.nama_pemasok || authStore.currentUser?.username }}</span>!
        </p>
      </div>

      <div v-if="authStore.isPemilik" class="flex gap-2">
        <router-link 
          to="/pembelian/buat" 
          class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
        >
          <Scale class="w-4 h-4" />
          Transaksi Timbang Baru
        </router-link>
        <router-link 
          to="/penjualan/buat" 
          class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
        >
          <Truck class="w-4 h-4" />
          Jual ke Pabrik
        </router-link>
      </div>
    </div>

    <!-- TAMPILAN DASHBOARD KHUSUS PEMILIK/PENGEPUL (FR-05) -->
    <template v-if="authStore.isPemilik">
      <!-- KPI Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Pembelian" 
          :value="formatRupiah(pemilikData.total_nilai_pembelian)" 
          :subtitle="`${pemilikData.total_transaksi_pembelian || 0} transaksi pembelian`"
          :icon="Scale"
          color="amber"
        />

        <StatCard 
          title="Total Penjualan" 
          :value="formatRupiah(pemilikData.total_nilai_penjualan)" 
          :subtitle="`${pemilikData.total_transaksi_penjualan || 0} transaksi penjualan`"
          :icon="Truck"
          color="blue"
        />

        <StatCard 
          title="Estimasi Keuntungan Kotor" 
          :value="formatRupiah(pemilikData.perkiraan_keuntungan)" 
          subtitle="Penjualan dikurangi pembelian"
          :icon="TrendingUp"
          :color="pemilikData.perkiraan_keuntungan >= 0 ? 'emerald' : 'rose'"
        />

        <StatCard 
          title="Total Stok Gudang" 
          :value="`${pemilikData.total_stok_kg || 0} kg`" 
          :subtitle="`${pemilikData.total_barang || 0} jenis barang aktif`"
          :icon="Boxes"
          color="purple"
        />
      </div>

      <!-- Ringkasan Stok Gudang -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Status Stok Barang Gudang Terkini</h3>
            <p class="text-xs text-slate-500">Ketersediaan barang siap jual ke pabrik</p>
          </div>
          <router-link to="/stok" class="text-xs text-emerald-600 font-semibold hover:underline">
            Lihat Semua &rarr;
          </router-link>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-medium">
                <th class="pb-2">Barang</th>
                <th class="pb-2">Kategori</th>
                <th class="pb-2">Stok Tersedia</th>
                <th class="pb-2">Harga Beli Aktif</th>
                <th class="pb-2">Harga Jual Pabrik</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="b in pemilikData.stok_barang" :key="b.id_barang" class="hover:bg-slate-50">
                <td class="py-2.5 font-semibold text-slate-800">{{ b.nama_barang }}</td>
                <td class="py-2.5 text-slate-500">{{ b.nama_kategori }}</td>
                <td class="py-2.5">
                  <span 
                    class="px-2 py-0.5 rounded-full font-bold text-xs"
                    :class="b.jumlah_stok > 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ b.jumlah_stok }} {{ b.satuan }}
                  </span>
                </td>
                <td class="py-2.5 text-slate-600">Rp {{ Number(b.harga_beli || 0).toLocaleString('id-ID') }}</td>
                <td class="py-2.5 font-semibold text-emerald-700">Rp {{ Number(b.harga_jual || 0).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaksi Terbaru Dua Kolom -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Pembelian Terbaru -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Scale class="w-4 h-4 text-emerald-600" />
              Transaksi Pembelian Terbaru
            </h4>
            <router-link to="/pembelian" class="text-xs text-emerald-600 font-semibold hover:underline">Semua</router-link>
          </div>
          <div class="divide-y divide-slate-100 text-xs">
            <div 
              v-for="beli in pemilikData.pembelian_terbaru" 
              :key="beli.id_pembelian"
              class="py-2.5 flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-slate-800">{{ beli.nama_pemasok }}</p>
                <p class="text-[10px] text-slate-400 font-mono">{{ beli.nomor_transaksi }} &bull; {{ formatDate(beli.tanggal_transaksi) }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-emerald-600">{{ formatRupiah(beli.total_pembelian) }}</p>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">{{ beli.status_pembayaran }}</span>
              </div>
            </div>
            <div v-if="!pemilikData.pembelian_terbaru?.length" class="py-6 text-center text-slate-400">
              Belum ada transaksi pembelian.
            </div>
          </div>
        </div>

        <!-- Penjualan Terbaru -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Truck class="w-4 h-4 text-blue-600" />
              Transaksi Penjualan Pabrik Terbaru
            </h4>
            <router-link to="/penjualan" class="text-xs text-blue-600 font-semibold hover:underline">Semua</router-link>
          </div>
          <div class="divide-y divide-slate-100 text-xs">
            <div 
              v-for="jual in pemilikData.penjualan_terbaru" 
              :key="jual.id_penjualan"
              class="py-2.5 flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-slate-800">{{ jual.nama_pembeli }}</p>
                <p class="text-[10px] text-slate-400 font-mono">{{ jual.nomor_transaksi }} &bull; {{ formatDate(jual.tanggal_transaksi) }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-blue-600">{{ formatRupiah(jual.total_penjualan) }}</p>
                <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">{{ jual.status_pembayaran }}</span>
              </div>
            </div>
            <div v-if="!pemilikData.penjualan_terbaru?.length" class="py-6 text-center text-slate-400">
              Belum ada transaksi penjualan.
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- TAMPILAN DASHBOARD KHUSUS PEMASOK (FR-06) -->
    <template v-else-if="authStore.isPemasok">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Total Uang Diterima" 
          :value="formatRupiah(pemasokData.total_nilai_transaksi)" 
          subtitle="Pendapatan dari setor barang"
          :icon="Receipt"
          color="emerald"
        />

        <StatCard 
          title="Total Barang Disetor" 
          :value="`${pemasokData.total_berat_kg || 0} kg`" 
          subtitle="Akumulasi berat timbangan"
          :icon="Scale"
          color="blue"
        />

        <StatCard 
          title="Jumlah Transaksi" 
          :value="pemasokData.total_transaksi || 0" 
          subtitle="Riwayat penimbangan"
          :icon="Receipt"
          color="purple"
        />
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">Riwayat Setoran Timbang Terbaru</h3>
            <p class="text-xs text-slate-500">Data transaksi penimbangan barang Anda</p>
          </div>
          <router-link to="/riwayat-saya" class="text-xs text-emerald-600 font-semibold hover:underline">
            Lihat Detail &rarr;
          </router-link>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-medium">
                <th class="pb-2">No Transaksi</th>
                <th class="pb-2">Tanggal</th>
                <th class="pb-2">Total Pembayaran</th>
                <th class="pb-2">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="t in pemasokData.transaksi_terbaru" :key="t.id_pembelian" class="hover:bg-slate-50">
                <td class="py-2.5 font-mono font-medium text-emerald-700">{{ t.nomor_transaksi }}</td>
                <td class="py-2.5 text-slate-600">{{ formatDate(t.tanggal_transaksi) }}</td>
                <td class="py-2.5 font-bold text-slate-800">{{ formatRupiah(t.total_pembelian) }}</td>
                <td class="py-2.5">
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    {{ t.status_pembayaran }}
                  </span>
                </td>
              </tr>
              <tr v-if="!pemasokData.transaksi_terbaru?.length">
                <td colspan="4" class="py-6 text-center text-slate-400">Belum ada riwayat transaksi.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { transaksiService } from '../services/transaksiService';
import StatCard from '../components/StatCard.vue';
import { Scale, Truck, TrendingUp, Boxes, Receipt } from 'lucide-vue-next';

const authStore = useAuthStore();
const pemilikData = ref({});
const pemasokData = ref({});

const formatRupiah = (val) => {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const fetchDashboard = async () => {
  try {
    if (authStore.isPemilik) {
      const res = await transaksiService.getPemilikDashboard();
      pemilikData.value = res.data.data;
    } else if (authStore.isPemasok) {
      const res = await transaksiService.getPemasokDashboard();
      pemasokData.value = res.data.data;
    }
  } catch (err) {
    console.error('Error memuat dashboard:', err);
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>

