import { create } from "zustand";
import { STORAGE_KEYS } from "@/utils/constants";

/**
 * Reads the initial theme: stored preference > system preference > light.
 */
function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === "dark" || stored === "light") return stored;

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

/**
 * Applies the theme class to <html> so CSS variables swap.
 */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Apply on load (before React renders)
applyTheme(getInitialTheme());

const useThemeStore = create((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));

export default useThemeStore;
