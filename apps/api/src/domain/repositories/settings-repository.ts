import type { ServerSettings, ServerSettingsUpdate } from '@agenkan/shared'

export interface SettingsRepository {
  get(): ServerSettings
  update(patch: ServerSettingsUpdate): ServerSettings
}
