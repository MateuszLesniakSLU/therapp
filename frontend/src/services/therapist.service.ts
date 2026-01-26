import { authHeaders } from './api'
import { API_URL } from '../config'

/**
 * Statystyki pacjenta.
 */
export interface PatientStats {
    patientId: number
    period: number
    assignedSurveysCount: number
    total: number
    avgWellbeing: number
    missingDates: string[]
    responses: {
        surveyId: number
        date: string
        wellbeing: number
        medication: boolean
    }[]
}

/**
 * Pobieranie listy pacjentów.
 * (GET /surveys/my-patients)
 */
export async function getMyPatients() {
    const res = await fetch(`${API_URL}/surveys/my-patients`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się pobrać listy pacjentów')
    return res.json()
}

/**
 * Pobieranie statystyk pacjenta.
 * (GET /surveys/therapist/stats/{patientId}?days={days})
 */
export async function getPatientStats(patientId: number, days = 30): Promise<PatientStats> {
    const res = await fetch(`${API_URL}/surveys/therapist/stats/${patientId}?days=${days}`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się pobrać statystyk pacjenta')
    return res.json()
}
