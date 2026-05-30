import { z } from 'zod'

export const SettingsSchema = z.object({
  vikunjaApiUrl: z.string().url().default('http://localhost:3456/api/v1'),
  vikunjaApiToken: z.string().default(''),
  vikunjaApiTokenCreate: z.string().default(''),
  vikunjaApiTokenExisting: z.string().default(''),
  vikunjaApiTokenManagement: z.string().default(''),
  ollamaUrl: z.string().url().default('http://localhost:11434'),
  ollamaModel: z.string().default('gemma4:e4b-it-q8_0')
})

export type Settings = z.infer<typeof SettingsSchema>

export const DEFAULT_SETTINGS: Settings = {
  vikunjaApiUrl: 'http://localhost:3456/api/v1',
  vikunjaApiToken: '',
  vikunjaApiTokenCreate: '',
  vikunjaApiTokenExisting: '',
  vikunjaApiTokenManagement: '',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'gemma4:e4b-it-q8_0'
}
