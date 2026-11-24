<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Transaksi Penjualan (Kirim ke Pabrik)</h2>
        <p class="text-xs text-slate-500">Pencatatan penjualan akumulasi barang bekas ke pabrik daur ulang / pengepul besar (FR-40)</p>
      </div>
      <router-link 
        to="/penjualan/buat" 
        class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <PlusCircle class="w-4 h-4" />
        Catat Penjualan Pabrik
      </router-link>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex flex-wrap items-center gap-2 flex-1">
        <div>
          <label class="text-[10px] text-slate-400 block mb-0.5">Mulai Tanggal</label>
          <input v-model="filter.startDate" type="date" class="border border-slate-300 rounded px-2 py-1" />
        </div>
        <div>
          <label class="text-[10px] text-slate-400 block mb-0.5">Sampai Tanggal</label>
          <input v-model="filter.endDate" type="date" class="border border-slate-300 rounded px-2 py-1" />
        </div>
        <div>
          <label class="text-[10px] text-slate-400 block mb-0.5">Filter Pembeli</label>
          <select v-model="filter.idPembeli" class="border border-slate-300 rounded px-2 py-1 bg-white">
            <option value="">Semua Pembeli</option>
            <option v-for="p in pembeliOptions" :key="p.id_pembeli" :value="p.id_pembeli">
              {{ p.nama_pembeli }}
            </option>
          </select>
        </div>
        <button 
          @click="fetchData" 
          class="self-end bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium transition"
        >
          Terapkan
        </button>
      </div>

      <span class="text-slate-400 font-medium self-end">Total: {{ list.length }} Penjualan</span>
    </div>

    <!-- Tabel Transaksi Penjualan -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">No. Transaksi</th>
              <th class="py-3 px-4">Waktu</th>
              <th class="py-3 px-4">Pembeli / Pabrik</th>
              <th class="py-3 px-4">Pencatat</th>
              <th class="py-3 px-4">Total Penjualan</th>
              <th class="py-3 px-4">Status Bayar</th>
              <th class="py-3 px-4 text-center">Aksi / Nota</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in list" :key="item.id_penjualan" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-semibold text-blue-700">{{ item.nomor_transaksi }}</td>
              <td class="py-3 px-4 text-slate-600">{{ formatDateTime(item.tanggal_transaksi) }}</td>
              <td class="py-3 px-4">
                <span class="font-medium text-slate-800">{{ item.nama_pembeli }}</span>
                <span class="text-[10px] text-slate-400 block font-mono">{{ item.kode_pembeli }} &bull; {{ item.jenis_pembeli }}</span>
              </td>
              <td class="py-3 px-4 text-slate-500">{{ item.nama_pencatat }}</td>
              <td class="py-3 px-4 font-bold text-slate-900">Rp {{ Number(item.total_penjualan).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4">
                <span 
                  class="text-[10px] font-semibold px-2 py-0.5 rounded"
                  :class="item.status_pembayaran === 'Lunas' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ item.status_pembayaran }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <button 
                  @click="openDetail(item.id_penjualan)" 
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium transition"
                >
                  <Receipt class="w-3.5 h-3.5" />
                  Lihat Detail
                </button>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">Belum ada transaksi penjualan pabrik.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Detail Nota Penjualan -->
    <Modal :is-open="detailModalOpen" title="Detail Pengiriman & Penjualan Pabrik" size="lg" @close="detailModalOpen = false">
      <div v-if="selectedDetail" class="space-y-4 text-xs text-slate-700 p-2">
        <div class="border-b border-slate-200 pb-3 flex justify-between items-start">
          <div>
            <h4 class="font-extrabold text-slate-900 text-base">NOTA PENJUALAN KE PABRIK</h4>
            <p class="text-[11px] text-slate-500">K.A.G Gudang Barang Bekas - Pengiriman Barang</p>
          </div>
          <div class="text-right">
            <span class="font-mono font-bold text-xs bg-slate-100 px-2 py-1 rounded block">
              {{ selectedDetail.nomor_transaksi }}
            </span>
            <span class="text-[10px] text-slate-400 block mt-1">
              {{ formatDateTime(selectedDetail.tanggal_transaksi) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div>
            <span class="text-slate-400 block text-[10px]">Pabrik Tujuan:</span>
            <span class="font-bold text-slate-800">{{ selectedDetail.nama_pembeli }} ({{ selectedDetail.jenis_pembeli }})</span>
            <p class="text-[10px] text-slate-500">{{ selectedDetail.alamat_pembeli }}</p>
          </div>
          <div class="text-right">
            <span class="text-slate-400 block text-[10px]">Pencatat:</span>
            <span class="font-semibold text-slate-800">{{ selectedDetail.nama_pencatat }}</span>
            <span class="text-[10px] block font-medium text-blue-700">
              Status: {{ selectedDetail.status_pembayaran }}
            </span>
          </div>
        </div>

        <div>
          <table class="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
            <thead class="bg-slate-100 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th class="p-2">Barang</th>
                <th class="p-2 text-right">Berat Dikirim</th>
                <th class="p-2 text-right">Harga Jual Pabrik</th>
                <th class="p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="it in selectedDetail.items" :key="it.id_detail_penjualan">
                <td class="p-2 font-medium">{{ it.nama_barang }}</td>
                <td class="p-2 text-right font-mono">{{ it.jumlah_berat }} {{ it.satuan }}</td>
                <td class="p-2 text-right font-mono">Rp {{ Number(it.harga_jual_satuan).toLocaleString('id-ID') }}</td>
                <td class="p-2 text-right font-bold font-mono">Rp {{ Number(it.subtotal).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-bold border-t border-slate-200 text-sm">
                <td colspan="3" class="p-2 text-right">TOTAL PENJUALAN:</td>
                <td class="p-2 text-right text-blue-700 font-mono">
                  Rp {{ Number(selectedDetail.total_penjualan).toLocaleString('id-ID') }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { transaksiService } from '@/services/transaksiService';
import { masterService } from '@/services/masterService';
import Modal from '@/components/Modal.vue';
import { PlusCircle, Receipt } from 'lucide-vue-next';

const list = ref([]);
const pembeliOptions = ref([]);
const filter = ref({
  startDate: '',
  endDate: '',
  idPembeli: ''
});

const detailModalOpen = ref(false);
const selectedDetail = ref(null);

const formatDateTime = (str) => {
  if (!str) return '-';
  return new Date(str).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fetchData = async () => {
  try {
    const res = await transaksiService.getAllPenjualan({
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
      id_pembeli: filter.value.idPembeli
    });
    list.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat penjualan:', err);
  }
};

const loadPembeli = async () => {
  try {
    const res = await masterService.getPembeli();
    pembeliOptions.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat pembeli:', err);
  }
};

const openDetail = async (id) => {
  try {
    const res = await transaksiService.getPenjualanById(id);
    selectedDetail.value = res.data.data;
    detailModalOpen.value = true;
  } catch (err) {
    alert('Gagal memuat detail penjualan.');
  }
};

onMounted(() => {
  loadPembeli();
  fetchData();
});
</script>

