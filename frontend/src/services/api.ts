const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
).replace(/\/$/, '')

const ACCESS_TOKEN_KEY = 'unitask_access'
const REFRESH_TOKEN_KEY = 'unitask_refresh'

export type UserProfile = {
  id: number
  name: string
  email: string
  created_at: string
}

type TokenPair = {
  access: string
  refresh: string
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data === 'string') return data
    if (data.detail) return String(data.detail)
    const firstKey = Object.keys(data)[0]
    if (firstKey) {
      const value = data[firstKey]
      return Array.isArray(value) ? String(value[0]) : String(value)
    }
  } catch {
    // ignore parse errors
  }
  return `Erro HTTP ${response.status}`
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function saveTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

export async function checkApiHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health/`)
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  return response.json()
}

export async function registerUser(payload: {
  name: string
  email: string
  password: string
  password_confirm: string
}): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function loginUser(payload: {
  email: string
  password: string
}): Promise<TokenPair> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  const tokens = (await response.json()) as TokenPair
  saveTokens(tokens)
  return tokens
}

export async function fetchMe(): Promise<UserProfile> {
  const token = getAccessToken()
  if (!token) throw new Error('Sessão não encontrada.')

  const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    if (response.status === 401) clearTokens()
    throw new Error(await parseError(response))
  }
  return response.json()
}

export { API_BASE_URL }
