<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Kelola Stok Gudang</h2>
        <p class="text-xs text-slate-500">Monitoring ketersediaan fisik barang bekas siap jual (FR-36, FR-37, FR-38)</p>
      </div>
      <button 
        @click="openAdjustModal"
        class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <Sliders class="w-4 h-4" />
        Koreksi Stok Fisik (Opname)
      </button>
    </div>

    <!-- KPI Ringkasan Stok & Nilai Aset -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Muatan Fisik</span>
        <div class="text-2xl font-black text-slate-800 mt-2 font-mono">
          {{ Number(summary.total_stok_kg || 0).toLocaleString('id-ID') }} kg
        </div>
        <p class="text-xs text-slate-400 mt-1">Akumulasi seluruh barang di gudang</p>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Estimasi Nilai Aset Stok</span>
        <div class="text-2xl font-black text-emerald-700 mt-2 font-mono">
          Rp {{ Number(summary.total_nilai_aset || 0).toLocaleString('id-ID') }}
        </div>
        <p class="text-xs text-slate-400 mt-1">Berdasarkan harga beli acuan terkini</p>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Jenis Barang Siap Jual</span>
        <div class="text-2xl font-black text-blue-700 mt-2 font-mono">
          {{ summary.total_item_barang || 0 }} Komoditas
        </div>
        <p class="text-xs text-slate-400 mt-1">Siap dikirim ke mitra pabrik</p>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="alertMessage" class="p-3 rounded-lg text-xs" :class="alertSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'">
      {{ alertMessage }}
    </div>

    <!-- Tabel Monitoring Stok -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-sm">Status Rincian Stok per Barang</h3>
        <span class="text-xs text-slate-400">Pembaruan otomatis saat transaksi selesai</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Kode</th>
              <th class="py-3 px-4">Nama Barang</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">Stok Fisik Tersedia</th>
              <th class="py-3 px-4">Harga Beli Lapak</th>
              <th class="py-3 px-4">Harga Jual Pabrik</th>
              <th class="py-3 px-4">Estimasi Nilai Barang</th>
              <th class="py-3 px-4">Terakhir Diperbarui</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in stokList" :key="item.id_stok" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-medium text-slate-700">{{ item.kode_barang }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ item.nama_barang }}</td>
              <td class="py-3 px-4 text-slate-500">{{ item.nama_kategori }}</td>
              <td class="py-3 px-4">
                <span 
                  class="font-mono font-extrabold px-2.5 py-1 rounded text-xs inline-block"
                  :class="item.jumlah_stok > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'"
                >
                  {{ Number(item.jumlah_stok).toLocaleString('id-ID') }} {{ item.satuan }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600 font-mono">Rp {{ Number(item.harga_beli_aktif || 0).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4 text-blue-700 font-mono font-medium">Rp {{ Number(item.harga_jual_aktif || 0).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4 font-bold text-slate-900 font-mono">Rp {{ Number(item.nilai_aset_stok || 0).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4 text-slate-400 font-mono text-[11px]">{{ formatDateTime(item.updated_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Koreksi Stok (Opname) -->
    <Modal :is-open="adjustModalOpen" title="Koreksi / Penyesuaian Stok Gudang" size="sm" @close="adjustModalOpen = false">
      <form @submit.prevent="submitAdjust" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Pilih Barang *</label>
          <select 
            v-model="adjustForm.id_barang" 
            required 
            class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option disabled value="">Pilih barang...</option>
            <option v-for="b in stokList" :key="b.id_barang" :value="b.id_barang">
              {{ b.nama_barang }} (Saat ini: {{ b.jumlah_stok }} {{ b.satuan }})
            </option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Jumlah Stok Fisik Riil Terbaru (kg) *</label>
          <input 
            v-model.number="adjustForm.jumlah_stok_baru" 
            type="number" 
            step="0.01" 
            min="0" 
            required
            placeholder="cth: 200.5"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Alasan Penyesuaian</label>
          <textarea 
            v-model="adjustForm.keterangan" 
            rows="2" 
            placeholder="Hasil timbang opname bulanan, penyusutan susut air, dll..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3">
          <button 
            type="button" 
            @click="adjustModalOpen = false" 
            class="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Batal
          </button>
          <button 
            type="submit" 
            class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition"
          >
            Simpan Koreksi
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { transaksiService } from '../services/transaksiService';
import Modal from '../components/Modal.vue';
import { Sliders } from 'lucide-vue-next';

const stokList = ref([]);
const summary = ref({});
const adjustModalOpen = ref(false);

const alertMessage = ref('');
const alertSuccess = ref(true);

const adjustForm = ref({
  id_barang: '',
  jumlah_stok_baru: null,
  keterangan: ''
});

const showAlert = (msg, success = true) => {
  alertMessage.value = msg;
  alertSuccess.value = success;
  setTimeout(() => { alertMessage.value = ''; }, 4000);
};

const formatDateTime = (str) => {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fetchStok = async () => {
  try {
    const res = await transaksiService.getStok();
    stokList.value = res.data.data;
    summary.value = res.data.summary;
  } catch (err) {
    console.error('Gagal memuat stok:', err);
  }
};

const openAdjustModal = () => {
  adjustForm.value = {
    id_barang: stokList.value[0]?.id_barang || '',
    jumlah_stok_baru: null,
    keterangan: ''
  };
  adjustModalOpen.value = true;
};

const submitAdjust = async () => {
  try {
    await transaksiService.adjustStok(adjustForm.value);
    showAlert('Stok barang berhasil diperbarui!');
    adjustModalOpen.value = false;
    fetchStok();
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyesuaikan stok.', false);
  }
};

onMounted(() => {
  fetchStok();
});
</script>

