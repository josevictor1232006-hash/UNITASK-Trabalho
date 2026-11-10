import { useEffect, useMemo, useState } from 'react'
import {
  listEvents,
  listSubjects,
  listTasks,
  type AcademicEvent,
  type Subject,
  type TaskItem,
} from '../../services/api'

type CalendarPanelProps = {
  onAuthLost: () => void
}

type CalendarItem =
  | { kind: 'event'; data: AcademicEvent }
  | { kind: 'task'; data: TaskItem }

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const eventTypeLabel: Record<AcademicEvent['event_type'], string> = {
  exam: 'Prova',
  assignment: 'Trabalho',
  other: 'Outro',
}

const taskStatusLabel: Record<TaskItem['status'], string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY-MM-DD no fuso local (evita deslocar meia-noite via toISOString UTC). */
function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dateKeyFromIso(iso: string): string {
  return toLocalDateKey(new Date(iso))
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/** Grade mensal começando na segunda-feira. */
function buildMonthCells(year: number, month: number): Date[] {
  const first = startOfMonth(year, month)
  const mondayOffset = (first.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - mondayOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(gridStart)
    cell.setDate(gridStart.getDate() + i)
    return cell
  })
}

function rangeIsoForGrid(cells: Date[]): { from: string; to: string } {
  const start = new Date(cells[0])
  start.setHours(0, 0, 0, 0)
  const end = new Date(cells[cells.length - 1])
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

function itemTone(item: CalendarItem): string {
  if (item.kind === 'task') {
    if (item.data.status === 'done') return 'bg-slate-200 text-slate-600'
    return 'bg-emerald-100 text-emerald-800'
  }
  if (item.data.event_type === 'exam') return 'bg-red-100 text-red-800'
  if (item.data.event_type === 'assignment') return 'bg-violet-100 text-violet-800'
  return 'bg-sky-100 text-sky-800'
}

function itemBadge(item: CalendarItem): string {
  if (item.kind === 'task') return 'Tarefa'
  return eventTypeLabel[item.data.event_type]
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

export function CalendarPanel({ onAuthLost }: CalendarPanelProps) {
  const today = new Date()
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [events, setEvents] = useState<AcademicEvent[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(toLocalDateKey(today))
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)

  const cells = useMemo(() => buildMonthCells(cursor.year, cursor.month), [cursor])
  const range = useMemo(() => rangeIsoForGrid(cells), [cells])

  const subjectName = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of subjects) map.set(s.id, s.name)
    return map
  }, [subjects])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()

    function push(key: string, item: CalendarItem) {
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }

    for (const event of events) {
      if (event.status === 'cancelled') continue
      push(dateKeyFromIso(event.start_at), { kind: 'event', data: event })
    }
    for (const task of tasks) {
      if (!task.due_at) continue
      push(dateKeyFromIso(task.due_at), { kind: 'task', data: task })
    }

    for (const list of map.values()) {
      list.sort((a, b) => {
        const aIso = a.kind === 'event' ? a.data.start_at : a.data.due_at!
        const bIso = b.kind === 'event' ? b.data.start_at : b.data.due_at!
        return new Date(aIso).getTime() - new Date(bIso).getTime()
      })
    }
    return map
  }, [events, tasks])

  async function loadMonth() {
    setLoading(true)
    setError(null)
    try {
      const [eventData, taskData, subjectData] = await Promise.all([
        listEvents({ from: range.from, to: range.to }),
        listTasks({ from: range.from, to: range.to }),
        listSubjects('false'),
      ])
      setEvents(eventData)
      setTasks(taskData)
      setSubjects(subjectData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar o calendário.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMonth()
  }, [range.from, range.to])

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const selectedDayItems = selectedKey ? (itemsByDay.get(selectedKey) ?? []) : []

  function goMonth(delta: number) {
    setSelectedItem(null)
    setCursor((prev) => addMonths(prev.year, prev.month, delta))
  }

  function selectDay(key: string) {
    setSelectedKey(key)
    setSelectedItem(null)
  }

  return (
    <section className="flex flex-col gap-4 ut-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-brand)]">Calendário</h2>
          <p className="text-sm text-slate-600">Provas, trabalhos e tarefas com prazo no mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="ut-btn ut-btn-ghost text-sm text-slate-700"
          >
            Anterior
          </button>
          <p className="min-w-40 text-center text-sm font-medium capitalize text-slate-800">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="ut-btn ut-btn-ghost text-sm text-slate-700"
          >
            Próximo
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date()
              setCursor({ year: now.getFullYear(), month: now.getMonth() })
              setSelectedKey(toLocalDateKey(now))
              setSelectedItem(null)
            }}
            className="ut-btn ut-btn-brand text-sm"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Prova
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> Trabalho
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Outro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Tarefa
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Carregando mês…</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-7 gap-px rounded-xl border border-slate-200 bg-slate-200">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                {day}
              </div>
            ))}
            {cells.map((cell) => {
              const key = toLocalDateKey(cell)
              const inMonth = cell.getMonth() === cursor.month
              const isToday = key === toLocalDateKey(today)
              const isSelected = key === selectedKey
              const dayItems = itemsByDay.get(key) ?? []
              const preview = dayItems.slice(0, 3)
              const extra = dayItems.length - preview.length

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(key)}
                  className={`flex min-h-28 flex-col gap-1 bg-white p-2 text-left transition ${
                    !inMonth ? 'bg-slate-50 text-slate-400' : 'text-slate-800'
                  } ${isSelected ? 'ring-2 ring-inset ring-[var(--color-brand)]' : ''} ${
                    isToday && !isSelected ? 'ring-1 ring-inset ring-[var(--color-accent)]' : ''
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
                        ? 'bg-[var(--color-accent)] text-white'
                        : inMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {cell.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {preview.map((item) => (
                      <span
                        key={`${item.kind}-${item.data.id}`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${itemTone(item)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedKey(key)
                          setSelectedItem(item)
                        }}
                      >
                        {item.data.title}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="text-[10px] text-slate-500">+{extra} mais</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">
            {selectedKey
              ? new Date(`${selectedKey}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })
              : 'Selecione um dia'}
          </h3>
          {selectedDayItems.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nenhum compromisso neste dia.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {selectedDayItems.map((item) => (
                <li key={`${item.kind}-${item.data.id}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-slate-300 ${
                      selectedItem?.kind === item.kind && selectedItem.data.id === item.data.id
                        ? 'ring-2 ring-[var(--color-brand)]'
                        : ''
                    }`}
                  >
                    <span
                      className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${itemTone(item)}`}
                    >
                      {itemBadge(item)}
                    </span>
                    <span className="font-medium text-slate-800">{item.data.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Detalhe</h3>
          {!selectedItem ? (
            <p className="mt-2 text-sm text-slate-500">Clique em um item para ver os detalhes.</p>
          ) : selectedItem.kind === 'event' ? (
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="text-xs text-slate-500">Título</dt>
                <dd className="font-medium">{selectedItem.data.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Tipo</dt>
                <dd>{eventTypeLabel[selectedItem.data.event_type]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Início</dt>
                <dd>{formatDateTime(selectedItem.data.start_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Prazo</dt>
                <dd>{formatDateTime(selectedItem.data.due_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Matéria</dt>
                <dd>
                  {selectedItem.data.subject
                    ? (subjectName.get(selectedItem.data.subject) ?? `#${selectedItem.data.subject}`)
                    : 'Sem matéria'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd>{selectedItem.data.status}</dd>
              </div>
              {selectedItem.data.description && (
                <div>
                  <dt className="text-xs text-slate-500">Descrição</dt>
                  <dd className="whitespace-pre-wrap">{selectedItem.data.description}</dd>
                </div>
              )}
            </dl>
          ) : (
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="text-xs text-slate-500">Título</dt>
                <dd className="font-medium">{selectedItem.data.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Prazo</dt>
                <dd>{formatDateTime(selectedItem.data.due_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd>{taskStatusLabel[selectedItem.data.status]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Prioridade</dt>
                <dd>{selectedItem.data.priority}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Matéria</dt>
                <dd>
                  {selectedItem.data.subject
                    ? (subjectName.get(selectedItem.data.subject) ?? `#${selectedItem.data.subject}`)
                    : 'Sem matéria'}
                </dd>
              </div>
              {selectedItem.data.description && (
                <div>
                  <dt className="text-xs text-slate-500">Descrição</dt>
                  <dd className="whitespace-pre-wrap">{selectedItem.data.description}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </section>
  )
}
