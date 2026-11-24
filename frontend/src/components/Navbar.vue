<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
    <div class="flex items-center gap-3">
      <button 
        @click="$emit('toggle-sidebar')" 
        class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
        aria-label="Toggle Menu"
      >
        <Menu class="w-5 h-5" />
      </button>

      <router-link to="/dashboard" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          KAG
        </div>
        <div>
          <span class="font-bold text-slate-800 text-sm sm:text-base tracking-tight">K.A.G Pengepul</span>
          <span class="hidden sm:inline-block text-xs text-slate-500 ml-2">Gudang Barang Bekas</span>
        </div>
      </router-link>
    </div>

    <!-- User Profile & Action -->
    <div class="flex items-center gap-3">
      <router-link 
        to="/" 
        target="_blank"
        class="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full font-medium transition"
      >
        <Globe class="w-3.5 h-3.5" />
        Halaman Publik
      </router-link>

      <div class="flex items-center gap-2 border-l border-slate-200 pl-3">
        <div class="text-right">
          <p class="text-xs font-semibold text-slate-800 leading-tight">
            {{ authStore.currentUser?.nama_pemasok || authStore.currentUser?.username }}
          </p>
          <span 
            class="text-[10px] px-1.5 py-0.5 rounded font-medium inline-block"
            :class="authStore.isPemilik ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'"
          >
            {{ authStore.currentUser?.role }}
          </span>
        </div>

        <button 
          @click="handleLogout" 
          title="Keluar dari akun"
          class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Menu, Globe, LogOut } from 'lucide-vue-next';

defineEmits(['toggle-sidebar']);

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
    authStore.logout();
    router.push('/login');
  }
};
</script>

