import { useEffect, useState } from 'react'
import { fetchDashboard, type DashboardData } from '../../services/api'

type DashboardPanelProps = {
  onAuthLost: () => void
}

const eventTypeLabel: Record<string, string> = {
  exam: 'Prova',
  assignment: 'Trabalho',
  other: 'Outro',
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DashboardPanel({ onAuthLost }: DashboardPanelProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchDashboard())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar o dashboard.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Carregando dashboard…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          Tentar de novo
        </button>
      </section>
    )
  }

  if (!data) return null

  const overdue = data.alerts.filter((a) => a.severity === 'overdue')
  const dueSoon = data.alerts.filter((a) => a.severity === 'due_soon')

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-brand)]">Dashboard</h2>
            <p className="text-sm text-slate-600">
              Resumo acadêmico · alertas dos próximos {data.alert_window_days} dias
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
          >
            Atualizar
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Stat label="Matérias ativas" value={data.subjects.active} />
          <Stat label="Tarefas abertas" value={data.tasks.open} />
          <Stat label="Concluídas" value={data.tasks.done} tone="success" />
          <Stat label="Alertas" value={data.alerts.length} tone={data.alerts.length ? 'danger' : undefined} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Alertas</h3>
        {data.alerts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nenhum prazo vencido ou próximo no momento.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...overdue, ...dueSoon].map((alert) => (
              <li
                key={alert.id}
                className={`rounded-xl border px-4 py-3 ${
                  alert.severity === 'overdue'
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      <span
                        className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          alert.severity === 'overdue'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {alert.severity === 'overdue' ? 'Vencido' : 'Em breve'}
                      </span>
                      {alert.subtitle} · {alert.title}
                    </p>
                    <p className="text-xs text-slate-600">
                      {alert.subject_name ?? 'Sem matéria'} · {formatWhen(alert.when)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Próximas provas e trabalhos
          </h3>
          {data.upcoming_events.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Nenhum evento futuro agendado.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.upcoming_events.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">
                    {eventTypeLabel[item.event_type] ?? item.event_type} · {item.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.subject_name ?? 'Sem matéria'} · {formatWhen(item.start_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Próximas tarefas
          </h3>
          {data.upcoming_tasks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Nenhuma tarefa com prazo futuro.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.upcoming_tasks.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.subject_name ?? 'Sem matéria'} · {item.due_at ? formatWhen(item.due_at) : '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Médias das matérias
        </h3>
        {data.grade_highlights.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Lance notas na aba Notas para ver o resumo aqui.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.grade_highlights.map((item) => (
              <li
                key={item.subject_id}
                className="rounded-xl border border-slate-200 px-4 py-3"
                style={{ borderLeftWidth: 4, borderLeftColor: item.subject_color || '#1E3A8A' }}
              >
                <p className="text-sm font-medium text-slate-900">{item.subject_name}</p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-brand)]">
                  {item.current_average}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    meta {item.passing_grade}
                  </span>
                </p>
                <p
                  className={`text-xs ${
                    item.already_passing ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                  }`}
                >
                  {item.already_passing ? 'Na média' : 'Abaixo da aprovação'}
                  {item.needed_on_remaining
                    ? ` · precisa ${item.needed_on_remaining} no restante`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'success' | 'danger'
}) {
  const valueClass =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'danger'
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--color-brand)]'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}
