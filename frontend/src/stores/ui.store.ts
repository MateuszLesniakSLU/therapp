import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: (localStorage.getItem('theme') as ThemeMode) || 'light',
  }),

  getters: {
    isDark: (state): boolean => state.theme === 'dark',
  },

  actions: {
    setTheme(theme: ThemeMode) {
      if (!['light', 'dark'].includes(theme)) return
      this.theme = theme
      localStorage.setItem('theme', theme)
    },

    toggleTheme() {
      const next: ThemeMode = this.theme === 'light' ? 'dark' : 'light'
      this.setTheme(next)
    },

    init() {
      const stored = localStorage.getItem('theme') as ThemeMode
      if (stored) this.setTheme(stored)
    }
  },
})
