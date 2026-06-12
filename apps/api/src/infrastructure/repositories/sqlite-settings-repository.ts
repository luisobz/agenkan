import type { ServerSettings, ServerSettingsUpdate } from '@agenkan/shared'
import type { Database } from 'better-sqlite3'
import type { SettingsRepository } from '../../domain/repositories/settings-repository.js'

/**
 * Key/value settings store. Environment variables act as defaults; values
 * saved from the UI override them and survive restarts.
 */
export class SqliteSettingsRepository implements SettingsRepository {
  constructor(
    private readonly db: Database,
    private readonly defaults: ServerSettings
  ) {}

  get(): ServerSettings {
    const rows = this.db
      .prepare('SELECT key, value FROM settings')
      .all() as Array<{ key: string; value: string }>
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]))

    return {
      ollamaUrl: stored.ollamaUrl ?? this.defaults.ollamaUrl,
      ollamaModel: stored.ollamaModel ?? this.defaults.ollamaModel
    }
  }

  update(patch: ServerSettingsUpdate): ServerSettings {
    const upsert = this.db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    this.db.transaction(() => {
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) upsert.run(key, value)
      }
    })()
    return this.get()
  }
}
