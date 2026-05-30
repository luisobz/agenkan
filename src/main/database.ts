import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { Note } from '@shared/schemas/note'
import type { ExecutionResult, NoteTaskLink } from '@shared/schemas/execution'
import type { Settings } from '@shared/schemas/settings'
import { DEFAULT_SETTINGS } from '@shared/schemas/settings'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = join(app.getPath('userData'), 'agenkan.db')
  db = new Database(dbPath)

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Sin título',
      content TEXT NOT NULL DEFAULT '',
      is_launched INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success', 'partial', 'error')),
      project_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id)
    );

    CREATE TABLE IF NOT EXISTS note_task_links (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      vikunja_task_id INTEGER NOT NULL,
      vikunja_project_id INTEGER NOT NULL,
      task_title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_logs_note ON execution_logs(note_id);
    CREATE INDEX IF NOT EXISTS idx_links_note ON note_task_links(note_id);
  `)
  try {
    db.exec('ALTER TABLE notes ADD COLUMN is_launched INTEGER NOT NULL DEFAULT 0;')
  } catch (err) {}
  try {
    db.exec('ALTER TABLE execution_logs ADD COLUMN raw_response TEXT;')
  } catch (err) {}
  try {
    db.exec('ALTER TABLE execution_logs ADD COLUMN model_used TEXT;')
  } catch (err) {}
}

/* ── Notes ── */

export function listNotes(): Note[] {
  const stmt = db.prepare(
    'SELECT id, title, content, is_launched as isLaunched, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC'
  )
  return stmt.all() as Note[]
}

export function getNote(id: string): Note | undefined {
  const stmt = db.prepare(
    'SELECT id, title, content, is_launched as isLaunched, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt FROM notes WHERE id = ?'
  )
  return stmt.get(id) as Note | undefined
}

export function saveNote(note: {
  id: string
  title: string
  content: string
  isLaunched?: boolean
}): Note {
  const existing = getNote(note.id)
  const isLaunched = note.isLaunched ? 1 : 0

  if (existing) {
    db.prepare(
      "UPDATE notes SET title = ?, content = ?, is_launched = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(note.title, note.content, isLaunched, note.id)
  } else {
    db.prepare(
      "INSERT INTO notes (id, title, content, is_launched, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).run(note.id, note.title, note.content, isLaunched)
  }

  return getNote(note.id)!
}

export function deleteNote(id: string): void {
  // Soft delete
  db.prepare(
    "UPDATE notes SET deleted_at = datetime('now') WHERE id = ?"
  ).run(id)
}

/* ── Settings ── */

export function getSettings(): Settings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: string
    value: string
  }>
  const map = new Map(rows.map((r) => [r.key, r.value]))

  return {
    vikunjaApiUrl:
      map.get('vikunjaApiUrl') ?? DEFAULT_SETTINGS.vikunjaApiUrl,
    vikunjaApiToken:
      map.get('vikunjaApiToken') ?? DEFAULT_SETTINGS.vikunjaApiToken,
    vikunjaApiTokenCreate:
      map.get('vikunjaApiTokenCreate') ?? DEFAULT_SETTINGS.vikunjaApiTokenCreate,
    vikunjaApiTokenExisting:
      map.get('vikunjaApiTokenExisting') ?? DEFAULT_SETTINGS.vikunjaApiTokenExisting,
    vikunjaApiTokenManagement:
      map.get('vikunjaApiTokenManagement') ?? DEFAULT_SETTINGS.vikunjaApiTokenManagement,
    ollamaUrl: map.get('ollamaUrl') ?? DEFAULT_SETTINGS.ollamaUrl,
    ollamaModel: map.get('ollamaModel') ?? DEFAULT_SETTINGS.ollamaModel
  }
}

export function saveSettings(settings: Settings): void {
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )

  const save = db.transaction(() => {
    upsert.run('vikunjaApiUrl', settings.vikunjaApiUrl)
    upsert.run('vikunjaApiToken', settings.vikunjaApiToken)
    upsert.run('vikunjaApiTokenCreate', settings.vikunjaApiTokenCreate)
    upsert.run('vikunjaApiTokenExisting', settings.vikunjaApiTokenExisting)
    upsert.run('vikunjaApiTokenManagement', settings.vikunjaApiTokenManagement)
    upsert.run('ollamaUrl', settings.ollamaUrl)
    upsert.run('ollamaModel', settings.ollamaModel)
  })

  save()
}

/* ── Execution Logs ── */

export function saveExecutionLog(log: {
  id: string
  noteId: string
  planJson: string
  resultJson: string
  status: 'success' | 'partial' | 'error'
  projectId?: number
  rawResponse?: string
  modelUsed?: string
}): void {
  db.prepare(
    "INSERT INTO execution_logs (id, note_id, plan_json, result_json, status, project_id, raw_response, model_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).run(log.id, log.noteId, log.planJson, log.resultJson, log.status, log.projectId ?? null, log.rawResponse ?? null, log.modelUsed ?? null)
}

export function listExecutionLogs(options?: { noteId?: string; limit?: number; offset?: number }): ExecutionResult[] {
  let rows: unknown[]
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  if (options?.noteId) {
    rows = db
      .prepare(
        'SELECT id, note_id as noteId, plan_json as planJson, result_json, status, project_id as projectId, raw_response as rawResponse, model_used as modelUsed, created_at as createdAt FROM execution_logs WHERE note_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(options.noteId, limit, offset)
  } else {
    rows = db
      .prepare(
        'SELECT id, note_id as noteId, plan_json as planJson, result_json, status, project_id as projectId, raw_response as rawResponse, model_used as modelUsed, created_at as createdAt FROM execution_logs ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(limit, offset)
  }

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    results: JSON.parse(r.result_json as string)
  })) as unknown as ExecutionResult[]
}

/* ── Note-Task Links ── */

export function saveNoteTaskLink(link: {
  id: string
  noteId: string
  vikunjaTaskId: number
  vikunjaProjectId: number
  taskTitle: string
}): void {
  db.prepare(
    "INSERT INTO note_task_links (id, note_id, vikunja_task_id, vikunja_project_id, task_title, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).run(link.id, link.noteId, link.vikunjaTaskId, link.vikunjaProjectId, link.taskTitle)
}

export function getNoteTaskLinks(noteId: string): NoteTaskLink[] {
  return db
    .prepare(
      'SELECT id, note_id as noteId, vikunja_task_id as vikunjaTaskId, vikunja_project_id as vikunjaProjectId, task_title as taskTitle, created_at as createdAt FROM note_task_links WHERE note_id = ? ORDER BY created_at DESC'
    )
    .all(noteId) as NoteTaskLink[]
}

export function closeDatabase(): void {
  if (db) db.close()
}
