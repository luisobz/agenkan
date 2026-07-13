import fs from 'node:fs'
import path from 'node:path'
import { buildApp } from './app.js'
import { loadConfig } from './config.js'

/** Loads a .env file from the repo root or the app folder, if present. */
function loadEnvFile(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(import.meta.dirname, '../../../.env')
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      process.loadEnvFile(candidate)
      return
    }
  }
}

async function main(): Promise<void> {
  loadEnvFile()
  const config = loadConfig()
  const app = await buildApp({ config })

  await app.listen({ port: config.port, host: config.host })
}

main().catch((error) => {
  console.error('Fatal:', error)
  process.exit(1)
})
