import { authHeaders } from './api'
import { API_URL } from '../config'

export async function getMe() {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: authHeaders(),
  })

  if (!res.ok) throw new Error('Nie udało się pobrać danych użytkownika')
  return res.json()
}

export async function updateMe(data: {
  firstName: string
  lastName: string
  email: string
}) {
  const res = await fetch(`${API_URL}/users/me`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error('Nie udało się zapisać danych')
  return res.json()
}

export async function changeMyPassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const res = await fetch(`${API_URL}/users/me/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })

  if (!res.ok) throw new Error('Nie udało się zmienić hasła')
}
