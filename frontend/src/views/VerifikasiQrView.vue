<template>
  <div class="min-h-screen bg-slate-100 flex flex-col justify-between">
    <header class="bg-white border-b border-slate-200 py-3 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
            KAG
          </div>
          <span class="font-bold text-slate-800 text-sm">Verifikasi Nota Transaksi</span>
        </router-link>
        <router-link to="/" class="text-xs text-slate-500 hover:text-emerald-600 font-medium">
          &larr; Kembali
        </router-link>
      </div>
    </header>

    <main class="max-w-xl mx-auto p-4 sm:p-6 w-full flex-1 flex flex-col justify-center">
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8">
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <QrCode class="w-6 h-6" />
          </div>
          <h2 class="text-lg font-bold text-slate-900">Verifikasi Bukti Transaksi Timbang</h2>
          <p class="text-xs text-slate-500 mt-1">
            Masukkan QR Token atau Nomor Transaksi untuk memverifikasi keaslian nota penimbangan.
          </p>
        </div>

        <form @submit.prevent="verify" class="flex gap-2 mb-6">
          <input 
            v-model="tokenInput"
            type="text" 
            placeholder="Contoh: TRX-BL-20261124-0001 atau token QR"
            required
            class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button 
            type="submit" 
            :disabled="loading"
            class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <Search class="w-4 h-4" />
            <span>Cek</span>
          </button>
        </form>

        <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {{ errorMsg }}
        </div>

        <!-- Detail Hasil Verifikasi -->
        <div v-if="transaksi" class="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-emerald-200">
            <div>
              <span class="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                TRANSAKSI RESMI TERVERIFIKASI
              </span>
              <h4 class="text-base font-extrabold text-slate-900 mt-1 font-mono">
                {{ transaksi.nomor_transaksi }}
              </h4>
            </div>
            <span class="text-xs font-semibold px-2 py-1 rounded bg-white text-slate-700 border border-slate-200">
              {{ transaksi.status_pembayaran }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <span class="text-slate-400 block text-[11px]">Tanggal:</span>
              <span class="font-medium">{{ new Date(transaksi.tanggal_transaksi).toLocaleString('id-ID') }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Pemasok:</span>
              <span class="font-medium">{{ transaksi.nama_pemasok }} ({{ transaksi.kode_pemasok }})</span>
            </div>
          </div>

          <!-- Rincian Item -->
          <div class="mt-3">
            <span class="text-xs font-bold text-slate-700 block mb-1.5">Rincian Barang Timbang:</span>
            <div class="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 text-xs">
              <div 
                v-for="(item, idx) in transaksi.items" 
                :key="idx" 
                class="p-2.5 flex items-center justify-between"
              >
                <div>
                  <span class="font-semibold text-slate-800">{{ item.nama_barang }}</span>
                  <span class="text-slate-400 block text-[10px]">{{ item.jumlah_berat }} {{ item.satuan }} x Rp {{ Number(item.harga_satuan).toLocaleString('id-ID') }}</span>
                </div>
                <span class="font-bold text-slate-900">
                  Rp {{ Number(item.subtotal).toLocaleString('id-ID') }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-emerald-200">
            <span class="text-sm font-bold text-slate-800">Total Pembayaran:</span>
            <span class="text-lg font-extrabold text-emerald-700">
              Rp {{ Number(transaksi.total_pembelian).toLocaleString('id-ID') }}
            </span>
          </div>
        </div>
      </div>
    </main>

    <footer class="text-center py-4 text-xs text-slate-400">
      K.A.G Gudang Barang Bekas &copy; 2026
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { transaksiService } from '../services/transaksiService';
import { QrCode, Search } from 'lucide-vue-next';

const route = useRoute();
const tokenInput = ref('');
const loading = ref(false);
const errorMsg = ref('');
const transaksi = ref(null);

const verify = async () => {
  if (!tokenInput.value) return;
  loading.value = true;
  errorMsg.value = '';
  transaksi.value = null;

  try {
    const res = await transaksiService.verifyQr(tokenInput.value.trim());
    transaksi.value = res.data.data;
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Transaksi tidak ditemukan atau kode tidak valid.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (route.params.token) {
    tokenInput.value = route.params.token;
    verify();
  }
});
</script>

