import { authHeaders } from './api'
import { API_URL } from '../config'

export interface Connection {
    id: number
    patientId: number
    therapistId: number
    status: 'PENDING' | 'ACTIVE'
    createdAt: string
    patient?: {
        id: number
        first_name: string
        last_name: string
        email: string
    }
    therapist?: {
        id: number
        first_name: string
        last_name: string
        email: string
    }
}

export async function generateCode() {
    const res = await fetch(`${API_URL}/connections/generate-code`, {
        method: 'POST',
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się wygenerować kodu')
    return res.json()
}

export async function requestConnection(code: string) {
    const res = await fetch(`${API_URL}/connections/request`, {
        method: 'POST',
        headers: {
            ...authHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Nie udało się wysłać prośby')
    }
    return res.json()
}

export async function getMyConnections() {
    const res = await fetch(`${API_URL}/connections`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się pobrać połączeń')
    return res.json()
}

export async function acceptConnection(id: number) {
    const res = await fetch(`${API_URL}/connections/${id}/accept`, {
        method: 'PATCH',
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się zaakceptować')
    return res.json()
}

export async function deleteConnection(id: number) {
    const res = await fetch(`${API_URL}/connections/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się usunąć połączenia')
    return res.json()
}
