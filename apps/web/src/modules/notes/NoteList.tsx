import { Badge, Button, TextInput } from '@agenkan/ui'
import type { Note } from '@agenkan/shared'
import { useMemo, useState } from 'react'

export interface NoteListProps {
  notes: Note[]
  activeNoteId: string | null
  onSelect: (note: Note) => void
  onCreate: () => void
}

export function NoteList({
  notes,
  activeNoteId,
  onSelect,
  onCreate
}: NoteListProps) {
  const [query, setQuery] = useState('')

  const visibleNotes = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return notes
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term)
    )
  }, [notes, query])

  return (
    <aside className="note-list">
      <div className="note-list__actions">
        <TextInput
          type="search"
          placeholder="Buscar notas..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button variant="primary" onClick={onCreate}>
          + Nueva nota
        </Button>
      </div>

      <ul className="note-list__items">
        {visibleNotes.map((note) => (
          <li key={note.id}>
            <button
              className={`note-list__item ${
                note.id === activeNoteId ? 'is-active' : ''
              }`}
              onClick={() => onSelect(note)}
            >
              <span className="note-list__item-title">{note.title}</span>
              <span className="note-list__item-preview">
                {note.content.slice(0, 80) || 'Nota vacía'}
              </span>
              <span className="note-list__item-meta">
                <Badge tone={note.status === 'planned' ? 'success' : 'neutral'}>
                  {note.status === 'planned' ? 'Planificada' : 'Borrador'}
                </Badge>
                <time>{new Date(note.updatedAt).toLocaleDateString()}</time>
              </span>
            </button>
          </li>
        ))}
        {visibleNotes.length === 0 && (
          <li className="note-list__empty">
            {query ? 'Sin resultados' : 'Crea tu primera nota'}
          </li>
        )}
      </ul>
    </aside>
  )
}
