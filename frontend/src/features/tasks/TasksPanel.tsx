import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createTask,
  deleteTask,
  listSubjects,
  listTasks,
  updateTask,
  type Subject,
  type TaskItem,
} from '../../services/api'

type TasksPanelProps = {
  onAuthLost: () => void
}

const emptyForm = {
  title: '',
  description: '',
  subject: '',
  due_at: '',
  priority: 'medium' as TaskItem['priority'],
  status: 'pending' as TaskItem['status'],
}

function toInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Sem prazo'
  return new Date(iso).toLocaleString('pt-BR')
}

const priorityLabel: Record<TaskItem['priority'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const statusLabel: Record<TaskItem['status'], string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
}

export function TasksPanel({ onAuthLost }: TasksPanelProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [taskData, subjectData] = await Promise.all([
        listTasks(statusFilter ? { status: statusFilter } : {}),
        listSubjects('false'),
      ])
      setTasks(taskData)
      setSubjects(subjectData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar tarefas.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [statusFilter])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(task: TaskItem) {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description,
      subject: task.subject ? String(task.subject) : '',
      due_at: toInputValue(task.due_at),
      priority: task.priority,
      status: task.status,
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject ? Number(form.subject) : null,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      priority: form.priority,
      status: form.status,
    }

    try {
      if (editingId) {
        await updateTask(editingId, payload)
      } else {
        await createTask(payload)
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleDone(task: TaskItem) {
    try {
      await updateTask(task.id, {
        status: task.status === 'done' ? 'pending' : 'done',
      })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status.')
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir esta tarefa?')) return
    try {
      await deleteTask(id)
      if (editingId === id) resetForm()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir tarefa.')
    }
  }

  function subjectName(id: number | null): string {
    if (!id) return 'Sem matéria'
    return subjects.find((item) => item.id === id)?.name ?? `Matéria #${id}`
  }

  return (
    <section className="ut-panel p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--color-brand)]">Tarefas</h2>
        <select
          className="ut-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="pending">Pendentes</option>
          <option value="in_progress">Em andamento</option>
          <option value="done">Concluídas</option>
        </select>
      </div>

      <form className="mb-6 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Título *</span>
          <input
            className="ut-input"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Matéria</span>
          <select
            className="ut-input"
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
          >
            <option value="">Sem matéria</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Prioridade</span>
          <select
            className="ut-input"
            value={form.priority}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                priority: e.target.value as TaskItem['priority'],
              }))
            }
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Prazo</span>
          <input
            type="datetime-local"
            className="ut-input"
            value={form.due_at}
            onChange={(e) => setForm((prev) => ({ ...prev, due_at: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Status</span>
          <select
            className="ut-input"
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                status: e.target.value as TaskItem['status'],
              }))
            }
          >
            <option value="pending">Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="done">Concluída</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Descrição</span>
          <textarea
            className="ut-input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="ut-btn ut-btn-primary"
          >
            {saving ? 'Salvando…' : editingId ? 'Salvar tarefa' : 'Adicionar tarefa'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="ut-btn ut-btn-ghost text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>}

      {loading ? (
        <p className="text-slate-600">Carregando tarefas…</p>
      ) : tasks.length === 0 ? (
        <p className="text-slate-600">Nenhuma tarefa neste filtro.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-sm text-slate-500">
                  {subjectName(task.subject)} · {priorityLabel[task.priority]} ·{' '}
                  {statusLabel[task.status]}
                </p>
                <p className="text-sm text-slate-500">{formatDate(task.due_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(task)}
                  className="ut-btn ut-btn-ghost text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleDone(task)}
                  className="ut-btn ut-btn-ghost text-sm"
                >
                  {task.status === 'done' ? 'Reabrir' : 'Concluir'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(task.id)}
                  className="ut-btn ut-btn-danger text-sm"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
