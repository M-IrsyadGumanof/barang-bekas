<template>
  <div class="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-8">
    <div class="max-w-4xl mx-auto w-full space-y-6">
      <!-- Header Banner Setup -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              KAG
            </div>
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Setup Proyek Siap
              </span>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Sistem Informasi Usaha Pengepul Barang Bekas
              </h1>
              <p class="text-xs text-slate-500 mt-0.5">
                Mitra: K.A.G (Gudang Barang Bekas) &bull; Pengembang: Muhammad Irsyad Gumanof (2411082031)
              </p>
            </div>
          </div>

          <button 
            @click="checkBackendHealth" 
            :disabled="checking"
            class="self-start sm:self-auto text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="checking ? 'animate-spin' : ''" />
            Cek Status Koneksi
          </button>
        </div>

        <!-- Status Card Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <!-- Status Frontend -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 uppercase">Frontend</span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-2">Vue.js 3 + Vite + Tailwind</h3>
              <p class="text-[11px] text-slate-500 mt-1">Pinia, Vue Router 4, Axios & Lucide Icons terpasang.</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-mono text-emerald-700 font-semibold">
              Status: Berjalan (Port 3000)
            </div>
          </div>

          <!-- Status Backend -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 uppercase">Backend API</span>
                <span 
                  class="w-2.5 h-2.5 rounded-full"
                  :class="backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"
                ></span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-2">Node.js + Express.js</h3>
              <p class="text-[11px] text-slate-500 mt-1">REST API endpoint modular dengan JWT Auth & Middleware.</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-mono">
              <span v-if="backendOnline" class="text-emerald-700 font-semibold">Status: Online (Port 5000)</span>
              <span v-else class="text-amber-700 font-semibold">Status: Menunggu `npm run dev`</span>
            </div>
          </div>

          <!-- Status Database -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 uppercase">Database</span>
                <span 
                  class="w-2.5 h-2.5 rounded-full"
                  :class="databaseConnected ? 'bg-emerald-500' : 'bg-slate-400'"
                ></span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-2">MySQL Relasional</h3>
              <p class="text-[11px] text-slate-500 mt-1">Skema 11 tabel inti & seeder siap dieksekusi.</p>
            </div>
            <div class="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-mono">
              <span v-if="databaseConnected" class="text-emerald-700 font-semibold">Status: Terhubung (db_pengepul)</span>
              <span v-else class="text-slate-500">Skrip: `backend/database/schema.sql`</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Struktur Folder Sesuai Laporan Bab 6.4 -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <FolderTree class="w-4 h-4 text-emerald-600" />
          Struktur Folder Proyek Sesuai Dokumen Laporan (SRS Bab 6.4)
        </h2>
        <p class="text-xs text-slate-500">
          Folder dan modul telah dikelompokkan dengan rapi, siap untuk Anda implementasikan dengan desain antarmuka yang telah disusun:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <!-- Kolom Frontend -->
          <div class="bg-slate-900 text-slate-300 p-4 rounded-xl space-y-1">
            <span class="text-emerald-400 font-bold block mb-2 font-sans text-xs">📂 frontend/ (Vue.js 3 + Vite)</span>
            <p>├── src/</p>
            <p>│   ├── assets/       <span class="text-slate-500 font-sans"># Style CSS & Tailwind</span></p>
            <p>│   ├── components/   <span class="text-slate-500 font-sans"># Komponen UI</span></p>
            <p>│   ├── views/        <span class="text-slate-500 font-sans"># Wadah halaman desain Anda</span></p>
            <p>│   ├── router/       <span class="text-slate-500 font-sans"># Konfigurasi navigasi rute</span></p>
            <p>│   ├── stores/       <span class="text-slate-500 font-sans"># State management (Pinia)</span></p>
            <p>│   ├── services/     <span class="text-slate-500 font-sans"># Axios HTTP Client</span></p>
            <p>│   ├── App.vue</p>
            <p>│   └── main.js</p>
            <p>├── tailwind.config.js</p>
            <p>└── package.json</p>
          </div>

          <!-- Kolom Backend -->
          <div class="bg-slate-900 text-slate-300 p-4 rounded-xl space-y-1">
            <span class="text-blue-400 font-bold block mb-2 font-sans text-xs">📂 backend/ (Node.js + Express)</span>
            <p>├── config/          <span class="text-slate-500 font-sans"># Koneksi pool MySQL</span></p>
            <p>├── controllers/     <span class="text-slate-500 font-sans"># Logika bisnis REST API</span></p>
            <p>├── database/        <span class="text-slate-500 font-sans"># schema.sql & initDb.js</span></p>
            <p>├── middleware/      <span class="text-slate-500 font-sans"># JWT & Auth role guard</span></p>
            <p>├── routes/          <span class="text-slate-500 font-sans"># Endpoint REST API</span></p>
            <p>├── services/        <span class="text-slate-500 font-sans"># Layanan pendukung</span></p>
            <p>├── server.js        <span class="text-slate-500 font-sans"># Server entrypoint (Port 5000)</span></p>
            <p>├── .env             <span class="text-slate-500 font-sans"># Konfigurasi env</span></p>
            <p>└── package.json</p>
          </div>
        </div>
      </div>

      <!-- Petunjuk Singkat Menjalankan Server -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-3 text-xs">
        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Terminal class="w-4 h-4 text-slate-600" />
          Cara Menjalankan Server di Terminal
        </h3>
        <ol class="list-decimal list-inside space-y-1 text-slate-600">
          <li>
            <b>Jalankan Backend:</b> Buka terminal di folder <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-800">backend/</code> lalu ketik:
            <code class="bg-slate-800 text-white px-2 py-0.5 rounded ml-1 font-mono">npm run dev</code>
          </li>
          <li>
            <b>Jalankan Frontend:</b> Buka terminal di folder <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-800">frontend/</code> lalu ketik:
            <code class="bg-slate-800 text-white px-2 py-0.5 rounded ml-1 font-mono">npm run dev</code>
          </li>
          <li>
            <b>Inisialisasi Database (bila MySQL sudah aktif):</b> Ketik <code class="bg-slate-800 text-white px-2 py-0.5 rounded font-mono">npm run db:init</code> di folder backend.
          </li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-400 py-4 max-w-4xl mx-auto w-full">
      Sistem Informasi Pengelolaan Usaha Pengepul Barang Bekas &copy; 2026 &bull; Politeknik Negeri Padang
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { RefreshCw, FolderTree, Terminal } from 'lucide-vue-next';

const checking = ref(false);
const backendOnline = ref(false);
const databaseConnected = ref(false);

const checkBackendHealth = async () => {
  checking.value = true;
  try {
    const res = await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
    backendOnline.value = res.data?.status === 'ok';
    databaseConnected.value = !!res.data?.database_connected;
  } catch (err) {
    backendOnline.value = false;
    databaseConnected.value = false;
  } finally {
    checking.value = false;
  }
};

onMounted(() => {
  checkBackendHealth();
});
</script>
