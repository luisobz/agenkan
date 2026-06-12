import type { Note, NoteInput } from '@agenkan/shared'
import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '../connection/connection-context.js'

export interface UseNotes {
  notes: Note[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  create: (input?: Partial<NoteInput>) => Promise<Note>
  save: (id: string, input: NoteInput) => Promise<Note>
  remove: (id: string) => Promise<void>
}

export function useNotes(): UseNotes {
  const { api } = useConnection()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setNotes(await api.listNotes())
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : String(loadError)
      )
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input?: Partial<NoteInput>) => {
      const note = await api.createNote({
        title: input?.title ?? 'Sin título',
        content: input?.content ?? ''
      })
      setNotes((current) => [note, ...current])
      return note
    },
    [api]
  )

  const save = useCallback(
    async (id: string, input: NoteInput) => {
      const updated = await api.updateNote(id, input)
      setNotes((current) =>
        current.map((note) => (note.id === id ? updated : note))
      )
      return updated
    },
    [api]
  )

  const remove = useCallback(
    async (id: string) => {
      await api.deleteNote(id)
      setNotes((current) => current.filter((note) => note.id !== id))
    },
    [api]
  )

  return { notes, loading, error, refresh, create, save, remove }
}
