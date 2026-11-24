<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Transaksi Pembelian (Timbang Masuk)</h2>
        <p class="text-xs text-slate-500">Pencatatan pembelian barang bekas dari pemasok / nasabah lapak (FR-29)</p>
      </div>
      <router-link 
        to="/pembelian/buat" 
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <PlusCircle class="w-4 h-4" />
        Catat Timbang Baru
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
          <label class="text-[10px] text-slate-400 block mb-0.5">Filter Pemasok</label>
          <select v-model="filter.idPemasok" class="border border-slate-300 rounded px-2 py-1 bg-white">
            <option value="">Semua Pemasok</option>
            <option v-for="p in pemasokOptions" :key="p.id_pemasok" :value="p.id_pemasok">
              {{ p.nama_pemasok }}
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

      <span class="text-slate-400 font-medium self-end">Total: {{ list.length }} Transaksi</span>
    </div>

    <!-- Tabel Transaksi Pembelian -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">No. Transaksi</th>
              <th class="py-3 px-4">Waktu</th>
              <th class="py-3 px-4">Pemasok</th>
              <th class="py-3 px-4">Pencatat</th>
              <th class="py-3 px-4">Total Pembayaran</th>
              <th class="py-3 px-4">Status Bayar</th>
              <th class="py-3 px-4 text-center">Aksi / Nota</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in list" :key="item.id_pembelian" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-semibold text-emerald-700">{{ item.nomor_transaksi }}</td>
              <td class="py-3 px-4 text-slate-600">{{ formatDateTime(item.tanggal_transaksi) }}</td>
              <td class="py-3 px-4">
                <span class="font-medium text-slate-800">{{ item.nama_pemasok }}</span>
                <span class="text-[10px] text-slate-400 block font-mono">{{ item.kode_pemasok }}</span>
              </td>
              <td class="py-3 px-4 text-slate-500">{{ item.nama_pencatat }}</td>
              <td class="py-3 px-4 font-bold text-slate-900">Rp {{ Number(item.total_pembelian).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4">
                <span 
                  class="text-[10px] font-semibold px-2 py-0.5 rounded"
                  :class="item.status_pembayaran === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ item.status_pembayaran }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <button 
                  @click="openDetail(item.id_pembelian)" 
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium transition"
                >
                  <Receipt class="w-3.5 h-3.5" />
                  Lihat Nota
                </button>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">Belum ada data transaksi pembelian.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nota / Bukti Transaksi dengan QR Code -->
    <Modal :is-open="detailModalOpen" title="Bukti Transaksi Timbang (Nota Pembelian)" size="lg" @close="detailModalOpen = false">
      <div v-if="selectedDetail" id="printable-receipt" class="space-y-4 text-xs text-slate-700 p-2">
        <!-- Header Nota -->
        <div class="border-b border-slate-200 pb-3 flex justify-between items-start">
          <div>
            <h4 class="font-extrabold text-slate-900 text-base">K.A.G GUDANG BARANG BEKAS</h4>
            <p class="text-[11px] text-slate-500">Pusat Penampungan Barang Bekas - Padang, Sumatera Barat</p>
            <p class="text-[11px] text-slate-500">Telp: 0812-3456-7890</p>
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

        <!-- Info Pemasok -->
        <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div>
            <span class="text-slate-400 block text-[10px]">Pemasok:</span>
            <span class="font-bold text-slate-800">{{ selectedDetail.nama_pemasok }} ({{ selectedDetail.kode_pemasok }})</span>
            <p class="text-[10px] text-slate-500">{{ selectedDetail.nomor_telepon }}</p>
          </div>
          <div class="text-right">
            <span class="text-slate-400 block text-[10px]">Kasir / Pencatat:</span>
            <span class="font-semibold text-slate-800">{{ selectedDetail.nama_pencatat }}</span>
            <span class="text-[10px] block font-medium" :class="selectedDetail.status_pembayaran === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'">
              Status: {{ selectedDetail.status_pembayaran }}
            </span>
          </div>
        </div>

        <!-- Tabel Item Timbang -->
        <div>
          <table class="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
            <thead class="bg-slate-100 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th class="p-2">Barang</th>
                <th class="p-2 text-right">Berat (kg)</th>
                <th class="p-2 text-right">Harga Beli</th>
                <th class="p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="it in selectedDetail.items" :key="it.id_detail_pembelian">
                <td class="p-2 font-medium">{{ it.nama_barang }} ({{ it.nama_kategori }})</td>
                <td class="p-2 text-right font-mono">{{ it.jumlah_berat }} {{ it.satuan }}</td>
                <td class="p-2 text-right font-mono">Rp {{ Number(it.harga_beli_satuan).toLocaleString('id-ID') }}</td>
                <td class="p-2 text-right font-bold font-mono">Rp {{ Number(it.subtotal).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-slate-50 font-bold border-t border-slate-200 text-sm">
                <td colspan="3" class="p-2 text-right">TOTAL PEMBAYARAN:</td>
                <td class="p-2 text-right text-emerald-700 font-mono">
                  Rp {{ Number(selectedDetail.total_pembelian).toLocaleString('id-ID') }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- QR Code Bukti Transaksi -->
        <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div class="text-xs text-slate-500 max-w-xs">
            <p class="font-semibold text-slate-700">QR Code Verifikasi Transaksi:</p>
            <p class="text-[10px] mt-0.5">Pemasok dapat memindai QR Code ini untuk memeriksa dan memverifikasi detail timbangan secara mandiri (FR-34).</p>
          </div>
          <div v-if="selectedDetail.qr_code" class="text-center">
            <img :src="selectedDetail.qr_code" alt="QR Code Nota" class="w-24 h-24 border border-slate-200 rounded p-1 bg-white inline-block" />
            <span class="block text-[9px] text-slate-400 font-mono mt-0.5">Token: {{ selectedDetail.qr_token?.slice(0, 10) }}...</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button 
            @click="printReceipt" 
            class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-1.5 transition text-xs"
          >
            <Printer class="w-4 h-4" />
            Cetak Nota
          </button>
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
import { PlusCircle, Receipt, Printer } from 'lucide-vue-next';

const list = ref([]);
const pemasokOptions = ref([]);
const filter = ref({
  startDate: '',
  endDate: '',
  idPemasok: ''
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
    const res = await transaksiService.getAllPembelian({
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
      id_pemasok: filter.value.idPemasok
    });
    list.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat pembelian:', err);
  }
};

const loadPemasok = async () => {
  try {
    const res = await masterService.getPemasok();
    pemasokOptions.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat opsi pemasok:', err);
  }
};

const openDetail = async (id) => {
  try {
    const res = await transaksiService.getPembelianById(id);
    selectedDetail.value = res.data.data;
    detailModalOpen.value = true;
  } catch (err) {
    alert('Gagal memuat detail nota.');
  }
};

const printReceipt = () => {
  window.print();
};

onMounted(() => {
  loadPemasok();
  fetchData();
});
</script>

