import { defineStore } from 'pinia'
import { API_URL } from '../config'
import { authHeaders } from '../services/api'

interface User {
  id: number
  email: string
  role: 'patient' | 'therapist' | 'admin'
  first_name?: string
  last_name?: string
}

interface LoginResponse {
  access_token: string
  role: 'patient' | 'therapist' | 'admin'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') as string | null,
    role: localStorage.getItem('role') as LoginResponse['role'] | null,
    user: null as User | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(email: string, password: string) {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Nieprawidłowy email lub hasło')
      }

      const data: LoginResponse = await res.json()

      this.token = data.access_token
      this.role = data.role

      localStorage.setItem('token', this.token)
      localStorage.setItem('role', this.role)

      await this.fetchUser()
    },

    async register(email: string, password: string, firstName: string, lastName: string) {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Błąd rejestracji')
      }

      return res.json()
    },

    async forgotPassword(email: string) {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Błąd wysyłania emaila')
      }

      return res.json()
    },

    async resetPassword(token: string, password: string) {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Błąd resetowania hasła')
      }

      return res.json()
    },

    async fetchUser() {
      if (!this.token) return
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: authHeaders()
        })
        if (res.ok) {
          this.user = await res.json()
        }
      } catch (error) {
        console.error('Failed to fetch user profile', error)
      }
    },

    logout() {
      this.token = null
      this.role = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      window.location.href = '/'
    },
  },
})
