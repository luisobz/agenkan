import type { Note, NoteInput } from '@agenkan/shared'

export interface NoteRepository {
  list(): Note[]
  get(id: string): Note | null
  create(input: NoteInput): Note
  update(id: string, input: NoteInput): Note | null
  delete(id: string): boolean
  /** Links the note to the board it was planned into and flips its status. */
  markPlanned(id: string, boardId: string): void
}
