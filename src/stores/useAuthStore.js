import { create } from "zustand";
import { authService } from "@/services";

/**
 * Auth store — global auth state powered by Zustand.
 * Stateless API: reads from localStorage, syncs on login/logout.
 */
const useAuthStore = create((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  /**
   * Set loading state.
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Login action.
   */
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || "فشل تسجيل الدخول. حاول مرة أخرى.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Register action.
   */
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register(data);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return result;
    } catch (error) {
      const message =
        error.response?.data?.message || "فشل إنشاء الحساب. حاول مرة أخرى.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Logout action.
   */
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, error: null });
  },

  /**
   * Clear error.
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
