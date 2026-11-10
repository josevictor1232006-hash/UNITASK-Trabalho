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

export type Subject = {
  id: number
  name: string
  code: string
  professor: string
  color: string
  passing_grade: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type SubjectPayload = {
  name: string
  code?: string
  professor?: string
  color?: string
  passing_grade?: string | number
  is_archived?: boolean
}

export type AcademicEvent = {
  id: number
  subject: number | null
  title: string
  description: string
  event_type: 'exam' | 'assignment' | 'other'
  start_at: string
  due_at: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

export type AcademicEventPayload = {
  subject?: number | null
  title: string
  description?: string
  event_type: AcademicEvent['event_type']
  start_at: string
  due_at?: string | null
  status?: AcademicEvent['status']
}

export type TaskItem = {
  id: number
  subject: number | null
  academic_event: number | null
  title: string
  description: string
  due_at: string | null
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export type TaskPayload = {
  subject?: number | null
  academic_event?: number | null
  title: string
  description?: string
  due_at?: string | null
  status?: TaskItem['status']
  priority?: TaskItem['priority']
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

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  if (!token) throw new Error('Sessão não encontrada.')

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (response.status === 401) clearTokens()
  return response
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
  const response = await authFetch('/api/auth/me/')
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function listSubjects(archived: 'false' | 'true' | 'all' = 'false'): Promise<Subject[]> {
  const response = await authFetch(`/api/subjects/?archived=${archived}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function createSubject(payload: SubjectPayload): Promise<Subject> {
  const response = await authFetch('/api/subjects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function updateSubject(id: number, payload: Partial<SubjectPayload>): Promise<Subject> {
  const response = await authFetch(`/api/subjects/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function deleteSubject(id: number): Promise<void> {
  const response = await authFetch(`/api/subjects/${id}/`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await parseError(response))
}

export async function listEvents(params: {
  status?: string
  subject?: number | string
} = {}): Promise<AcademicEvent[]> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.subject) query.set('subject', String(params.subject))
  const suffix = query.toString() ? `?${query}` : ''
  const response = await authFetch(`/api/events/${suffix}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function createEvent(payload: AcademicEventPayload): Promise<AcademicEvent> {
  const response = await authFetch('/api/events/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function updateEvent(
  id: number,
  payload: Partial<AcademicEventPayload>,
): Promise<AcademicEvent> {
  const response = await authFetch(`/api/events/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function deleteEvent(id: number): Promise<void> {
  const response = await authFetch(`/api/events/${id}/`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await parseError(response))
}

export async function listTasks(params: {
  status?: string
  subject?: number | string
} = {}): Promise<TaskItem[]> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.subject) query.set('subject', String(params.subject))
  const suffix = query.toString() ? `?${query}` : ''
  const response = await authFetch(`/api/tasks/${suffix}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function createTask(payload: TaskPayload): Promise<TaskItem> {
  const response = await authFetch('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function updateTask(
  id: number,
  payload: Partial<TaskPayload>,
): Promise<TaskItem> {
  const response = await authFetch(`/api/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function deleteTask(id: number): Promise<void> {
  const response = await authFetch(`/api/tasks/${id}/`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await parseError(response))
}

export { API_BASE_URL }
