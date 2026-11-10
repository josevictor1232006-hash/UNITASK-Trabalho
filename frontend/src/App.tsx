import { useCallback, useEffect, useState } from 'react'
import { Logo } from './components/Logo'
import { AuthPanel } from './features/auth/AuthPanel'
import { CalendarPanel } from './features/calendar/CalendarPanel'
import { DashboardPanel } from './features/dashboard/DashboardPanel'
import { EventsPanel } from './features/events/EventsPanel'
import { GradesPanel } from './features/grades/GradesPanel'
import { SubjectsPanel } from './features/subjects/SubjectsPanel'
import { TasksPanel } from './features/tasks/TasksPanel'
import {
  API_BASE_URL,
  checkApiHealth,
  clearTokens,
  fetchMe,
  getAccessToken,
  type UserProfile,
} from './services/api'

type HealthState = 'loading' | 'ok' | 'error'
type Tab = 'dashboard' | 'subjects' | 'events' | 'tasks' | 'calendar' | 'grades'

const TABS: Array<[Tab, string]> = [
  ['dashboard', 'Dashboard'],
  ['subjects', 'Matérias'],
  ['events', 'Provas'],
  ['tasks', 'Tarefas'],
  ['calendar', 'Calendário'],
  ['grades', 'Notas'],
]

function App() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [health, setHealth] = useState<HealthState>('loading')
  const [tab, setTab] = useState<Tab>('dashboard')

  const handleAuthLost = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const loadSession = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setSessionLoading(false)
      return
    }

    try {
      const profile = await fetchMe()
      setUser(profile)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setSessionLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useEffect(() => {
    if (!user) return

    let active = true
    checkApiHealth()
      .then(() => {
        if (active) setHealth('ok')
      })
      .catch(() => {
        if (active) setHealth('error')
      })

    return () => {
      active = false
    }
  }, [user])

  function handleLogout() {
    clearTokens()
    setUser(null)
  }

  if (sessionLoading) {
    return (
      <main className="ut-shell mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="ut-panel flex items-center gap-3 px-5 py-4">
          <Logo size="sm" withWordmark={false} />
          <p className="text-sm font-medium text-slate-600">Carregando sessão…</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="ut-shell mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="ut-hero p-8 sm:p-10">
          <Logo size="lg" variant="light" />
          <h1 className="mt-8 max-w-xl font-[family-name:var(--font-display)] text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Sua faculdade, organizada em um só lugar.
          </h1>
          <p className="mt-4 max-w-lg text-base text-indigo-100 sm:text-lg">
            Centralize matérias, provas, tarefas, calendário, notas e alertas — menos
            fragmentação, mais desempenho acadêmico.
          </p>
          <ul className="mt-8 grid gap-3 text-sm text-indigo-50 sm:grid-cols-2">
            {[
              'Dashboard com alertas de prazo',
              'Calendário de provas e trabalhos',
              'Cálculo de médias e nota necessária',
              'Tarefas e matérias em um só painel',
            ].map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="ut-panel p-6 sm:p-8">
          <p className="ut-chip bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            Acesso estudante
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-brand)]">
            Entre na sua conta
          </h2>
          <p className="mt-1 mb-6 text-sm text-slate-600">
            Continue de onde parou na rotina acadêmica.
          </p>
          <AuthPanel onAuthenticated={() => void loadSession()} />
        </section>
      </main>
    )
  }

  return (
    <main className="ut-shell mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <header className="ut-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <div className="hidden h-10 w-px bg-slate-200 sm:block" />
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-accent)] uppercase">
              Olá
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-brand)]">
              {user.name}
            </h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="ut-btn ut-btn-ghost">
          Sair
        </button>
      </header>

      <nav className="ut-nav" aria-label="Navegação principal">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`ut-nav-item ${tab === id ? 'is-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && <DashboardPanel onAuthLost={handleAuthLost} />}
      {tab === 'subjects' && <SubjectsPanel onAuthLost={handleAuthLost} />}
      {tab === 'events' && <EventsPanel onAuthLost={handleAuthLost} />}
      {tab === 'tasks' && <TasksPanel onAuthLost={handleAuthLost} />}
      {tab === 'calendar' && <CalendarPanel onAuthLost={handleAuthLost} />}
      {tab === 'grades' && <GradesPanel onAuthLost={handleAuthLost} />}

      <aside className="rounded-xl border border-dashed border-slate-300/80 bg-white/50 px-4 py-3 text-xs text-slate-500 backdrop-blur-sm">
        <p className="font-semibold text-slate-600">Status da API</p>
        {health === 'loading' && <p>Verificando…</p>}
        {health === 'ok' && (
          <p className="text-[var(--color-success)]">Conectada · {API_BASE_URL}</p>
        )}
        {health === 'error' && (
          <p className="text-[var(--color-danger)]">
            Indisponível. Em produção, aguarde o cold start do Render.
          </p>
        )}
      </aside>
    </main>
  )
}

export default App
