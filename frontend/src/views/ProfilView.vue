<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h2 class="text-xl font-bold text-slate-900">Profil Pengguna</h2>
      <p class="text-xs text-slate-500">Informasi akun dan hak akses sistem</p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
      <div class="flex items-center gap-4 pb-4 border-b border-slate-100">
        <div class="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
          {{ authStore.currentUser?.username?.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">
            {{ authStore.currentUser?.nama_pemasok || authStore.currentUser?.username }}
          </h3>
          <span class="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 mt-1">
            {{ authStore.currentUser?.role }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-slate-400 block text-[11px]">Username</span>
          <span class="font-semibold text-slate-800">{{ authStore.currentUser?.username }}</span>
        </div>
        <div>
          <span class="text-slate-400 block text-[11px]">Email</span>
          <span class="font-semibold text-slate-800">{{ authStore.currentUser?.email || '-' }}</span>
        </div>
        <div v-if="authStore.currentUser?.kode_pemasok">
          <span class="text-slate-400 block text-[11px]">Kode Pemasok</span>
          <span class="font-mono font-bold text-emerald-700">{{ authStore.currentUser?.kode_pemasok }}</span>
        </div>
        <div v-if="authStore.currentUser?.nomor_telepon">
          <span class="text-slate-400 block text-[11px]">Nomor Telepon</span>
          <span class="font-semibold text-slate-800">{{ authStore.currentUser?.nomor_telepon }}</span>
        </div>
      </div>

      <div v-if="authStore.currentUser?.alamat" class="pt-2">
        <span class="text-slate-400 block text-[11px]">Alamat</span>
        <p class="text-slate-700 mt-0.5">{{ authStore.currentUser?.alamat }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>

