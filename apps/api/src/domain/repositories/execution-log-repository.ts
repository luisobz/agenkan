import type { ExecutionLog, ExecutionStatus } from '@agenkan/shared'

export interface ExecutionLogInput {
  noteId: string
  model: string
  status: ExecutionStatus
  summary: string
  rawResponse: string
}

export interface ExecutionLogRepository {
  listByNote(noteId: string, limit: number): ExecutionLog[]
  listRecent(limit: number): ExecutionLog[]
  create(input: ExecutionLogInput): ExecutionLog
}
