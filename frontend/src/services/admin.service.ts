import { authFetch } from './api'
import { API_URL } from '../config'

export interface User {
    id: number
    email: string
    role: 'patient' | 'therapist' | 'admin'
    isActive: boolean
    first_name?: string
    last_name?: string
    createdAt?: string
}

/**
 * Pobiera listę wszystkich użytkowników (GET /users)
 */
export async function getAllUsers(): Promise<User[]> {
    const res = await authFetch(`${API_URL}/users`)
    if (!res.ok) throw new Error('Nie udało się pobrać listy użytkowników')
    return res.json()
}

/**
 * Aktualizuje dane użytkownika (PATCH /users/:id)
 */
export async function updateUser(id: number, data: Partial<User>) {
    const res = await authFetch(`${API_URL}/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Nie udało się zaktualizować użytkownika')
    return res.json()
}

/**
 * Dezaktywuje użytkownika (DELETE /users/:id)
 */
export async function deactivateUser(id: number) {
    const res = await authFetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
    })
    if (!res.ok) throw new Error('Nie udało się dezaktywować użytkownika')
    return res.json()
}

/**
 * Reaktywuje użytkownika (PATCH /users/:id/restore)
 */
export async function activateUser(id: number) {
    const res = await authFetch(`${API_URL}/users/${id}/restore`, {
        method: 'PATCH',
    })
    if (!res.ok) throw new Error('Nie udało się aktywować użytkownika')
    return res.json()
}
