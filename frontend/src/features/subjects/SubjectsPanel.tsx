import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../components/Modal'
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
  type Subject,
} from '../../services/api'

type SubjectsPanelProps = {
  onAuthLost: () => void
}

const emptyForm = {
  name: '',
  code: '',
  professor: '',
  color: '#1E3A8A',
  passing_grade: '6.0',
}

export function SubjectsPanel({ onAuthLost }: SubjectsPanelProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSubjects() {
    setLoading(true)
    setError(null)
    try {
      const data = await listSubjects('false')
      setSubjects(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar matérias.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSubjects()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function startEdit(subject: Subject) {
    setEditingId(subject.id)
    setForm({
      name: subject.name,
      code: subject.code,
      professor: subject.professor,
      color: subject.color || '#1E3A8A',
      passing_grade: subject.passing_grade,
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
      name: form.name.trim(),
      code: form.code.trim(),
      professor: form.professor.trim(),
      color: form.color,
      passing_grade: form.passing_grade,
    }

    try {
      if (editingId) {
        await updateSubject(editingId, payload)
      } else {
        await createSubject(payload)
      }
      closeModal()
      await loadSubjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar matéria.')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(id: number) {
    setError(null)
    try {
      await updateSubject(id, { is_archived: true })
      await loadSubjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao arquivar.')
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir esta matéria permanentemente?')) return
    setError(null)
    try {
      await deleteSubject(id)
      if (editingId === id) closeModal()
      await loadSubjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir.')
    }
  }

  return (
    <section className="ut-panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--color-brand)]">Matérias</h2>
        <button type="button" className="ut-btn ut-btn-primary" onClick={openCreate}>
          Adicionar matéria
        </button>
      </div>

      {error && !modalOpen && (
        <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-600">Carregando matérias…</p>
      ) : subjects.length === 0 ? (
        <p className="text-slate-600">
          Nenhuma matéria ativa. Use o botão acima para cadastrar a primeira.
        </p>
      ) : (
        <ul className="space-y-3">
          {subjects.map((subject) => (
            <li
              key={subject.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-3 w-3 rounded-full"
                  style={{ backgroundColor: subject.color || '#1E3A8A' }}
                  aria-hidden
                />
                <div>
                  <p className="font-medium text-slate-900">{subject.name}</p>
                  <p className="text-sm text-slate-500">
                    {[subject.code, subject.professor].filter(Boolean).join(' · ') ||
                      'Sem código/professor'}
                  </p>
                  <p className="text-sm text-slate-500">Aprovação: {subject.passing_grade}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(subject)}
                  className="ut-btn ut-btn-ghost text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleArchive(subject.id)}
                  className="ut-btn ut-btn-ghost text-sm"
                >
                  Arquivar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(subject.id)}
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
        title={editingId ? 'Editar matéria' : 'Adicionar matéria'}
        onClose={closeModal}
      >
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block text-left text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Nome *</span>
            <input
              className="ut-input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-left text-sm">
            <span className="mb-1 block text-slate-600">Código</span>
            <input
              className="ut-input"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </label>
          <label className="block text-left text-sm">
            <span className="mb-1 block text-slate-600">Professor</span>
            <input
              className="ut-input"
              value={form.professor}
              onChange={(e) => setForm((prev) => ({ ...prev, professor: e.target.value }))}
            />
          </label>
          <label className="block text-left text-sm">
            <span className="mb-1 block text-slate-600">Cor</span>
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-slate-300 px-2 py-1"
              value={form.color}
              onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
            />
          </label>
          <label className="block text-left text-sm">
            <span className="mb-1 block text-slate-600">Média de aprovação</span>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              className="ut-input"
              value={form.passing_grade}
              onChange={(e) => setForm((prev) => ({ ...prev, passing_grade: e.target.value }))}
              required
            />
          </label>
          {error && modalOpen && (
            <p className="text-sm text-[var(--color-danger)] sm:col-span-2">{error}</p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="ut-btn ut-btn-primary">
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Adicionar matéria'}
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
