import { ServerSettingsUpdateSchema } from '@agenkan/shared'
import type { FastifyInstance } from 'fastify'
import type { SettingsRepository } from '../../domain/repositories/settings-repository.js'
import type { AiPlanner } from '../../domain/services/ai-planner.js'

export function registerSettingsRoutes(
  app: FastifyInstance,
  settings: SettingsRepository,
  aiPlanner: AiPlanner
): void {
  app.get('/api/settings', async () => settings.get())

  app.patch('/api/settings', async (request) => {
    const patch = ServerSettingsUpdateSchema.parse(request.body)
    return settings.update(patch)
  })

  app.get('/api/settings/ollama-status', async () => aiPlanner.checkStatus())
}
