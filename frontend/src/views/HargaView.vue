<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Kelola Harga Master</h2>
        <p class="text-xs text-slate-500">Perbarui harga beli & harga jual acuan (Perubahan harga tidak mengubah histori transaksi lama - BR-14)</p>
      </div>
      <button 
        @click="openUpdateModal"
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <Coins class="w-4 h-4" />
        Tetapkan Harga Baru
      </button>
    </div>

    <!-- Alert -->
    <div v-if="alertMessage" class="p-3 rounded-lg text-xs" :class="alertSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'">
      {{ alertMessage }}
    </div>

    <!-- Tabel Histori Perubahan Harga -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-sm">Riwayat & Status Harga Master</h3>
        <span class="text-xs text-slate-400">Total catatan: {{ historyList.length }}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Nama Barang</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">Harga Beli (Lapak)</th>
              <th class="py-3 px-4">Harga Jual (Pabrik)</th>
              <th class="py-3 px-4">Margin Kotor</th>
              <th class="py-3 px-4">Mulai Berlaku</th>
              <th class="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="h in historyList" :key="h.id_harga" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-semibold text-slate-800">{{ h.nama_barang }}</td>
              <td class="py-3 px-4 text-slate-500">{{ h.nama_kategori }}</td>
              <td class="py-3 px-4 font-medium text-slate-700">Rp {{ Number(h.harga_beli).toLocaleString('id-ID') }} / {{ h.satuan }}</td>
              <td class="py-3 px-4 font-bold text-blue-700">Rp {{ Number(h.harga_jual).toLocaleString('id-ID') }} / {{ h.satuan }}</td>
              <td class="py-3 px-4 font-semibold text-emerald-700">
                +Rp {{ Number(h.harga_jual - h.harga_beli).toLocaleString('id-ID') }}
              </td>
              <td class="py-3 px-4 text-slate-600 font-mono">{{ formatDate(h.tanggal_mulai_berlaku) }}</td>
              <td class="py-3 px-4">
                <span 
                  class="text-[10px] font-semibold px-2 py-0.5 rounded"
                  :class="h.status_harga === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'"
                >
                  {{ h.status_harga }}
                </span>
              </td>
            </tr>
            <tr v-if="historyList.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">Belum ada catatan harga.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Tetapkan Harga Baru -->
    <Modal 
      :is-open="modalOpen" 
      title="Tetapkan Harga Master Baru" 
      size="sm"
      @close="modalOpen = false"
    >
      <form @submit.prevent="submitPrice" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Pilih Barang *</label>
          <select 
            v-model="form.id_barang" 
            required 
            class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option disabled value="">Pilih Barang...</option>
            <option v-for="b in barangOptions" :key="b.id_barang" :value="b.id_barang">
              {{ b.nama_barang }} ({{ b.nama_kategori }})
            </option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Harga Beli dari Pemasok (Rp/kg) *</label>
          <input 
            v-model.number="form.harga_beli" 
            type="number" 
            min="0"
            required
            placeholder="cth: 2500"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Harga Jual ke Pabrik (Rp/kg) *</label>
          <input 
            v-model.number="form.harga_jual" 
            type="number" 
            min="0"
            required
            placeholder="cth: 3500"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Tanggal Mulai Berlaku</label>
          <input 
            v-model="form.tanggal_mulai_berlaku" 
            type="date" 
            required
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div class="flex justify-end gap-2 pt-3">
          <button 
            type="button" 
            @click="modalOpen = false" 
            class="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Batal
          </button>
          <button 
            type="submit" 
            class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
          >
            Simpan Harga Baru
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { masterService } from '@/services/masterService';
import Modal from '@/components/Modal.vue';
import { Coins } from 'lucide-vue-next';

const historyList = ref([]);
const barangOptions = ref([]);
const modalOpen = ref(false);

const alertMessage = ref('');
const alertSuccess = ref(true);

const form = ref({
  id_barang: '',
  harga_beli: 0,
  harga_jual: 0,
  tanggal_mulai_berlaku: new Date().toISOString().split('T')[0]
});

const showAlert = (msg, success = true) => {
  alertMessage.value = msg;
  alertSuccess.value = success;
  setTimeout(() => { alertMessage.value = ''; }, 4000);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const fetchData = async () => {
  try {
    const [histRes, brgRes] = await Promise.all([
      masterService.getHargaHistory(),
      masterService.getBarang()
    ]);
    historyList.value = histRes.data.data;
    barangOptions.value = brgRes.data.data;
  } catch (err) {
    console.error('Gagal memuat harga:', err);
  }
};

const openUpdateModal = () => {
  form.value = {
    id_barang: barangOptions.value[0]?.id_barang || '',
    harga_beli: 0,
    harga_jual: 0,
    tanggal_mulai_berlaku: new Date().toISOString().split('T')[0]
  };
  modalOpen.value = true;
};

const submitPrice = async () => {
  try {
    await masterService.setNewPrice(form.value);
    showAlert('Harga baru berhasil ditetapkan dan status diaktifkan!');
    modalOpen.value = false;
    fetchData();
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan harga baru.', false);
  }
};

onMounted(() => {
  fetchData();
});
</script>

