const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

type ApiOptions = RequestInit & { token?: string | null }

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const mergedHeaders = new Headers()
  mergedHeaders.set('Content-Type', 'application/json')
  if (headers) {
    Object.entries(headers as Record<string, string>).forEach(([k, v]) => mergedHeaders.set(k, v))
  }
  if (token) mergedHeaders.set('Authorization', `Bearer ${token}`)

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
