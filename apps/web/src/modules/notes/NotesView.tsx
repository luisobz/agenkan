import { Spinner } from '@agenkan/ui'
import type { Note } from '@agenkan/shared'
import { useState } from 'react'
import { PlanWizardModal } from '../planner/PlanWizardModal.js'
import { NoteEditor } from './NoteEditor.js'
import { NoteList } from './NoteList.js'
import { useNotes } from './use-notes.js'

export interface NotesViewProps {
  /** Called after a plan is applied so the app can jump to the board. */
  onPlanApplied: (boardId: string) => void
}

export function NotesView({ onPlanApplied }: NotesViewProps) {
  const { notes, loading, error, refresh, create, save, remove } = useNotes()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [planningNote, setPlanningNote] = useState<Note | null>(null)

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null

  const handleCreate = async () => {
    const note = await create()
    setActiveNoteId(note.id)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta nota?')) return
    await remove(id)
    setActiveNoteId(null)
  }

  if (loading) {
    return (
      <div className="view-placeholder">
        <Spinner label="Cargando notas..." />
      </div>
    )
  }

  if (error) {
    return <div className="view-placeholder view-placeholder--error">{error}</div>
  }

  return (
    <div className={`notes-view ${activeNote ? 'is-editing' : ''}`}>
      <NoteList
        notes={notes}
        activeNoteId={activeNoteId}
        onSelect={(note) => setActiveNoteId(note.id)}
        onCreate={() => void handleCreate()}
      />

      {activeNote ? (
        <NoteEditor
          note={activeNote}
          onSave={save}
          onDelete={(id) => void handleDelete(id)}
          onPlan={setPlanningNote}
          onBack={() => setActiveNoteId(null)}
        />
      ) : (
        <div className="notes-view__empty">
          <p>Selecciona una nota o crea una nueva.</p>
          <p className="notes-view__hint">
            Escribe ideas sueltas y deja que la IA las convierta en tarjetas.
          </p>
        </div>
      )}

      {planningNote && (
        <PlanWizardModal
          note={planningNote}
          onClose={() => setPlanningNote(null)}
          onApplied={(boardId) => {
            setPlanningNote(null)
            void refresh()
            onPlanApplied(boardId)
          }}
        />
      )}
    </div>
  )
}
