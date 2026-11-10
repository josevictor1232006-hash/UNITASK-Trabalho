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

export type Assessment = {
  id: number
  subject: number
  name: string
  score: string | null
  weight: string | null
  date: string | null
  created_at: string
}

export type AssessmentPayload = {
  subject: number
  name: string
  score?: string | number | null
  weight?: string | number | null
  date?: string | null
}

export type GradeSummary = {
  subject_id: number
  subject_name: string
  subject_color: string
  passing_grade: string
  max_score: string
  scored_count: number
  pending_count: number
  total_count: number
  current_average: string | null
  method: 'weighted' | 'simple' | null
  needed_on_remaining: string | null
  needed_feasible: boolean | null
  already_passing: boolean | null
  message: string | null
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
  from?: string
  to?: string
} = {}): Promise<AcademicEvent[]> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.subject) query.set('subject', String(params.subject))
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
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
  from?: string
  to?: string
} = {}): Promise<TaskItem[]> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.subject) query.set('subject', String(params.subject))
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
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

export async function listAssessments(params: {
  subject?: number | string
} = {}): Promise<Assessment[]> {
  const query = new URLSearchParams()
  if (params.subject) query.set('subject', String(params.subject))
  const suffix = query.toString() ? `?${query}` : ''
  const response = await authFetch(`/api/assessments/${suffix}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function createAssessment(payload: AssessmentPayload): Promise<Assessment> {
  const response = await authFetch('/api/assessments/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function updateAssessment(
  id: number,
  payload: Partial<AssessmentPayload>,
): Promise<Assessment> {
  const response = await authFetch(`/api/assessments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function deleteAssessment(id: number): Promise<void> {
  const response = await authFetch(`/api/assessments/${id}/`, { method: 'DELETE' })
  if (!response.ok) throw new Error(await parseError(response))
}

export async function fetchGradeSummary(subject?: number | string): Promise<GradeSummary | GradeSummary[]> {
  const query = subject ? `?subject=${subject}` : ''
  const response = await authFetch(`/api/grades/summary/${query}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export type DashboardAlert = {
  id: string
  kind: 'event' | 'task'
  ref_id: number
  severity: 'overdue' | 'due_soon'
  title: string
  subtitle: string
  when: string
  subject_id: number | null
  subject_name: string | null
}

export type DashboardData = {
  generated_at: string
  alert_window_days: number
  subjects: { active: number; archived: number }
  tasks: { pending: number; in_progress: number; done: number; open: number }
  upcoming_events: Array<{
    id: number
    title: string
    event_type: AcademicEvent['event_type']
    start_at: string
    due_at: string | null
    subject_id: number | null
    subject_name: string | null
  }>
  upcoming_tasks: Array<{
    id: number
    title: string
    status: TaskItem['status']
    priority: TaskItem['priority']
    due_at: string | null
    subject_id: number | null
    subject_name: string | null
  }>
  alerts: DashboardAlert[]
  grade_highlights: Array<{
    subject_id: number
    subject_name: string
    subject_color: string
    passing_grade: string
    current_average: string
    already_passing: boolean | null
    needed_on_remaining: string | null
    needed_feasible: boolean | null
  }>
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await authFetch('/api/dashboard/')
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export { API_BASE_URL }
