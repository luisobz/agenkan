import fs from 'node:fs'
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import type { AppConfig } from './config.js'
import type { AiPlanner } from './domain/services/ai-planner.js'
import { PlanExecutorService } from './domain/services/plan-executor-service.js'
import { PlannerService } from './domain/services/planner-service.js'
import { createDatabase, type Database } from './infrastructure/database/connection.js'
import { OllamaPlanner } from './infrastructure/ai/ollama-planner.js'
import { SqliteBoardRepository } from './infrastructure/repositories/sqlite-board-repository.js'
import { SqliteExecutionLogRepository } from './infrastructure/repositories/sqlite-execution-log-repository.js'
import { SqliteNoteRepository } from './infrastructure/repositories/sqlite-note-repository.js'
import { SqliteSettingsRepository } from './infrastructure/repositories/sqlite-settings-repository.js'
import { registerAuth } from './presentation/plugins/auth.js'
import { registerErrorHandler } from './presentation/plugins/error-handler.js'
import { registerBoardRoutes } from './presentation/routes/boards.js'
import { registerNoteRoutes } from './presentation/routes/notes.js'
import { registerPlannerRoutes } from './presentation/routes/planner.js'
import { registerSettingsRoutes } from './presentation/routes/settings.js'
import { registerSystemRoutes } from './presentation/routes/system.js'

export const APP_VERSION = '1.0.0'

export interface BuildAppOptions {
  config: AppConfig
  /** Injectable for tests; defaults to the real Ollama-backed planner. */
  aiPlanner?: AiPlanner
  /** Injectable for tests; defaults to a database at config.databasePath. */
  database?: Database
}

/**
 * Composition root: wires infrastructure into the domain services and
 * exposes everything through the HTTP layer.
 */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { config } = options
  const db = options.database ?? createDatabase(config.databasePath)

  const notes = new SqliteNoteRepository(db)
  const boards = new SqliteBoardRepository(db)
  const logs = new SqliteExecutionLogRepository(db)
  const settings = new SqliteSettingsRepository(db, {
    ollamaUrl: config.ollamaUrl,
    ollamaModel: config.ollamaModel
  })

  const aiPlanner = options.aiPlanner ?? new OllamaPlanner(settings)
  const plannerService = new PlannerService(notes, boards, aiPlanner)
  const executorService = new PlanExecutorService(notes, boards, logs)

  const app = Fastify({ logger: true })

  await app.register(fastifyCors, { origin: true })
  registerErrorHandler(app)
  registerAuth(app, config.apiPassword)

  registerSystemRoutes(app, APP_VERSION)
  registerNoteRoutes(app, notes)
  registerBoardRoutes(app, boards)
  registerPlannerRoutes(app, plannerService, executorService, logs)
  registerSettingsRoutes(app, settings, aiPlanner)

  await registerWebApp(app, config.webDistPath)

  app.addHook('onClose', async () => {
    db.close()
  })

  return app
}

/** Serves the built web frontend (SPA) when it exists next to the API. */
async function registerWebApp(
  app: FastifyInstance,
  webDistPath: string | null
): Promise<void> {
  if (!webDistPath || !fs.existsSync(webDistPath)) return

  await app.register(fastifyStatic, { root: webDistPath })
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      return reply
        .code(404)
        .send({ error: 'not_found', message: 'Ruta no encontrada' })
    }
    return reply.sendFile('index.html')
  })
}
