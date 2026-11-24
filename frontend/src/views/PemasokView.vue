<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Data Pemasok</h2>
        <p class="text-xs text-slate-500">Kelola pelanggan/penyetor barang bekas dan akun akses mereka</p>
      </div>
      <button 
        @click="openCreateModal"
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <UserPlus class="w-4 h-4" />
        Tambah Pemasok Baru
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
          placeholder="Cari nama, kode (PMS-...), atau telepon..." 
          class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <span class="text-xs text-slate-400 font-medium">Total: {{ pemasokList.length }} Pemasok</span>
    </div>

    <!-- Alert Sukses / Error -->
    <div v-if="alertMessage" class="p-3 rounded-lg text-xs" :class="alertSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'">
      {{ alertMessage }}
    </div>

    <!-- Tabel Data Pemasok -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Kode</th>
              <th class="py-3 px-4">Nama Pemasok</th>
              <th class="py-3 px-4">No. Telepon</th>
              <th class="py-3 px-4">Alamat</th>
              <th class="py-3 px-4">Akun Login</th>
              <th class="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in pemasokList" :key="item.id_pemasok" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-medium text-emerald-700">{{ item.kode_pemasok }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ item.nama_pemasok }}</td>
              <td class="py-3 px-4 text-slate-600">{{ item.nomor_telepon }}</td>
              <td class="py-3 px-4 text-slate-500 max-w-xs truncate">{{ item.alamat || '-' }}</td>
              <td class="py-3 px-4">
                <span v-if="item.username" class="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono">
                  <User class="w-3 h-3 text-slate-400" />
                  {{ item.username }}
                </span>
                <span v-else class="text-slate-400 text-[10px] italic">Tanpa akun login</span>
              </td>
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
                    @click="deleteItem(item.id_pemasok)" 
                    class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Hapus"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pemasokList.length === 0">
              <td colspan="6" class="py-8 text-center text-slate-400">Tidak ada data pemasok ditemukan.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah / Edit -->
    <Modal 
      :is-open="modalOpen" 
      :title="isEdit ? 'Ubah Data Pemasok' : 'Tambah Pemasok Baru'" 
      size="md"
      @close="modalOpen = false"
    >
      <form @submit.prevent="savePemasok" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nama Pemasok *</label>
          <input 
            v-model="form.nama_pemasok" 
            type="text" 
            required 
            placeholder="Contoh: Andi Pratama"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
          <input 
            v-model="form.nomor_telepon" 
            type="text" 
            required 
            placeholder="Contoh: 081234567890"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Alamat Domisili</label>
          <textarea 
            v-model="form.alamat" 
            rows="2" 
            placeholder="Alamat tempat tinggal / lapak kecil pemasok"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Akun Login (Hanya saat tambah baru) -->
        <div v-if="!isEdit" class="pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-slate-800">Buat Akun Login Pemasok?</span>
            <input type="checkbox" v-model="createAccount" class="rounded text-emerald-600 focus:ring-emerald-500" />
          </div>

          <div v-if="createAccount" class="space-y-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label class="block font-medium text-slate-600 mb-0.5">Username Login</label>
              <input 
                v-model="form.username" 
                type="text" 
                placeholder="cth: andi_pemasok"
                class="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label class="block font-medium text-slate-600 mb-0.5">Email (Opsional)</label>
              <input 
                v-model="form.email" 
                type="email" 
                placeholder="andi@gmail.com"
                class="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label class="block font-medium text-slate-600 mb-0.5">Password</label>
              <input 
                v-model="form.password" 
                type="password" 
                placeholder="Minimal 6 karakter"
                class="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>
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
            {{ isEdit ? 'Simpan Perubahan' : 'Tambah Pemasok' }}
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
import { UserPlus, Search, User, Edit2, Trash2 } from 'lucide-vue-next';

const pemasokList = ref([]);
const search = ref('');
const modalOpen = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const createAccount = ref(false);

const alertMessage = ref('');
const alertSuccess = ref(true);

const form = ref({
  nama_pemasok: '',
  nomor_telepon: '',
  alamat: '',
  username: '',
  email: '',
  password: ''
});

const showAlert = (msg, success = true) => {
  alertMessage.value = msg;
  alertSuccess.value = success;
  setTimeout(() => { alertMessage.value = ''; }, 4000);
};

const fetchData = async () => {
  try {
    const res = await masterService.getPemasok(search.value);
    pemasokList.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat pemasok:', err);
  }
};

const openCreateModal = () => {
  isEdit.value = false;
  editId.value = null;
  createAccount.value = false;
  form.value = { nama_pemasok: '', nomor_telepon: '', alamat: '', username: '', email: '', password: '' };
  modalOpen.value = true;
};

const openEditModal = (item) => {
  isEdit.value = true;
  editId.value = item.id_pemasok;
  form.value = {
    nama_pemasok: item.nama_pemasok,
    nomor_telepon: item.nomor_telepon,
    alamat: item.alamat || ''
  };
  modalOpen.value = true;
};

const savePemasok = async () => {
  try {
    if (isEdit.value) {
      await masterService.updatePemasok(editId.value, form.value);
      showAlert('Data pemasok berhasil diperbarui!');
    } else {
      await masterService.createPemasok(form.value);
      showAlert('Pemasok baru berhasil ditambahkan!');
    }
    modalOpen.value = false;
    fetchData();
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan data pemasok.', false);
  }
};

const deleteItem = async (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus pemasok ini?')) {
    try {
      await masterService.deletePemasok(id);
      showAlert('Pemasok berhasil dihapus.');
      fetchData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus pemasok.', false);
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

