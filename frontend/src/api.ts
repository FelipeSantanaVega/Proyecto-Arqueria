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

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: mergedHeaders,
  })

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
