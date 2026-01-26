import { authFetch } from './api'
import { API_URL } from '../config'

/**
 * Pobieranie danych użytkownika.
 * (GET /users/me)
 */
export async function getMe() {
  const res = await authFetch(`${API_URL}/users/me`)
  if (!res.ok) throw new Error('Nie udało się pobrać danych użytkownika')
  return res.json()
}

/**
 * Aktualizacja danych użytkownika.
 * (PATCH /users/me)
 */
export async function updateMe(data: {
  firstName: string
  lastName: string
  email: string
}) {
  const res = await authFetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Nie udało się zapisać danych')
  return res.json()
}

/**
 * Zmiana hasła użytkownika.
 * (PATCH /users/me/password)
 */
export async function changeMyPassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const res = await authFetch(`${API_URL}/users/me/password`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Nie udało się zmienić hasła')
}
