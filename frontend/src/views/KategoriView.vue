<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Kategori Barang Bekas</h2>
        <p class="text-xs text-slate-500">Kelompok kategori material (Kertas, Plastik, Logam, Kaleng, dll)</p>
      </div>
      <button 
        @click="openCreateModal"
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <FolderPlus class="w-4 h-4" />
        Tambah Kategori
      </button>
    </div>

    <!-- Alert -->
    <div v-if="alertMessage" class="p-3 rounded-lg text-xs" :class="alertSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'">
      {{ alertMessage }}
    </div>

    <!-- Grid Kategori Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div 
        v-for="item in kategoriList" 
        :key="item.id_kategori"
        class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between">
            <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              {{ item.id_kategori }}
            </span>
            <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              {{ item.total_barang || 0 }} barang
            </span>
          </div>
          <h4 class="font-bold text-slate-800 text-sm mt-3">{{ item.nama_kategori }}</h4>
          <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ item.deskripsi || 'Tidak ada deskripsi.' }}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button 
            @click="openEditModal(item)" 
            class="p-1 text-slate-400 hover:text-blue-600 rounded transition"
            title="Ubah"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="deleteItem(item.id_kategori)" 
            class="p-1 text-slate-400 hover:text-red-600 rounded transition"
            title="Hapus"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <Modal 
      :is-open="modalOpen" 
      :title="isEdit ? 'Ubah Kategori Barang' : 'Tambah Kategori Baru'" 
      size="sm"
      @close="modalOpen = false"
    >
      <form @submit.prevent="saveKategori" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nama Kategori *</label>
          <input 
            v-model="form.nama_kategori" 
            type="text" 
            required 
            placeholder="Contoh: Kertas & Karton"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Deskripsi</label>
          <textarea 
            v-model="form.deskripsi" 
            rows="2" 
            placeholder="Deskripsi jenis barang dalam kategori ini..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
          >
            Simpan
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
import { FolderPlus, Edit2, Trash2 } from 'lucide-vue-next';

const kategoriList = ref([]);
const modalOpen = ref(false);
const isEdit = ref(false);
const editId = ref(null);

const alertMessage = ref('');
const alertSuccess = ref(true);

const form = ref({
  nama_kategori: '',
  deskripsi: ''
});

const showAlert = (msg, success = true) => {
  alertMessage.value = msg;
  alertSuccess.value = success;
  setTimeout(() => { alertMessage.value = ''; }, 4000);
};

const fetchData = async () => {
  try {
    const res = await masterService.getKategori();
    kategoriList.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat kategori:', err);
  }
};

const openCreateModal = () => {
  isEdit.value = false;
  editId.value = null;
  form.value = { nama_kategori: '', deskripsi: '' };
  modalOpen.value = true;
};

const openEditModal = (item) => {
  isEdit.value = true;
  editId.value = item.id_kategori;
  form.value = {
    nama_kategori: item.nama_kategori,
    deskripsi: item.deskripsi || ''
  };
  modalOpen.value = true;
};

const saveKategori = async () => {
  try {
    if (isEdit.value) {
      await masterService.updateKategori(editId.value, form.value);
      showAlert('Kategori berhasil diperbarui!');
    } else {
      await masterService.createKategori(form.value);
      showAlert('Kategori baru berhasil ditambahkan!');
    }
    modalOpen.value = false;
    fetchData();
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan kategori.', false);
  }
};

const deleteItem = async (id) => {
  if (confirm('Hapus kategori ini?')) {
    try {
      await masterService.deleteKategori(id);
      showAlert('Kategori berhasil dihapus.');
      fetchData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus kategori.', false);
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

