<template>
  <div class="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-emerald-700 to-emerald-900 p-6 text-white text-center">
        <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center font-extrabold text-xl mx-auto mb-2 backdrop-blur-sm">
          KAG
        </div>
        <h2 class="text-xl font-bold">Masuk ke Sistem</h2>
        <p class="text-xs text-emerald-200 mt-1">Sistem Informasi Pengepul Barang Bekas</p>
      </div>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 text-red-500" />
          <span>{{ errorMessage }}</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Username atau Email</label>
          <div class="relative">
            <User class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              v-model="username" 
              type="text" 
              required
              placeholder="Masukkan username atau email" 
              class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Password</label>
          <div class="relative">
            <Lock class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'" 
              required
              placeholder="Masukkan password" 
              class="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button 
              type="button" 
              @click="showPassword = !showPassword"
              class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          <span>{{ loading ? 'Memproses...' : 'Masuk Sekarang' }}</span>
        </button>

        <!-- Demo Credentials Helper -->
        <div class="mt-4 pt-4 border-t border-slate-200">
          <p class="text-[11px] font-semibold text-slate-500 mb-2">Akun Demo (Klik untuk mengisi cepat):</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button 
              type="button" 
              @click="fillCredentials('admin', 'admin123')"
              class="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition"
            >
              <span class="font-bold text-slate-800 block text-[11px]">Pemilik / Admin</span>
              <span class="text-slate-500 text-[10px]">admin / admin123</span>
            </button>
            <button 
              type="button" 
              @click="fillCredentials('andi_pemasok', 'pemasok123')"
              class="p-2 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition"
            >
              <span class="font-bold text-slate-800 block text-[11px]">Pemasok</span>
              <span class="text-slate-500 text-[10px]">andi_pemasok / ...</span>
            </button>
          </div>
        </div>

        <div class="text-center pt-2">
          <router-link to="/" class="text-xs text-slate-500 hover:text-emerald-600 font-medium">
            &larr; Kembali ke Halaman Utama
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const fillCredentials = (u, p) => {
  username.value = u;
  password.value = p;
};

const handleSubmit = async () => {
  errorMessage.value = '';
  loading.value = true;
  try {
    const result = await authStore.login(username.value, password.value);
    if (result.success) {
      router.push('/dashboard');
    } else {
      errorMessage.value = result.message;
    }
  } catch (err) {
    errorMessage.value = 'Terjadi kesalahan jaringan atau server.';
  } finally {
    loading.value = false;
  }
};
</script>

