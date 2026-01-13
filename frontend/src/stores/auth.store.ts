import { defineStore } from 'pinia'
import { API_URL } from '../config'

interface LoginResponse {
  access_token: string
  role: 'patient' | 'therapist' | 'admin'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null,
    role: localStorage.getItem('role') as LoginResponse['role'] | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(username: string, password: string) {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        throw new Error('Nieprawidłowy login lub hasło')
      }

      const data: LoginResponse = await res.json()

      this.token = data.access_token
      this.role = data.role

      localStorage.setItem('token', this.token)
      localStorage.setItem('role', this.role)
    },

    logout() {
      this.token = null
      this.role = null
      localStorage.clear()
    },
  },
})
