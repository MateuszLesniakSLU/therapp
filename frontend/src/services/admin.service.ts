import { authHeaders } from './api'
import { API_URL } from '../config'

export interface User {
    id: number
    username: string
    role: 'patient' | 'therapist' | 'admin'
    isActive: boolean
    first_name?: string
    last_name?: string
    email?: string
}

export async function getAllUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/users`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się pobrać listy użytkowników')
    return res.json()
}

export async function updateUser(id: number, data: Partial<User>) {
    const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Nie udało się zaktualizować użytkownika')
    return res.json()
}

export async function deactivateUser(id: number) {
    const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się dezaktywować użytkownika')
    return res.json()
}

export async function activateUser(id: number) {
    const res = await fetch(`${API_URL}/users/${id}/restore`, {
        method: 'PATCH',
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się aktywować użytkownika')
    return res.json()
}
