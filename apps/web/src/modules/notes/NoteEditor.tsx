import { Badge, Button } from '@agenkan/ui'
import type { Note, NoteInput } from '@agenkan/shared'
import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from '../../composables/use-debounced-callback.js'
import { useSpeechToText } from '../../composables/use-speech-to-text.js'

const AUTOSAVE_DELAY_MS = 800

export interface NoteEditorProps {
  note: Note
  onSave: (id: string, input: NoteInput) => Promise<unknown>
  onDelete: (id: string) => void
  onPlan: (note: Note) => void
  onBack: () => void
}

type SaveState = 'saved' | 'pending' | 'saving'

export function NoteEditor({
  note,
  onSave,
  onDelete,
  onPlan,
  onBack
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const autosave = useDebouncedCallback((input: NoteInput) => {
    setSaveState('saving')
    void onSave(note.id, input).then(() => setSaveState('saved'))
  }, AUTOSAVE_DELAY_MS)

  // Swap editor contents when the user selects another note.
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSaveState('saved')
  }, [note.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (nextTitle: string, nextContent: string) => {
    setTitle(nextTitle)
    setContent(nextContent)
    setSaveState('pending')
    autosave.run({ title: nextTitle || 'Sin título', content: nextContent })
  }

  const speech = useSpeechToText((spokenText) => {
    const textarea = contentRef.current
    const base = textarea ? textarea.value : content
    const separator = base.length > 0 && !base.endsWith('\n') ? ' ' : ''
    handleChange(title, `${base}${separator}${spokenText}`)
  })

  const handlePlan = () => {
    autosave.flush()
    onPlan({ ...note, title, content })
  }

  return (
    <section className="note-editor">
      <header className="note-editor__toolbar">
        <Button className="note-editor__back" onClick={onBack}>
          ←
        </Button>
        <input
          className="note-editor__title"
          value={title}
          placeholder="Título de la nota..."
          onChange={(event) => handleChange(event.target.value, content)}
        />
        <div className="note-editor__status">
          <Badge tone={note.status === 'planned' ? 'success' : 'neutral'}>
            {note.status === 'planned' ? 'Planificada' : 'Borrador'}
          </Badge>
          <span className="note-editor__save-state">
            {saveState === 'saved' ? 'Guardado' : 'Guardando…'}
          </span>
        </div>
      </header>

      <div className="note-editor__body">
        <textarea
          ref={contentRef}
          className="note-editor__content"
          value={content}
          placeholder="Escribe o dicta tus ideas... Después la IA las convertirá en tarjetas del tablero."
          onChange={(event) => handleChange(title, event.target.value)}
        />
        {speech.listening && (
          <div className="note-editor__interim">
            🎙️ {speech.interimText || 'Escuchando...'}
          </div>
        )}
        {speech.error && (
          <div className="note-editor__speech-error">{speech.error}</div>
        )}
      </div>

      <footer className="note-editor__actions">
        {speech.supported && (
          <Button
            className={speech.listening ? 'is-recording' : ''}
            onClick={() =>
              void (speech.listening ? speech.stop() : speech.start())
            }
            title={speech.listening ? 'Detener dictado' : 'Dictar por voz'}
          >
            {speech.listening ? '⏹ Detener' : '🎙️ Dictar'}
          </Button>
        )}
        <div className="note-editor__actions-spacer" />
        <Button variant="danger" onClick={() => onDelete(note.id)}>
          Eliminar
        </Button>
        <Button
          variant="primary"
          disabled={!content.trim()}
          onClick={handlePlan}
        >
          ✨ Planificar
        </Button>
      </footer>
    </section>
  )
}
