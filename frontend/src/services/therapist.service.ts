import { authHeaders } from './api'
import { API_URL } from '../config'

export interface PatientStats {
    patientId: number
    period: number
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

export async function getMyPatients() {
    const res = await fetch(`${API_URL}/surveys/my-patients`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się pobrać listy pacjentów')
    return res.json()
}

export async function getPatientStats(patientId: number, days = 30): Promise<PatientStats> {
    const res = await fetch(`${API_URL}/surveys/therapist/stats/${patientId}?days=${days}`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error('Nie udało się pobrać statystyk pacjenta')
    return res.json()
}
