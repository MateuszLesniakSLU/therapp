import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: (localStorage.getItem('theme') as ThemeMode) ?? 'light',
  }),

  getters: {
    isDark: (state): boolean => state.theme === 'dark',
  },

  actions: {
    setTheme(theme: ThemeMode) {
      this.theme = theme
      localStorage.setItem('theme', theme)
    },

    toggleTheme() {
      const nextTheme: ThemeMode = this.theme === 'light' ? 'dark' : 'light'
      this.setTheme(nextTheme)
    },
  },
})
