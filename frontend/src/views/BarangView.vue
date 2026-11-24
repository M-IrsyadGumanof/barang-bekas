<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Data Barang Bekas</h2>
        <p class="text-xs text-slate-500">Kelola master barang bekas yang diperjualbelikan (kardus, botol, besi, dll)</p>
      </div>
      <button 
        @click="openCreateModal"
        class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start"
      >
        <PackagePlus class="w-4 h-4" />
        Tambah Barang Baru
      </button>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3 flex-1">
        <div class="relative max-w-sm flex-1">
          <Search class="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            v-model="search" 
            @input="fetchData"
            type="text" 
            placeholder="Cari nama barang atau kode..." 
            class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select 
          v-model="selectedKategori" 
          @change="fetchData"
          class="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
        >
          <option value="">Semua Kategori</option>
          <option v-for="kat in kategoriOptions" :key="kat.id_kategori" :value="kat.id_kategori">
            {{ kat.nama_kategori }}
          </option>
        </select>
      </div>

      <span class="text-xs text-slate-400 font-medium">Total: {{ barangList.length }} Barang</span>
    </div>

    <!-- Alert -->
    <div v-if="alertMessage" class="p-3 rounded-lg text-xs" :class="alertSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'">
      {{ alertMessage }}
    </div>

    <!-- Tabel Data Barang -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="py-3 px-4">Kode</th>
              <th class="py-3 px-4">Nama Barang</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">Satuan</th>
              <th class="py-3 px-4">Harga Beli Aktif</th>
              <th class="py-3 px-4">Harga Jual Aktif</th>
              <th class="py-3 px-4">Stok Saat Ini</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in barangList" :key="item.id_barang" class="hover:bg-slate-50">
              <td class="py-3 px-4 font-mono font-medium text-emerald-700">{{ item.kode_barang }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ item.nama_barang }}</td>
              <td class="py-3 px-4 text-slate-600">{{ item.nama_kategori }}</td>
              <td class="py-3 px-4 text-slate-500 font-mono">{{ item.satuan }}</td>
              <td class="py-3 px-4 font-medium text-slate-700">Rp {{ Number(item.harga_beli).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4 font-semibold text-emerald-600">Rp {{ Number(item.harga_jual).toLocaleString('id-ID') }}</td>
              <td class="py-3 px-4">
                <span class="font-bold px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800">
                  {{ item.stok_tersedia }} {{ item.satuan }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span 
                  class="text-[10px] font-semibold px-2 py-0.5 rounded"
                  :class="item.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'"
                >
                  {{ item.status }}
                </span>
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
                    @click="deleteItem(item.id_barang)" 
                    class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Hapus"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="barangList.length === 0">
              <td colspan="9" class="py-8 text-center text-slate-400">Tidak ada data barang ditemukan.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form Tambah / Edit -->
    <Modal 
      :is-open="modalOpen" 
      :title="isEdit ? 'Ubah Data Barang' : 'Tambah Barang Baru'" 
      size="md"
      @close="modalOpen = false"
    >
      <form @submit.prevent="saveBarang" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nama Barang *</label>
          <input 
            v-model="form.nama_barang" 
            type="text" 
            required 
            placeholder="Contoh: Kardus Bekas Box"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Kategori *</label>
            <select 
              v-model="form.id_kategori" 
              required 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option disabled value="">Pilih Kategori</option>
              <option v-for="kat in kategoriOptions" :key="kat.id_kategori" :value="kat.id_kategori">
                {{ kat.nama_kategori }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Satuan</label>
            <input 
              v-model="form.satuan" 
              type="text" 
              required 
              placeholder="kg"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- Harga Master Awal (Hanya saat tambah baru) -->
        <div v-if="!isEdit" class="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Harga Beli Awal (Rp/kg)</label>
            <input 
              v-model.number="form.harga_beli" 
              type="number" 
              min="0"
              placeholder="cth: 2000"
              class="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs"
            />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Harga Jual Pabrik (Rp/kg)</label>
            <input 
              v-model.number="form.harga_jual" 
              type="number" 
              min="0"
              placeholder="cth: 2800"
              class="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs"
            />
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Deskripsi & Syarat Kondisi</label>
          <textarea 
            v-model="form.deskripsi" 
            rows="2" 
            placeholder="Kardus tebal bebas air, botol bersih tanpa tutup, dsb..."
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          ></textarea>
        </div>

        <div v-if="isEdit">
          <label class="block font-semibold text-slate-700 mb-1">Status Barang</label>
          <select v-model="form.status" class="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
            <option value="Aktif">Aktif (Dapat ditransaksikan)</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
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
            {{ isEdit ? 'Simpan Perubahan' : 'Tambah Barang' }}
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
import { PackagePlus, Search, Edit2, Trash2 } from 'lucide-vue-next';

const barangList = ref([]);
const kategoriOptions = ref([]);
const search = ref('');
const selectedKategori = ref('');

const modalOpen = ref(false);
const isEdit = ref(false);
const editId = ref(null);

const alertMessage = ref('');
const alertSuccess = ref(true);

const form = ref({
  nama_barang: '',
  id_kategori: '',
  satuan: 'kg',
  deskripsi: '',
  status: 'Aktif',
  harga_beli: 0,
  harga_jual: 0
});

const showAlert = (msg, success = true) => {
  alertMessage.value = msg;
  alertSuccess.value = success;
  setTimeout(() => { alertMessage.value = ''; }, 4000);
};

const fetchData = async () => {
  try {
    const res = await masterService.getBarang({
      q: search.value,
      kategori: selectedKategori.value
    });
    barangList.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat barang:', err);
  }
};

const loadKategori = async () => {
  try {
    const res = await masterService.getKategori();
    kategoriOptions.value = res.data.data;
  } catch (err) {
    console.error('Gagal memuat kategori:', err);
  }
};

const openCreateModal = () => {
  isEdit.value = false;
  editId.value = null;
  form.value = {
    nama_barang: '',
    id_kategori: kategoriOptions.value[0]?.id_kategori || '',
    satuan: 'kg',
    deskripsi: '',
    status: 'Aktif',
    harga_beli: 0,
    harga_jual: 0
  };
  modalOpen.value = true;
};

const openEditModal = (item) => {
  isEdit.value = true;
  editId.value = item.id_barang;
  form.value = {
    nama_barang: item.nama_barang,
    id_kategori: item.id_kategori,
    satuan: item.satuan,
    deskripsi: item.deskripsi || '',
    status: item.status
  };
  modalOpen.value = true;
};

const saveBarang = async () => {
  try {
    if (isEdit.value) {
      await masterService.updateBarang(editId.value, form.value);
      showAlert('Data barang berhasil diperbarui!');
    } else {
      await masterService.createBarang(form.value);
      showAlert('Barang baru berhasil ditambahkan!');
    }
    modalOpen.value = false;
    fetchData();
  } catch (err) {
    showAlert(err.response?.data?.message || 'Gagal menyimpan barang.', false);
  }
};

const deleteItem = async (id) => {
  if (confirm('Hapus barang ini?')) {
    try {
      await masterService.deleteBarang(id);
      showAlert('Barang berhasil dihapus.');
      fetchData();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Gagal menghapus barang.', false);
    }
  }
};

onMounted(() => {
  loadKategori();
  fetchData();
});
</script>

