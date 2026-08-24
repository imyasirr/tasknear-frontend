const TOKEN_KEY = 'tasknear_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`/api/v1${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errors = data.errors as Record<string, string[] | string> | undefined
    const fieldMessage = errors
      ? Object.values(errors).flatMap((v) => (Array.isArray(v) ? v : [v])).join(' ')
      : ''
    const message = fieldMessage || data.message || 'Request failed'
    throw new Error(typeof message === 'string' ? message : 'Request failed')
  }
  return data as T
}

export async function apiForm<T>(path: string, form: FormData, method = 'POST'): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`/api/v1${path}`, { method, headers, body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.message || 'Request failed'
    throw new Error(typeof message === 'string' ? message : 'Request failed')
  }
  return data as T
}
