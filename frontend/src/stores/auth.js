import { defineStore } from 'pinia';
import { authService } from '../services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isPemilik: (state) => state.user?.role === 'Pemilik/Pengepul',
    isPemasok: (state) => state.user?.role === 'Pemasok',
    currentUser: (state) => state.user,
  },

  actions: {
    async login(username, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await authService.login(username, password);
        this.token = response.token;
        this.user = response.user;
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true };
      } catch (err) {
        this.error = err.response?.data?.message || 'Login gagal. Periksa username dan password Anda.';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    async fetchProfile() {
      if (!this.token) return;
      try {
        const res = await authService.getProfile();
        this.user = res.user;
        localStorage.setItem('user', JSON.stringify(res.user));
      } catch (err) {
        this.logout();
      }
    }
  },
});

