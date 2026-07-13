import path from 'node:path'

export interface AppConfig {
  port: number
  host: string
  apiPassword: string
  databasePath: string
  ollamaUrl: string
  ollamaModel: string
  /** Absolute path to the built web app, or null to skip static serving. */
  webDistPath: string | null
}

function findWebDist(): string | null {
  const candidate = path.resolve(import.meta.dirname, '../../web/dist')
  return candidate
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const apiPassword = env.API_PASSWORD ?? ''
  if (!apiPassword) {
    throw new Error(
      'API_PASSWORD is required. Set it in the environment or in a .env file.'
    )
  }

  return {
    port: Number(env.PORT ?? 3210),
    host: env.HOST ?? '0.0.0.0',
    apiPassword,
    databasePath: env.DATABASE_PATH ?? './data/agenkan.db',
    ollamaUrl: env.OLLAMA_URL ?? 'http://localhost:11434',
    ollamaModel: env.OLLAMA_MODEL ?? 'qwen3:8b',
    webDistPath: findWebDist()
  }
}
