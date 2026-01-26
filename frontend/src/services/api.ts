/**
 * Moduł API - zarządzanie autoryzacją i zapytaniami HTTP.
 */

/** Dekoduje payload JWT (bez weryfikacji podpisu) */
export function decodeToken(token: string): { exp?: number; sub?: number; role?: string } | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/** Sprawdza czy token JWT jest przeterminowany */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  const decoded = decodeToken(token)
  if (!decoded?.exp) return true

  const now = Math.floor(Date.now() / 1000)
  return decoded.exp < now
}

/** Czyści dane autoryzacyjne i przekierowuje na landing page */
export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  window.location.href = '/'
}

/** Sprawdza ważność tokenu i czyści jeśli wygasł */
export function checkTokenValidity(): boolean {
  const token = localStorage.getItem('token')
  if (isTokenExpired(token)) {
    clearAuth()
    return false
  }
  return true
}

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

/**
 * Wrapper fetch z automatyczną obsługą błędów autoryzacji.
 * Przy błędzie 401 (Unauthorized) czyści token i przekierowuje na landing page.
 */
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token')

  if (isTokenExpired(token)) {
    clearAuth()
    throw new Error('Sesja wygasła')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options?.headers,
    },
  })

  if (response.status === 401) {
    clearAuth()
    throw new Error('Sesja wygasła')
  }

  return response
}
