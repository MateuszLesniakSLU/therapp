import { authHeaders } from "./api";
import { API_URL } from "../config";

const SURVEYS_URL = `${API_URL}/surveys`;

/**
 * Pobiera listę wszystkich aktywnych ankiet dostępnych dla pacjenta.
 * (GET /surveys)
 */
export async function getSurveys() {
  const response = await fetch(SURVEYS_URL, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Nie udało się pobrać ankiet.');
  return response.json();
}

/**
 * Pobiera szczegóły konkretnej ankiety (pytania, opcje).
 * (GET /surveys/:id)
 */
export async function getSurveyById(id: number) {
  const response = await fetch(`${SURVEYS_URL}/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Nie udało się pobrać ankiety.');
  return response.json();
}

/**
 * Sprawdza, które ankiety pacjent już wypełnił.
 * (GET /surveys/my/status)
 */
export async function getMySurveyStatus(): Promise<
  { surveyId: number; updatedAt: string }[]
> {
  const res = await fetch(
    `${SURVEYS_URL}/my/status`,
    { headers: authHeaders() },
  )
  return res.json()
}

/**
 * Wysyła wypełnioną ankietę do backendu.
 * (POST /surveys/today/response)
 */
export async function submitTodayResponse(data: {
  surveyId: number
  answers: {
    question_id: number
    answer_text?: string
    answer_value?: number
  }[]
  took_medication?: boolean
  wellbeing_rating?: number
}) {
  const res = await fetch(
    `${SURVEYS_URL}/today/response`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        survey_id: data.surveyId,
        answers: data.answers,
        took_medication: data.took_medication,
        wellbeing_rating: data.wellbeing_rating,
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Nie udało się zapisać ankiety')
  }
}

/**
 * Pobiera historię odpowiedzi pacjenta na daną ankietę (do podglądu).
 * (GET /surveys/my/response/:id)
 */
export async function getMyResponse(surveyId: number) {
  const res = await fetch(
    `${SURVEYS_URL}/my/response/${surveyId}`,
    { headers: authHeaders() },
  )
  if (!res.ok) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/**
 * Tworzy nową ankietę (dla terapeuty).
 * (POST /surveys)
 */
export async function createSurvey(data: {
  title: string
  description?: string
  questions: any[]
  patientIds?: number[]
}) {
  const res = await fetch(SURVEYS_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Nie udało się utworzyć ankiety')
  }
  return res.json()
}

/**
 * Pobiera szczegóły ankiety dla terapeuty (statystyki + przypisani pacjenci).
 * (GET /surveys/:id/details)
 */
export async function getSurveyDetails(id: number) {
  const res = await fetch(`${SURVEYS_URL}/${id}/details`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Nie udało się pobrać szczegółów ankiety')
  return res.json()
}

/**
 * Aktualizuje przypisania ankiety (PUT /surveys/:id/assignments)
 */
export async function updateSurveyAssignments(surveyId: number, patientIds: number[]) {
  const res = await fetch(`${SURVEYS_URL}/${surveyId}/assignments`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ patientIds }),
  })
  if (!res.ok) throw new Error('Nie udało się zaktualizować przypisań')
  return res.json()
}

/**
 * Usuwa ankietę (DELETE /surveys/:id)
 */
export async function deleteSurvey(id: number) {
  const res = await fetch(`${SURVEYS_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Nie udało się usunąć ankiety')
  return res.json()
}

/**
 * Pobiera wszystkie ankiety (dla terapeuty, w tym nieaktywne).
 * (GET /surveys/all)
 */
export async function getAllSurveys() {
  const res = await fetch(`${SURVEYS_URL}/all`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Nie udało się pobrać ankiet')
  return res.json()
}

/**
 * Ustawia status ankiety (PATCH /surveys/:id/status)
 */
export async function setSurveyStatus(id: number, active: boolean) {
  const res = await fetch(`${SURVEYS_URL}/${id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active }),
  })
  if (!res.ok) throw new Error('Nie udało się zmienić statusu ankiety')
  return res.json()
}
