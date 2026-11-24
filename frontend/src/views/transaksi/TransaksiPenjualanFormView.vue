<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Form Transaksi Penjualan ke Pabrik</h2>
        <p class="text-xs text-slate-500">Mencatat pengiriman & penjualan barang bekas yang telah terkumpul (FR-40, FR-42, FR-43)</p>
      </div>
      <router-link to="/penjualan" class="text-xs text-slate-500 hover:text-blue-600 font-semibold">
        &larr; Batal & Kembali
      </router-link>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
      <AlertCircle class="w-4 h-4 shrink-0 text-red-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="submitTransaksi" class="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
      <!-- 1. Pilih Pembeli / Pabrik -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Pilih Pembeli / Pabrik *</label>
          <select 
            v-model="form.id_pembeli" 
            required
            class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option disabled value="">-- Pilih Pabrik / Pembeli --</option>
            <option v-for="p in pembeliList" :key="p.id_pembeli" :value="p.id_pembeli">
              {{ p.nama_pembeli }} ({{ p.jenis_pembeli }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Status Pembayaran dari Pabrik *</label>
          <select 
            v-model="form.status_pembayaran" 
            required
            class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Lunas">Lunas (Tunai / Transfer Diterima)</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Belum Lunas">Belum Lunas (Tempo/Tagihan)</option>
          </select>
        </div>
      </div>

      <!-- 2. Multi-Item Penjualan Barang -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Barang Dikirim ke Pabrik
          </h3>
          <button 
            type="button" 
            @click="addItemRow"
            class="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            Tambah Baris Barang
          </button>
        </div>

        <div class="space-y-3">
          <div 
            v-for="(row, idx) in form.items" 
            :key="idx"
            class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <!-- Pilih Barang -->
            <div class="sm:col-span-5">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Barang *</label>
              <select 
                v-model="row.id_barang" 
                @change="onBarangChange(idx)"
                required
                class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option disabled value="">Pilih Jenis Barang...</option>
                <option v-for="b in barangList" :key="b.id_barang" :value="b.id_barang">
                  {{ b.nama_barang }} (Stok Tersedia: {{ b.stok_tersedia }} kg)
                </option>
              </select>
            </div>

            <!-- Berat kg -->
            <div class="sm:col-span-3">
              <div class="flex items-center justify-between mb-1">
                <label class="text-[11px] font-semibold text-slate-600">Berat Jual (kg) *</label>
                <span v-if="row.stok_max !== undefined" class="text-[10px] text-slate-400 font-mono">
                  Maks: {{ row.stok_max }} kg
                </span>
              </div>
              <input 
                v-model.number="row.jumlah_berat" 
                type="number" 
                step="0.01" 
                min="0.01" 
                :max="row.stok_max"
                required
                placeholder="cth: 300"
                class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Harga Jual per kg -->
            <div class="sm:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Harga Jual Satuan (Rp/kg)</label>
              <input 
                v-model.number="row.harga_jual_satuan" 
                type="number" 
                min="0"
                class="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <!-- Tombol Hapus Baris -->
            <div class="sm:col-span-1 flex justify-center pb-1">
              <button 
                type="button" 
                @click="removeItemRow(idx)"
                :disabled="form.items.length === 1"
                class="p-1.5 text-slate-400 hover:text-red-600 rounded disabled:opacity-30 transition"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <!-- Subtotal Baris -->
            <div class="sm:col-span-12 text-right pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span class="text-slate-400 font-mono">Subtotal Baris:</span>
              <span class="font-bold text-slate-800 font-mono">
                Rp {{ Number((row.jumlah_berat || 0) * (row.harga_jual_satuan || 0)).toLocaleString('id-ID') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Catatan -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Pengiriman</label>
        <textarea 
          v-model="form.catatan" 
          rows="2" 
          placeholder="No. Polisi Armada Truk, nama supir pengantar, nota timbang pabrik..."
          class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <!-- Ringkasan Total Penjualan (FR-41) -->
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span class="text-xs text-slate-500 block">Total Nilai Penjualan ke Pabrik:</span>
          <span class="text-2xl font-black text-blue-800 font-mono">
            Rp {{ Number(calculatedTotal).toLocaleString('id-ID') }}
          </span>
        </div>

        <button 
          type="submit" 
          :disabled="submitting"
          class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save class="w-4 h-4" />
          <span>{{ submitting ? 'Menyimpan...' : 'Simpan Penjualan & Kurangi Stok' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { transaksiService } from '@/services/transaksiService';
import { masterService } from '@/services/masterService';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-vue-next';

const router = useRouter();
const pembeliList = ref([]);
const barangList = ref([]);
const submitting = ref(false);
const errorMessage = ref('');

const form = ref({
  id_pembeli: '',
  status_pembayaran: 'Lunas',
  catatan: '',
  items: [
    { id_barang: '', jumlah_berat: null, harga_jual_satuan: 0, stok_max: 0 }
  ]
});

const calculatedTotal = computed(() => {
  return form.value.items.reduce((acc, row) => {
    const sub = (parseFloat(row.jumlah_berat) || 0) * (parseFloat(row.harga_jual_satuan) || 0);
    return acc + sub;
  }, 0);
});

const loadInitialData = async () => {
  try {
    const [pRes, bRes] = await Promise.all([
      masterService.getPembeli(),
      masterService.getBarang()
    ]);
    pembeliList.value = pRes.data.data;
    barangList.value = bRes.data.data.filter(b => b.status === 'Aktif');
  } catch (err) {
    console.error('Gagal memuat master data penjualan:', err);
  }
};

const onBarangChange = (idx) => {
  const selectedId = form.value.items[idx].id_barang;
  const barang = barangList.value.find(b => b.id_barang === selectedId);
  if (barang) {
    form.value.items[idx].harga_jual_satuan = parseFloat(barang.harga_jual) || 0;
    form.value.items[idx].stok_max = parseFloat(barang.stok_tersedia) || 0;
  }
};

const addItemRow = () => {
  form.value.items.push({ id_barang: '', jumlah_berat: null, harga_jual_satuan: 0, stok_max: 0 });
};

const removeItemRow = (idx) => {
  if (form.value.items.length > 1) {
    form.value.items.splice(idx, 1);
  }
};

const submitTransaksi = async () => {
  errorMessage.value = '';
  submitting.value = true;
  try {
    const res = await transaksiService.createPenjualan(form.value);
    alert('Transaksi penjualan berhasil disimpan! Stok berkurang.');
    router.push('/penjualan');
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Gagal menyimpan transaksi penjualan.';
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadInitialData();
});
</script>

