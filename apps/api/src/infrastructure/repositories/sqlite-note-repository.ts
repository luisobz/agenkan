import { randomUUID } from 'node:crypto'
import type { Note, NoteInput, NoteStatus } from '@agenkan/shared'
import type { Database } from 'better-sqlite3'
import type { NoteRepository } from '../../domain/repositories/note-repository.js'

interface NoteRow {
  id: string
  title: string
  content: string
  status: string
  board_id: string | null
  created_at: string
  updated_at: string
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status as NoteStatus,
    boardId: row.board_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class SqliteNoteRepository implements NoteRepository {
  constructor(private readonly db: Database) {}

  list(): Note[] {
    const rows = this.db
      .prepare('SELECT * FROM notes ORDER BY updated_at DESC')
      .all() as NoteRow[]
    return rows.map(toNote)
  }

  get(id: string): Note | null {
    const row = this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as
      | NoteRow
      | undefined
    return row ? toNote(row) : null
  }

  create(input: NoteInput): Note {
    const now = new Date().toISOString()
    const note: Note = {
      id: randomUUID(),
      title: input.title,
      content: input.content,
      status: 'draft',
      boardId: null,
      createdAt: now,
      updatedAt: now
    }
    this.db
      .prepare(
        `INSERT INTO notes (id, title, content, status, board_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        note.id,
        note.title,
        note.content,
        note.status,
        note.boardId,
        note.createdAt,
        note.updatedAt
      )
    return note
  }

  update(id: string, input: NoteInput): Note | null {
    const result = this.db
      .prepare(
        'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?'
      )
      .run(input.title, input.content, new Date().toISOString(), id)
    return result.changes > 0 ? this.get(id) : null
  }

  delete(id: string): boolean {
    return this.db.prepare('DELETE FROM notes WHERE id = ?').run(id).changes > 0
  }

  markPlanned(id: string, boardId: string): void {
    this.db
      .prepare(
        "UPDATE notes SET status = 'planned', board_id = ?, updated_at = ? WHERE id = ?"
      )
      .run(boardId, new Date().toISOString(), id)
  }
}
