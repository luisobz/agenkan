import { randomUUID } from 'node:crypto'
import type {
  Board,
  BoardDetail,
  BoardSummary,
  Card,
  CardInput,
  CardMove,
  CardUpdate,
  Column
} from '@agenkan/shared'
import type { Database } from 'better-sqlite3'
import type {
  BoardRepository,
  CreateCardOptions
} from '../../domain/repositories/board-repository.js'

interface BoardRow {
  id: string
  name: string
  created_at: string
}

interface ColumnRow {
  id: string
  board_id: string
  name: string
  position: number
}

interface CardRow {
  id: string
  column_id: string
  title: string
  description: string
  labels: string
  priority: number
  position: number
  note_id: string | null
  created_at: string
  updated_at: string
}

function toBoard(row: BoardRow): Board {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

function toColumn(row: ColumnRow): Column {
  return {
    id: row.id,
    boardId: row.board_id,
    name: row.name,
    position: row.position
  }
}

function toCard(row: CardRow): Card {
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    labels: JSON.parse(row.labels) as string[],
    priority: row.priority,
    position: row.position,
    noteId: row.note_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class SqliteBoardRepository implements BoardRepository {
  constructor(private readonly db: Database) {}

  listSummaries(): BoardSummary[] {
    const rows = this.db
      .prepare(
        `SELECT b.*, COUNT(ca.id) AS card_count
         FROM boards b
         LEFT JOIN columns co ON co.board_id = b.id
         LEFT JOIN cards ca ON ca.column_id = co.id
         GROUP BY b.id
         ORDER BY b.created_at DESC`
      )
      .all() as Array<BoardRow & { card_count: number }>
    return rows.map((row) => ({ ...toBoard(row), cardCount: row.card_count }))
  }

  getBoard(id: string): Board | null {
    const row = this.db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as
      | BoardRow
      | undefined
    return row ? toBoard(row) : null
  }

  getDetail(id: string): BoardDetail | null {
    const board = this.getBoard(id)
    if (!board) return null

    const columnRows = this.db
      .prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position')
      .all(id) as ColumnRow[]

    const cardsByColumn = this.db.prepare(
      'SELECT * FROM cards WHERE column_id = ? ORDER BY position'
    )

    return {
      ...board,
      columns: columnRows.map((columnRow) => ({
        ...toColumn(columnRow),
        cards: (cardsByColumn.all(columnRow.id) as CardRow[]).map(toCard)
      }))
    }
  }

  create(name: string, columnNames: string[]): BoardDetail {
    const board: Board = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString()
    }

    this.db.transaction(() => {
      this.db
        .prepare('INSERT INTO boards (id, name, created_at) VALUES (?, ?, ?)')
        .run(board.id, board.name, board.createdAt)
      columnNames.forEach((columnName, position) => {
        this.insertColumn(board.id, columnName, position)
      })
    })()

    const detail = this.getDetail(board.id)
    if (!detail) throw new Error('Board vanished right after creation')
    return detail
  }

  rename(id: string, name: string): Board | null {
    const result = this.db
      .prepare('UPDATE boards SET name = ? WHERE id = ?')
      .run(name, id)
    return result.changes > 0 ? this.getBoard(id) : null
  }

  delete(id: string): boolean {
    return (
      this.db.prepare('DELETE FROM boards WHERE id = ?').run(id).changes > 0
    )
  }

  addColumn(boardId: string, name: string): Column {
    const { next } = this.db
      .prepare(
        'SELECT COALESCE(MAX(position) + 1, 0) AS next FROM columns WHERE board_id = ?'
      )
      .get(boardId) as { next: number }
    return this.insertColumn(boardId, name, next)
  }

  renameColumn(columnId: string, name: string): Column | null {
    const result = this.db
      .prepare('UPDATE columns SET name = ? WHERE id = ?')
      .run(name, columnId)
    if (result.changes === 0) return null
    const row = this.db
      .prepare('SELECT * FROM columns WHERE id = ?')
      .get(columnId) as ColumnRow
    return toColumn(row)
  }

  deleteColumn(columnId: string): boolean {
    return (
      this.db.prepare('DELETE FROM columns WHERE id = ?').run(columnId)
        .changes > 0
    )
  }

  getCard(cardId: string): Card | null {
    const row = this.db
      .prepare('SELECT * FROM cards WHERE id = ?')
      .get(cardId) as CardRow | undefined
    return row ? toCard(row) : null
  }

  createCard(input: CardInput, options: CreateCardOptions = {}): Card {
    const now = new Date().toISOString()
    const { next } = this.db
      .prepare(
        'SELECT COALESCE(MAX(position) + 1, 0) AS next FROM cards WHERE column_id = ?'
      )
      .get(input.columnId) as { next: number }

    const card: Card = {
      id: randomUUID(),
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      labels: input.labels,
      priority: input.priority,
      position: next,
      noteId: options.noteId ?? null,
      createdAt: now,
      updatedAt: now
    }

    this.db
      .prepare(
        `INSERT INTO cards
           (id, column_id, title, description, labels, priority, position, note_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        card.id,
        card.columnId,
        card.title,
        card.description,
        JSON.stringify(card.labels),
        card.priority,
        card.position,
        card.noteId,
        card.createdAt,
        card.updatedAt
      )
    return card
  }

  updateCard(cardId: string, update: CardUpdate): Card | null {
    const current = this.getCard(cardId)
    if (!current) return null

    const merged = { ...current, ...update }
    this.db
      .prepare(
        `UPDATE cards
         SET title = ?, description = ?, labels = ?, priority = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        merged.title,
        merged.description,
        JSON.stringify(merged.labels),
        merged.priority,
        new Date().toISOString(),
        cardId
      )
    return this.getCard(cardId)
  }

  moveCard(cardId: string, move: CardMove): Card | null {
    const card = this.getCard(cardId)
    if (!card) return null

    this.db.transaction(() => {
      // Close the gap in the source column, open one in the target column.
      this.db
        .prepare(
          'UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?'
        )
        .run(card.columnId, card.position)
      this.db
        .prepare(
          'UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ? AND id != ?'
        )
        .run(move.toColumnId, move.position, cardId)
      this.db
        .prepare(
          'UPDATE cards SET column_id = ?, position = ?, updated_at = ? WHERE id = ?'
        )
        .run(move.toColumnId, move.position, new Date().toISOString(), cardId)
    })()

    return this.getCard(cardId)
  }

  deleteCard(cardId: string): boolean {
    return (
      this.db.prepare('DELETE FROM cards WHERE id = ?').run(cardId).changes > 0
    )
  }

  listLabels(boardId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT ca.labels FROM cards ca
         JOIN columns co ON co.id = ca.column_id
         WHERE co.board_id = ?`
      )
      .all(boardId) as Array<{ labels: string }>

    const unique = new Set<string>()
    for (const row of rows) {
      for (const label of JSON.parse(row.labels) as string[]) {
        unique.add(label)
      }
    }
    return [...unique].sort()
  }

  private insertColumn(
    boardId: string,
    name: string,
    position: number
  ): Column {
    const column: Column = { id: randomUUID(), boardId, name, position }
    this.db
      .prepare(
        'INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)'
      )
      .run(column.id, column.boardId, column.name, column.position)
    return column
  }
}
