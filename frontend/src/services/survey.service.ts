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
