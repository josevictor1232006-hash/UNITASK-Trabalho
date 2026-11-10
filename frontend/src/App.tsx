import { useCallback, useEffect, useState } from 'react'
import { AuthPanel } from './features/auth/AuthPanel'
import {
  checkApiHealth,
  clearTokens,
  fetchMe,
  getAccessToken,
  type UserProfile,
} from './services/api'

type HealthState = 'loading' | 'ok' | 'error'

function App() {
  const [health, setHealth] = useState<HealthState>('loading')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

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
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  function handleLogout() {
    clearTokens()
    setUser(null)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
        UniTask
      </p>
      <h1 className="mb-4 text-4xl font-bold text-[var(--color-brand)] sm:text-5xl">
        Sua faculdade, organizada em um só lugar.
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-[var(--color-muted)]">
        Fase 2: autenticação JWT ativa. Crie sua conta para começar a organizar a
        rotina acadêmica.
      </p>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-500">Status da API</p>
        {health === 'loading' && <p className="text-slate-700">Verificando conexão…</p>}
        {health === 'ok' && (
          <p className="font-medium text-[var(--color-success)]">
            API respondendo em /api/health/
          </p>
        )}
        {health === 'error' && (
          <p className="font-medium text-[var(--color-danger)]">
            API indisponível. Inicie o backend em localhost:8000.
          </p>
        )}
      </div>

      {sessionLoading ? (
        <p className="text-slate-600">Carregando sessão…</p>
      ) : user ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Logado como</p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--color-brand)]">
            {user.name}
          </h2>
          <p className="mt-1 text-slate-600">{user.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Sair
          </button>
        </section>
      ) : (
        <AuthPanel onAuthenticated={() => void loadSession()} />
      )}
    </main>
  )
}

export default App
