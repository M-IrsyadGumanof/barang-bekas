<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Laporan & Keuntungan Usaha</h2>
        <p class="text-xs text-slate-500">Rekapitulasi pembelian, penjualan, stok, dan estimasi keuntungan kotor (FR-45 s/d FR-51)</p>
      </div>
      <button 
        @click="printReport"
        class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <Printer class="w-4 h-4" />
        Cetak Laporan
      </button>
    </div>

    <!-- Filter Multi-Kriteria (FR-50) -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs space-y-3">
      <div class="font-bold text-slate-700 flex items-center gap-1.5">
        <Filter class="w-3.5 h-3.5 text-emerald-600" />
        Filter Periode & Komoditas Laporan
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label class="block text-slate-500 mb-1">Mulai Tanggal</label>
          <input v-model="filter.startDate" type="date" class="w-full border border-slate-300 rounded px-2.5 py-1.5" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Sampai Tanggal</label>
          <input v-model="filter.endDate" type="date" class="w-full border border-slate-300 rounded px-2.5 py-1.5" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Pilih Barang</label>
          <select v-model="filter.id_barang" class="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white">
            <option value="">Semua Barang</option>
            <option v-for="b in barangOptions" :key="b.id_barang" :value="b.id_barang">{{ b.nama_barang }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button 
            @click="loadReport" 
            class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Tampilkan Laporan
          </button>
        </div>
      </div>
    </div>

    <!-- Rekapitulasi Keuangan & Margin (FR-51: Keuntungan = Penjualan - Pembelian) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pembelian (Pengeluaran)</span>
        <div class="text-2xl font-black text-amber-700 mt-2 font-mono">
          Rp {{ Number(summary.total_rupiah_beli || 0).toLocaleString('id-ID') }}
        </div>
        <p class="text-xs text-slate-400 mt-1">Total timbangan: {{ Number(summary.total_berat_beli || 0).toLocaleString('id-ID') }} kg</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Penjualan Pabrik (Pemasukan)</span>
        <div class="text-2xl font-black text-blue-700 mt-2 font-mono">
          Rp {{ Number(summary.total_rupiah_jual || 0).toLocaleString('id-ID') }}
        </div>
        <p class="text-xs text-slate-400 mt-1">Total pengiriman: {{ Number(summary.total_berat_jual || 0).toLocaleString('id-ID') }} kg</p>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimasi Laba Kotor (FR-51)</span>
        <div 
          class="text-2xl font-black mt-2 font-mono"
          :class="(summary.estimasi_keuntungan_kotor || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'"
        >
          Rp {{ Number(summary.estimasi_keuntungan_kotor || 0).toLocaleString('id-ID') }}
        </div>
        <p class="text-xs text-slate-400 mt-1">Selisih Penjualan - Pembelian</p>
      </div>
    </div>

    <!-- Tab Pilihan Detail Laporan -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="border-b border-slate-200 flex px-4 pt-2 gap-4 text-xs font-bold text-slate-500">
        <button 
          @click="activeTab = 'pembelian'" 
          class="pb-3 border-b-2 transition"
          :class="activeTab === 'pembelian' ? 'border-emerald-600 text-emerald-700' : 'border-transparent hover:text-slate-700'"
        >
          Rincian Pembelian ({{ detail.pembelian?.length || 0 }})
        </button>
        <button 
          @click="activeTab = 'penjualan'" 
          class="pb-3 border-b-2 transition"
          :class="activeTab === 'penjualan' ? 'border-blue-600 text-blue-700' : 'border-transparent hover:text-slate-700'"
        >
          Rincian Penjualan Pabrik ({{ detail.penjualan?.length || 0 }})
        </button>
        <button 
          @click="activeTab = 'stok'" 
          class="pb-3 border-b-2 transition"
          :class="activeTab === 'stok' ? 'border-purple-600 text-purple-700' : 'border-transparent hover:text-slate-700'"
        >
          Status Stok Barang
        </button>
      </div>

      <!-- Tab Pembelian -->
      <div v-if="activeTab === 'pembelian'" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Tanggal</th>
              <th class="py-3 px-4">No. Transaksi</th>
              <th class="py-3 px-4">Pemasok</th>
              <th class="py-3 px-4">Barang</th>
              <th class="py-3 px-4 text-right">Berat (kg)</th>
              <th class="py-3 px-4 text-right">Harga Beli Satuan</th>
              <th class="py-3 px-4 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(r, idx) in detail.pembelian" :key="idx" class="hover:bg-slate-50">
              <td class="py-2.5 px-4 text-slate-500 font-mono">{{ formatDate(r.tanggal_transaksi) }}</td>
              <td class="py-2.5 px-4 font-mono font-medium text-emerald-700">{{ r.nomor_transaksi }}</td>
              <td class="py-2.5 px-4 font-medium text-slate-800">{{ r.nama_pemasok }}</td>
              <td class="py-2.5 px-4 text-slate-700">{{ r.nama_barang }}</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ r.jumlah_berat }}</td>
              <td class="py-2.5 px-4 text-right font-mono">Rp {{ Number(r.harga_beli_satuan).toLocaleString('id-ID') }}</td>
              <td class="py-2.5 px-4 text-right font-bold font-mono">Rp {{ Number(r.subtotal).toLocaleString('id-ID') }}</td>
            </tr>
            <tr v-if="!detail.pembelian?.length">
              <td colspan="7" class="py-8 text-center text-slate-400">Tidak ada data pembelian pada periode ini.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab Penjualan -->
      <div v-if="activeTab === 'penjualan'" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Tanggal</th>
              <th class="py-3 px-4">No. Transaksi</th>
              <th class="py-3 px-4">Pabrik / Pembeli</th>
              <th class="py-3 px-4">Barang</th>
              <th class="py-3 px-4 text-right">Berat (kg)</th>
              <th class="py-3 px-4 text-right">Harga Jual Satuan</th>
              <th class="py-3 px-4 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(r, idx) in detail.penjualan" :key="idx" class="hover:bg-slate-50">
              <td class="py-2.5 px-4 text-slate-500 font-mono">{{ formatDate(r.tanggal_transaksi) }}</td>
              <td class="py-2.5 px-4 font-mono font-medium text-blue-700">{{ r.nomor_transaksi }}</td>
              <td class="py-2.5 px-4 font-medium text-slate-800">{{ r.nama_pembeli }}</td>
              <td class="py-2.5 px-4 text-slate-700">{{ r.nama_barang }}</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ r.jumlah_berat }}</td>
              <td class="py-2.5 px-4 text-right font-mono">Rp {{ Number(r.harga_jual_satuan).toLocaleString('id-ID') }}</td>
              <td class="py-2.5 px-4 text-right font-bold font-mono">Rp {{ Number(r.subtotal).toLocaleString('id-ID') }}</td>
            </tr>
            <tr v-if="!detail.penjualan?.length">
              <td colspan="7" class="py-8 text-center text-slate-400">Tidak ada data penjualan pada periode ini.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab Stok -->
      <div v-if="activeTab === 'stok'" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Nama Barang</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4 text-right">Stok Fisik Tersedia</th>
              <th class="py-3 px-4 text-right">Harga Beli</th>
              <th class="py-3 px-4 text-right">Harga Jual</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="s in detail.stok" :key="s.id_barang" class="hover:bg-slate-50">
              <td class="py-2.5 px-4 font-semibold text-slate-800">{{ s.nama_barang }}</td>
              <td class="py-2.5 px-4 text-slate-500">{{ s.nama_kategori }}</td>
              <td class="py-2.5 px-4 text-right font-bold font-mono">{{ s.jumlah_stok }} {{ s.satuan }}</td>
              <td class="py-2.5 px-4 text-right font-mono">Rp {{ Number(s.harga_beli_aktif || 0).toLocaleString('id-ID') }}</td>
              <td class="py-2.5 px-4 text-right font-mono text-emerald-700">Rp {{ Number(s.harga_jual_aktif || 0).toLocaleString('id-ID') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { transaksiService } from '../services/transaksiService';
import { masterService } from '../services/masterService';
import { Filter, Printer } from 'lucide-vue-next';

const activeTab = ref('pembelian');
const barangOptions = ref([]);
const filter = ref({
  startDate: '',
  endDate: '',
  id_barang: ''
});

const summary = ref({});
const detail = ref({
  pembelian: [],
  penjualan: [],
  stok: []
});

const formatDate = (str) => {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const loadReport = async () => {
  try {
    const res = await transaksiService.getLaporan(filter.value);
    summary.value = res.data.summary;
    detail.value = res.data.detail;
  } catch (err) {
    console.error('Gagal memuat laporan:', err);
  }
};

const loadBarang = async () => {
  try {
    const res = await masterService.getBarang();
    barangOptions.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat opsi barang:', err);
  }
};

const printReport = () => {
  window.print();
};

onMounted(() => {
  loadBarang();
  loadReport();
});
</script>

