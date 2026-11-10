import { useEffect, useState } from 'react'
import { checkApiHealth } from './services/api'

type HealthState = 'loading' | 'ok' | 'error'

function App() {
  const [health, setHealth] = useState<HealthState>('loading')

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

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
        UniTask
      </p>
      <h1 className="mb-4 text-4xl font-bold text-[var(--color-brand)] sm:text-5xl">
        Sua faculdade, organizada em um só lugar.
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-[var(--color-muted)]">
        Fundação do MVP pronta: frontend React + TypeScript e API Django com
        health check. Próximas fases: autenticação, matérias, tarefas e
        dashboard.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-slate-500">Status da API</p>
        {health === 'loading' && (
          <p className="text-slate-700">Verificando conexão…</p>
        )}
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
    </main>
  )
}

export default App
