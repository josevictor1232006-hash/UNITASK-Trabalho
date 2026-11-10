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
    <div>
      <div className="mb-5 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === 'login'
              ? 'bg-white text-[var(--color-brand)] shadow-sm'
              : 'text-slate-600'
          }`}
          onClick={() => setMode('login')}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === 'register'
              ? 'bg-white text-[var(--color-brand)] shadow-sm'
              : 'text-slate-600'
          }`}
          onClick={() => setMode('register')}
        >
          Criar conta
        </button>
      </div>

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label className="block text-left text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Nome</span>
            <input
              className="ut-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}

        <label className="block text-left text-sm">
          <span className="mb-1.5 block font-medium text-slate-600">E-mail</span>
          <input
            type="email"
            className="ut-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-left text-sm">
          <span className="mb-1.5 block font-medium text-slate-600">Senha</span>
          <input
            type="password"
            className="ut-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        {mode === 'register' && (
          <label className="block text-left text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Confirmar senha</span>
            <input
              type="password"
              className="ut-input"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="ut-btn ut-btn-primary w-full py-3">
          {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar no UniTask' : 'Cadastrar e entrar'}
        </button>
      </form>
    </div>
  )
}
