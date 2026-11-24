<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Data Pembeli / Pabrik</h2>
        <p class="text-xs text-slate-500">Kelola data pabrik daur ulang dan pengepul besar tujuan penjualan barang</p>
      </div>
      <button 
        @click="openCreateModal"
        class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <Building2 class="w-4 h-4" />
        Tambah Pembeli Baru
      </button>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input 
          v-model="search" 
          @input="fetchData"
          type="text" 
          placeholder="Cari nama pabrik, kode (PBL-...), atau telepon..." 
          class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <span class="text-xs text-slate-400 font-medium">Total: {{ pembeliList.length }} Pembeli</span>
    </div>

    <!-- Alert -->
    <div v-if="alertMessage" class="p-3 rounded-lg text-xs" :class="alertSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'">
      {{ alertMessage }}
    </div>

    <!-- Tabel Pembeli -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Kode</th>
              <th class="py-3 px-4">Nama Perusahaan / Pembeli</th>
              <th class="py-3 px-4">Jenis Pembeli</th>
              <th class="py-3 px-4">No. Telepon</th>
              <th class="py-3 px-4">Alamat Pabrik / Gudang</th>
              <th class="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in pembeliList" :key="item.id_pembeli" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-medium text-blue-700">{{ item.kode_pembeli }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ item.nama_pembeli }}</td>
              <td class="py-3 px-4">
                <span class="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {{ item.jenis_pembeli }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600">{{ item.nomor_telepon }}</td>
              <td class="py-3 px-4 text-slate-500 max-w-xs truncate">{{ item.alamat || '-' }}</td>
              <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditModal(item)" 
                    class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Ubah"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    @click="deleteItem(item.id_pembeli)" 
                    class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Hapus"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pembeliList.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">Tidak ada data pembeli ditemukan.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah / Edit -->
    <Modal 
      :is-open="modalOpen" 
      :title="isEdit ? 'Ubah Data Pembeli' : 'Tambah Pembeli Baru'" 
      size="md"
      @close="modalOpen = false"
    >
      <form @submit.prevent="savePembeli" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nama Pembeli / Perusahaan *</label>
          <input 
            v-model="form.nama_pembeli" 
            type="text" 
            required 
            placeholder="Contoh: PT Pabrik Daur Ulang Mandiri"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Jenis Pembeli *</label>
          <select 
            v-model="form.jenis_pembeli" 
            required 
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Pabrik Pengolahan">Pabrik Pengolahan / Daur Ulang</option>
            <option value="Pengepul Besar">Pengepul Besar / Lapak Induk</option>
            <option value="Industri Rumahan">Industri Rumahan / Pengrajin</option>
            <option value="Individu">Individu</option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nomor Telepon Kantor / PIC *</label>
          <input 
            v-model="form.nomor_telepon" 
            type="text" 
            required 
            placeholder="Contoh: 0751-892341 atau 0811..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Alamat Pabrik / Gudang</label>
          <textarea 
            v-model="form.alamat" 
            rows="2" 
            placeholder="Kawasan Industri By Pass KM 14, Padang"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
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
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            {{ isEdit ? 'Simpan Perubahan' : 'Tambah Pembeli' }}
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
import { Building2, Search, Edit2, Trash2 } from 'lucide-vue-next';

const pembeliList = ref([]);
const search = ref('');
const modalOpen = ref(false);
const isEdit = ref(false);
const editId = ref(null);

const alertMessage = ref('');
const alertSuccess = ref(true);

const form = ref({
  nama_pembeli: '',
  nomor_telepon: '',
  alamat: '',
  jenis_pembeli: 'Pabrik Pengolahan'
});

const showAlert = (msg, success = true) => {
  alertMessage.value = msg;
  alertSuccess.value = success;
  setTimeout(() => { alertMessage.value = ''; }, 4000);
};

const fetchData = async () => {
  try {
    const res = await masterService.getPembeli(search.value);
    pembeliList.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat pembeli:', err);
  }
};

const openCreateModal = () => {
  isEdit.value = false;
  editId.value = null;
  form.value = { nama_pembeli: '', nomor_telepon: '', alamat: '', jenis_pembeli: 'Pabrik Pengolahan' };
  modalOpen.value = true;
};

const openEditModal = (item) => {
  isEdit.value = true;
  editId.value = item.id_pembeli;
  form.value = {
    nama_pembeli: item.nama_pembeli,
    nomor_telepon: item.nomor_telepon,
    alamat: item.alamat || '',
    jenis_pembeli: item.jenis_pembeli || 'Pabrik Pengolahan'
  };
  modalOpen.value = true;
};

const savePembeli = async () => {
  try {
    if (isEdit.value) {
      await masterService.updatePembeli(editId.value, form.value);
      showAlert('Data pembeli berhasil diperbarui!');
    } else {
      await masterService.createPembeli(form.value);
      showAlert('Pembeli baru berhasil ditambahkan!');
    }
    modalOpen.value = false;
    fetchData();
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan pembeli.', false);
  }
};

const deleteItem = async (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus pembeli ini?')) {
    try {
      await masterService.deletePembeli(id);
      showAlert('Pembeli berhasil dihapus.');
      fetchData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus pembeli.', false);
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

