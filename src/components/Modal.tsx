import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
      <section className="modal-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="关闭"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}
