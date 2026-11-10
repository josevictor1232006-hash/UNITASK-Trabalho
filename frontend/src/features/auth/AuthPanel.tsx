import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginUser, registerUser } from '../../services/api'

type Mode = 'login' | 'register'

type AuthPanelProps = {
  onAuthenticated: () => void
}

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        await registerUser({
          name,
          email,
          password,
          password_confirm: passwordConfirm,
        })
      }

      await loginUser({ email, password })
      onAuthenticated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            mode === 'login'
              ? 'bg-[var(--color-brand)] text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
          onClick={() => setMode('login')}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            mode === 'register'
              ? 'bg-[var(--color-brand)] text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
          onClick={() => setMode('register')}
        >
          Criar conta
        </button>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label className="block text-left text-sm">
            <span className="mb-1 block text-slate-600">Nome</span>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}

        <label className="block text-left text-sm">
          <span className="mb-1 block text-slate-600">E-mail</span>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-left text-sm">
          <span className="mb-1 block text-slate-600">Senha</span>
          <input
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        {mode === 'register' && (
          <label className="block text-left text-sm">
            <span className="mb-1 block text-slate-600">Confirmar senha</span>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>
        )}

        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar e entrar'}
        </button>
      </form>
    </section>
  )
}
