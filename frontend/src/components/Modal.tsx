import { useEffect } from 'react'
import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ut-modal-root" role="presentation">
      <button type="button" className="ut-modal-backdrop" aria-label="Fechar" onClick={onClose} />
      <div
        className="ut-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ut-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3
            id="ut-modal-title"
            className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-brand)]"
          >
            {title}
          </h3>
          <button type="button" className="ut-btn ut-btn-ghost px-2.5 py-1.5 text-sm" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
