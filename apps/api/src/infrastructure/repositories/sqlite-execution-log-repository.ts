import { randomUUID } from 'node:crypto'
import type { ExecutionLog, ExecutionStatus } from '@agenkan/shared'
import type { Database } from 'better-sqlite3'
import type {
  ExecutionLogInput,
  ExecutionLogRepository
} from '../../domain/repositories/execution-log-repository.js'

interface LogRow {
  id: string
  note_id: string
  model: string
  status: string
  summary: string
  raw_response: string
  created_at: string
}

function toLog(row: LogRow): ExecutionLog {
  return {
    id: row.id,
    noteId: row.note_id,
    model: row.model,
    status: row.status as ExecutionStatus,
    summary: row.summary,
    rawResponse: row.raw_response,
    createdAt: row.created_at
  }
}

export class SqliteExecutionLogRepository implements ExecutionLogRepository {
  constructor(private readonly db: Database) {}

  listByNote(noteId: string, limit: number): ExecutionLog[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM execution_logs WHERE note_id = ? ORDER BY created_at DESC LIMIT ?'
      )
      .all(noteId, limit) as LogRow[]
    return rows.map(toLog)
  }

  listRecent(limit: number): ExecutionLog[] {
    const rows = this.db
      .prepare('SELECT * FROM execution_logs ORDER BY created_at DESC LIMIT ?')
      .all(limit) as LogRow[]
    return rows.map(toLog)
  }

  create(input: ExecutionLogInput): ExecutionLog {
    const log: ExecutionLog = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString()
    }
    this.db
      .prepare(
        `INSERT INTO execution_logs (id, note_id, model, status, summary, raw_response, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        log.id,
        log.noteId,
        log.model,
        log.status,
        log.summary,
        log.rawResponse,
        log.createdAt
      )
    return log
  }
}
