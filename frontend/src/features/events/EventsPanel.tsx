import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import {
  createEvent,
  deleteEvent,
  listEvents,
  listSubjects,
  updateEvent,
  type AcademicEvent,
  type Subject,
} from '../../services/api'
import { exportToExcel, stampFilename } from '../../utils/exportExcel'

type EventsPanelProps = {
  onAuthLost: () => void
}

const emptyForm = {
  title: '',
  description: '',
  event_type: 'exam' as AcademicEvent['event_type'],
  subject: '',
  start_at: '',
  due_at: '',
}

function toInputValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Sem data'
  return new Date(iso).toLocaleString('pt-BR')
}

const typeLabel: Record<AcademicEvent['event_type'], string> = {
  exam: 'Prova',
  assignment: 'Trabalho',
  other: 'Outro',
}

export function EventsPanel({ onAuthLost }: EventsPanelProps) {
  const [events, setEvents] = useState<AcademicEvent[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('scheduled')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [eventData, subjectData] = await Promise.all([
        listEvents(statusFilter ? { status: statusFilter } : {}),
        listSubjects('false'),
      ])
      setEvents(eventData)
      setSubjects(subjectData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar eventos.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [statusFilter])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function startEdit(event: AcademicEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      subject: event.subject ? String(event.subject) : '',
      start_at: toInputValue(event.start_at),
      due_at: toInputValue(event.due_at),
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      event_type: form.event_type,
      subject: form.subject ? Number(form.subject) : null,
      start_at: new Date(form.start_at).toISOString(),
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
    }

    try {
      if (editingId) {
        await updateEvent(editingId, payload)
      } else {
        await createEvent(payload)
      }
      closeModal()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar evento.')
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(id: number) {
    try {
      await updateEvent(id, { status: 'completed' })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao concluir evento.')
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir este evento?')) return
    try {
      await deleteEvent(id)
      if (editingId === id) closeModal()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir evento.')
    }
  }

  function subjectName(id: number | null): string {
    if (!id) return 'Sem matéria'
    return subjects.find((item) => item.id === id)?.name ?? `Matéria #${id}`
  }

  function handleExport() {
    exportToExcel(
      stampFilename('unitask_provas_trabalhos'),
      ['Tipo', 'Título', 'Matéria', 'Início', 'Prazo', 'Status', 'Descrição'],
      events.map((item) => [
        typeLabel[item.event_type],
        item.title,
        subjectName(item.subject),
        formatDate(item.start_at),
        formatDate(item.due_at),
        item.status,
        item.description,
      ]),
    )
  }

  return (
    <section className="ut-panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--color-brand)]">Provas e trabalhos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="ut-input w-auto min-w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="scheduled">Agendados</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
            <option value="">Todos</option>
          </select>
          <button
            type="button"
            className="ut-btn ut-btn-ghost"
            onClick={handleExport}
            disabled={events.length === 0}
          >
            Exportar Excel
          </button>
          <button type="button" className="ut-btn ut-btn-primary" onClick={openCreate}>
            Adicionar evento
          </button>
        </div>
      </div>

      {error && !modalOpen && (
        <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-600">Carregando eventos…</p>
      ) : events.length === 0 ? (
        <p className="text-slate-600">Nenhum evento neste filtro. Use o botão acima para criar.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {typeLabel[item.event_type]} · {item.title}
                </p>
                <p className="text-sm text-slate-500">{subjectName(item.subject)}</p>
                <p className="text-sm text-slate-500">{formatDate(item.start_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="ut-btn ut-btn-ghost text-sm"
                >
                  Editar
                </button>
                {item.status === 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => void handleComplete(item.id)}
                    className="ut-btn ut-btn-ghost text-sm"
                  >
                    Concluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="ut-btn ut-btn-danger text-sm"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar evento' : 'Adicionar evento'}
        onClose={closeModal}
      >
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
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
            <span className="mb-1 block text-slate-600">Tipo</span>
            <select
              className="ut-input"
              value={form.event_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  event_type: e.target.value as AcademicEvent['event_type'],
                }))
              }
            >
              <option value="exam">Prova</option>
              <option value="assignment">Trabalho</option>
              <option value="other">Outro</option>
            </select>
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
            <span className="mb-1 block text-slate-600">Início *</span>
            <input
              type="datetime-local"
              className="ut-input"
              value={form.start_at}
              onChange={(e) => setForm((prev) => ({ ...prev, start_at: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Limite</span>
            <input
              type="datetime-local"
              className="ut-input"
              value={form.due_at}
              onChange={(e) => setForm((prev) => ({ ...prev, due_at: e.target.value }))}
            />
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
          {error && modalOpen && (
            <p className="text-sm text-[var(--color-danger)] sm:col-span-2">{error}</p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="ut-btn ut-btn-primary">
              {saving ? 'Salvando…' : editingId ? 'Salvar evento' : 'Adicionar evento'}
            </button>
            <button type="button" onClick={closeModal} className="ut-btn ut-btn-ghost text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
