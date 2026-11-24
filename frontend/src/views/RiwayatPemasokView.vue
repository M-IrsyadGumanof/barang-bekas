<template>
  <div class="space-y-5">
    <div>
      <h2 class="text-xl font-bold text-slate-900">Riwayat Setoran Timbang Saya</h2>
      <p class="text-xs text-slate-500">Daftar transaksi penimbangan barang bekas yang Anda setorkan ke pengepul (FR-33, FR-34)</p>
    </div>

    <!-- Alert / Pesan -->
    <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
      <Info class="w-4 h-4 shrink-0 text-blue-500" />
      <span>Sistem ini menjamin transparansi data penimbangan Anda. Anda dapat memeriksa nota dan kode verifikasi QR setiap saat.</span>
    </div>

    <!-- Tabel Riwayat Transaksi Pemasok -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">No. Transaksi</th>
              <th class="py-3 px-4">Tanggal Penimbangan</th>
              <th class="py-3 px-4">Jumlah Jenis Barang</th>
              <th class="py-3 px-4">Total Berat</th>
              <th class="py-3 px-4">Uang Diterima</th>
              <th class="py-3 px-4">Status Pembayaran</th>
              <th class="py-3 px-4 text-center">Bukti Nota</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in list" :key="t.id_pembelian" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-bold text-emerald-700">{{ t.nomor_transaksi }}</td>
              <td class="py-3 px-4 text-slate-600">{{ formatDateTime(t.tanggal_transaksi) }}</td>
              <td class="py-3 px-4 text-slate-700">{{ t.total_item }} jenis</td>
              <td class="py-3 px-4 font-mono font-semibold">{{ t.total_berat }} kg</td>
              <td class="py-3 px-4 font-extrabold text-slate-900 font-mono">
                Rp {{ Number(t.total_pembelian).toLocaleString('id-ID') }}
              </td>
              <td class="py-3 px-4">
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {{ t.status_pembayaran }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <button 
                  @click="openNota(t.id_pembelian)"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded font-semibold transition"
                >
                  <Receipt class="w-3.5 h-3.5" />
                  Lihat Nota & QR
                </button>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">Belum ada riwayat transaksi setoran.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nota Transaksi Pemasok -->
    <Modal :is-open="modalOpen" title="Bukti Transaksi Timbang Resmi" size="md" @close="modalOpen = false">
      <div v-if="selectedNota" class="space-y-4 text-xs text-slate-700 p-2">
        <div class="border-b border-slate-200 pb-2 flex justify-between items-start">
          <div>
            <h4 class="font-extrabold text-slate-900 text-sm">K.A.G GUDANG BARANG BEKAS</h4>
            <p class="text-[10px] text-slate-500">Padang, Sumatera Barat</p>
          </div>
          <span class="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
            {{ selectedNota.nomor_transaksi }}
          </span>
        </div>

        <div class="text-xs text-slate-600 space-y-1">
          <p><span class="text-slate-400">Pemasok:</span> <b>{{ selectedNota.nama_pemasok }}</b></p>
          <p><span class="text-slate-400">Waktu Timbang:</span> {{ formatDateTime(selectedNota.tanggal_transaksi) }}</p>
        </div>

        <div class="border border-slate-200 rounded overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th class="p-2 text-left">Barang</th>
                <th class="p-2 text-right">Berat (kg)</th>
                <th class="p-2 text-right">Harga (Rp/kg)</th>
                <th class="p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="it in selectedNota.items" :key="it.id_detail_pembelian">
                <td class="p-2 font-medium">{{ it.nama_barang }}</td>
                <td class="p-2 text-right font-mono">{{ it.jumlah_berat }}</td>
                <td class="p-2 text-right font-mono">Rp {{ Number(it.harga_beli_satuan).toLocaleString('id-ID') }}</td>
                <td class="p-2 text-right font-bold font-mono">Rp {{ Number(it.subtotal).toLocaleString('id-ID') }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-emerald-50 text-emerald-900 font-bold border-t border-slate-200">
                <td colspan="3" class="p-2 text-right">TOTAL DITERIMA:</td>
                <td class="p-2 text-right font-mono text-sm">
                  Rp {{ Number(selectedNota.total_pembelian).toLocaleString('id-ID') }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="selectedNota.qr_code" class="text-center pt-2">
          <img :src="selectedNota.qr_code" alt="QR Nota" class="w-24 h-24 mx-auto border border-slate-200 rounded p-1 bg-white" />
          <span class="block text-[10px] text-slate-400 font-mono mt-1">Kode QR Validasi Keaslian Transaksi</span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { transaksiService } from '../services/transaksiService';
import Modal from '../components/Modal.vue';
import { Info, Receipt } from 'lucide-vue-next';

const list = ref([]);
const modalOpen = ref(false);
const selectedNota = ref(null);

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
    const res = await transaksiService.getRiwayatPemasok();
    list.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat riwayat pemasok:', err);
  }
};

const openNota = async (id) => {
  try {
    const res = await transaksiService.getPembelianById(id);
    selectedNota.value = res.data.data;
    modalOpen.value = true;
  } catch (err) {
    alert('Gagal memuat detail nota.');
  }
};

onMounted(() => {
  fetchData();
});
</script>

