import { useCallback, useEffect, useState } from 'react'
import { AuthPanel } from './features/auth/AuthPanel'
import { SubjectsPanel } from './features/subjects/SubjectsPanel'
import {
  API_BASE_URL,
  checkApiHealth,
  clearTokens,
  fetchMe,
  getAccessToken,
  type UserProfile,
} from './services/api'

type HealthState = 'loading' | 'ok' | 'error'

function App() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [health, setHealth] = useState<HealthState>('loading')

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
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <p className="text-slate-600">Carregando sessão…</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
          UniTask
        </p>
        <h1 className="mb-4 text-4xl font-bold text-[var(--color-brand)] sm:text-5xl">
          Sua faculdade, organizada em um só lugar.
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-[var(--color-muted)]">
          Entre ou crie sua conta para gerenciar matérias e a rotina acadêmica.
        </p>
        <AuthPanel onAuthenticated={() => void loadSession()} />
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
            UniTask
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-brand)]">{user.name}</h1>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Sair
        </button>
      </header>

      <SubjectsPanel
        onAuthLost={() => {
          clearTokens()
          setUser(null)
        }}
      />

      <aside className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <p className="font-medium text-slate-600">Status interno da API</p>
        {health === 'loading' && <p>Verificando…</p>}
        {health === 'ok' && <p className="text-[var(--color-success)]">Conectada ({API_BASE_URL})</p>}
        {health === 'error' && (
          <p className="text-[var(--color-danger)]">
            Indisponível. Se estiver em produção, aguarde o cold start do Render.
          </p>
        )}
      </aside>
    </main>
  )
}

export default App
