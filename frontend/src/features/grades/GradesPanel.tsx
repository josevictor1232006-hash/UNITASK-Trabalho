import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createAssessment,
  deleteAssessment,
  fetchGradeSummary,
  listAssessments,
  listSubjects,
  updateAssessment,
  type Assessment,
  type GradeSummary,
  type Subject,
} from '../../services/api'

type GradesPanelProps = {
  onAuthLost: () => void
}

const emptyForm = {
  name: '',
  score: '',
  weight: '',
  date: '',
}

export function GradesPanel({ onAuthLost }: GradesPanelProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [summary, setSummary] = useState<GradeSummary | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSubjects() {
    try {
      const data = await listSubjects('false')
      setSubjects(data)
      if (!subjectId && data.length > 0) {
        setSubjectId(String(data[0].id))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar matérias.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    }
  }

  async function loadGrades(selected: string) {
    if (!selected) {
      setAssessments([])
      setSummary(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [assessmentData, summaryData] = await Promise.all([
        listAssessments({ subject: selected }),
        fetchGradeSummary(selected),
      ])
      setAssessments(assessmentData)
      setSummary(summaryData as GradeSummary)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar notas.'
      setError(message)
      if (message.toLowerCase().includes('sessão')) onAuthLost()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSubjects()
  }, [])

  useEffect(() => {
    void loadGrades(subjectId)
  }, [subjectId])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(item: Assessment) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      score: item.score ?? '',
      weight: item.weight ?? '',
      date: item.date ?? '',
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!subjectId) {
      setError('Selecione uma matéria.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      subject: Number(subjectId),
      name: form.name.trim(),
      score: form.score === '' ? null : form.score,
      weight: form.weight === '' ? null : form.weight,
      date: form.date === '' ? null : form.date,
    }

    try {
      if (editingId) {
        await updateAssessment(editingId, payload)
      } else {
        await createAssessment(payload)
      }
      resetForm()
      await loadGrades(subjectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar avaliação.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Excluir esta avaliação?')) return
    try {
      await deleteAssessment(id)
      if (editingId === id) resetForm()
      await loadGrades(subjectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir avaliação.')
    }
  }

  const selectedSubject = subjects.find((s) => String(s.id) === subjectId)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-brand)]">Notas e médias</h2>
          <p className="text-sm text-slate-600">
            Pesos opcionais · aprovação padrão {selectedSubject?.passing_grade ?? '6.00'}
          </p>
        </div>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={subjectId}
          onChange={(e) => {
            resetForm()
            setSubjectId(e.target.value)
          }}
        >
          {subjects.length === 0 && <option value="">Nenhuma matéria</option>}
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs tracking-wide text-slate-500 uppercase">Média atual</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-brand)]">
              {summary.current_average ?? '—'}
            </p>
            <p className="text-xs text-slate-500">
              {summary.method === 'weighted'
                ? 'Ponderada'
                : summary.method === 'simple'
                  ? 'Simples'
                  : 'Sem notas'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs tracking-wide text-slate-500 uppercase">Nota necessária</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                summary.needed_feasible === false
                  ? 'text-[var(--color-danger)]'
                  : 'text-[var(--color-accent)]'
              }`}
            >
              {summary.needed_on_remaining ?? '—'}
            </p>
            <p className="text-xs text-slate-500">
              {summary.pending_count} pendente(s) · meta {summary.passing_grade}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs tracking-wide text-slate-500 uppercase">Situação</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {summary.already_passing === true
                ? 'Na média de aprovação'
                : summary.already_passing === false
                  ? 'Abaixo da aprovação'
                  : 'Aguardando notas'}
            </p>
            {summary.message && (
              <p className="mt-2 text-xs text-slate-500">{summary.message}</p>
            )}
          </div>
        </div>
      )}

      <form className="mb-6 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Avaliação *</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex.: P1, Trabalho 1"
            required
            disabled={!subjectId}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Nota (0–10)</span>
          <input
            type="number"
            min="0"
            max="10"
            step="0.01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.score}
            onChange={(e) => setForm((prev) => ({ ...prev, score: e.target.value }))}
            placeholder="Vazio = pendente"
            disabled={!subjectId}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Peso (opcional)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.weight}
            onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
            disabled={!subjectId}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Data</span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            disabled={!subjectId}
          />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving || !subjectId}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Salvando…' : editingId ? 'Salvar avaliação' : 'Adicionar avaliação'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p>}

      {loading ? (
        <p className="text-slate-600">Carregando avaliações…</p>
      ) : !subjectId ? (
        <p className="text-slate-600">Cadastre uma matéria para lançar notas.</p>
      ) : assessments.length === 0 ? (
        <p className="text-slate-600">Nenhuma avaliação nesta matéria.</p>
      ) : (
        <ul className="space-y-3">
          {assessments.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">
                  Nota: {item.score ?? 'Pendente'}
                  {item.weight != null ? ` · Peso: ${item.weight}` : ''}
                  {item.date ? ` · ${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-[var(--color-danger)]"
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
