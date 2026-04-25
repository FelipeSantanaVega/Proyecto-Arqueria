const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://proyecto-arqueria.onrender.com'

type ApiOptions = RequestInit & { token?: string | null; skipAuthRefresh?: boolean }

const AUTH_EVENT = 'auth-token-changed'

function getPrimaryStorage() {
  return localStorage.getItem('remember_me') === '1' ? localStorage : sessionStorage
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token')
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem('refresh_token') ?? sessionStorage.getItem('refresh_token')
}

function emitAuthChange(accessToken: string | null, refreshToken: string | null) {
  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: {
        accessToken,
        refreshToken,
      },
    }),
  )
}

export function storeAuthTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
  const storage = rememberMe ? localStorage : sessionStorage
  const otherStorage = rememberMe ? sessionStorage : localStorage
  storage.setItem('token', accessToken)
  storage.setItem('refresh_token', refreshToken)
  localStorage.setItem('remember_me', rememberMe ? '1' : '0')
  otherStorage.removeItem('token')
  otherStorage.removeItem('refresh_token')
  emitAuthChange(accessToken, refreshToken)
}

export function updateStoredAccessToken(accessToken: string) {
  const storage = getPrimaryStorage()
  const refreshToken = getStoredRefreshToken()
  storage.setItem('token', accessToken)
  emitAuthChange(accessToken, refreshToken)
}

export function updateStoredTokens(accessToken: string, refreshToken: string) {
  const storage = getPrimaryStorage()
  storage.setItem('token', accessToken)
  storage.setItem('refresh_token', refreshToken)
  emitAuthChange(accessToken, refreshToken)
}

export function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('refresh_token')
  emitAuthChange(null, null)
}

export function getAuthEventName() {
  return AUTH_EVENT
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken()
    if (!refreshToken) return null
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) {
        clearStoredAuth()
        return null
      }
      const data = (await res.json()) as { access_token: string; refresh_token: string }
      updateStoredTokens(data.access_token, data.refresh_token)
      return data.access_token
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, skipAuthRefresh = false, ...rest } = options
  let authToken = token ?? getStoredToken()
  const mergedHeaders = new Headers()
  mergedHeaders.set('Content-Type', 'application/json')
  if (headers) {
    Object.entries(headers as Record<string, string>).forEach(([k, v]) => mergedHeaders.set(k, v))
  }
  if (authToken) mergedHeaders.set('Authorization', `Bearer ${authToken}`)

  const buildAlternateBase = (base: string): string | null => {
    try {
      const url = new URL(base)
      if (url.hostname === '127.0.0.1') {
        url.hostname = 'localhost'
        return url.toString().replace(/\/$/, '')
      }
      if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1'
        return url.toString().replace(/\/$/, '')
      }
      return null
    } catch {
      return null
    }
  }

  const alternateBase = buildAlternateBase(API_BASE)
  const candidateBases = [API_BASE, alternateBase].filter(Boolean) as string[]

  let res: Response | null = null
  let lastNetworkError: string | null = null

  for (const base of candidateBases) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        res = await fetch(`${base}${path}`, {
          ...rest,
          headers: mergedHeaders,
        })
        lastNetworkError = null
        break
      } catch (err) {
        lastNetworkError = err instanceof Error ? err.message : 'Error de red'
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 250))
          continue
        }
      }
    }
    if (res) break
  }
  if (!res) {
    throw new Error(`Error de red al llamar ${path}: ${lastNetworkError ?? 'Error de red'}`)
  }

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRefresh) {
      const nextAccessToken = await refreshAccessToken()
      if (nextAccessToken) {
        return apiFetch<T>(path, {
          ...options,
          token: nextAccessToken,
          skipAuthRefresh: true,
        })
      }
    }
    const detail = await res.text()
    throw new Error(detail || `Error ${res.status} al llamar ${path}`)
  }
  // Respuestas 204 o sin cuerpo no deben intentar parsear JSON
  if (res.status === 204) return null as T
  const text = await res.text()
  if (!text) return null as T
  return JSON.parse(text) as T
}

export { API_BASE }
