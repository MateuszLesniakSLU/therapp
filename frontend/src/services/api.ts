/**
 * Helper do nagłówków autoryzacyjnych.
 * Pobiera token JWT z localStorage i tworzy nagłówek 'Authorization'.
 * Każde zapytanie wymagające logowania musi zawierać te nagłówki.
 */
export function authHeaders() {
  const token = localStorage.getItem('token')

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}
