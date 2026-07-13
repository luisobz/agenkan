import { z } from 'zod'

/** Server-side settings, editable from the UI and persisted in the database. */
export const ServerSettingsSchema = z.object({
  ollamaUrl: z.string().url(),
  ollamaModel: z.string().min(1)
})

export const ServerSettingsUpdateSchema = ServerSettingsSchema.partial()

export type ServerSettings = z.infer<typeof ServerSettingsSchema>
export type ServerSettingsUpdate = z.infer<typeof ServerSettingsUpdateSchema>
