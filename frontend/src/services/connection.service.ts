import { authFetch } from './api'
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

/**
 * Generuje kod połączenia (6-cyfrowy) dla pacjenta.
 * (POST /connections/generate-code)
 */
export async function generateCode() {
    const res = await authFetch(`${API_URL}/connections/generate-code`, {
        method: 'POST',
    })
    if (!res.ok) throw new Error('Nie udało się wygenerować kodu')
    return res.json()
}

/**
 * Wysyła prośbę o połączenie do pacjenta via kod.
 * (POST /connections/request)
 */
export async function requestConnection(code: string) {
    const res = await authFetch(`${API_URL}/connections/request`, {
        method: 'POST',
        body: JSON.stringify({ code }),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Nie udało się wysłać prośby')
    }
    return res.json()
}

/**
 * Pobiera listę połączeń dla zalogowanego użytkownika.
 * (GET /connections)
 */
export async function getMyConnections() {
    const res = await authFetch(`${API_URL}/connections`)
    if (!res.ok) throw new Error('Nie udało się pobrać połączeń')
    return res.json()
}

/**
 * Akceptuje prośbę o połączenie.
 * (PATCH /connections/:id/accept)
 */
export async function acceptConnection(id: number) {
    const res = await authFetch(`${API_URL}/connections/${id}/accept`, {
        method: 'PATCH',
    })
    if (!res.ok) throw new Error('Nie udało się zaakceptować')
    return res.json()
}

/**
 * Usuwa połączenie.
 * (DELETE /connections/:id)
 */
export async function deleteConnection(id: number) {
    const res = await authFetch(`${API_URL}/connections/${id}`, {
        method: 'DELETE',
    })
    if (!res.ok) throw new Error('Nie udało się usunąć połączenia')
    return res.json()
}
