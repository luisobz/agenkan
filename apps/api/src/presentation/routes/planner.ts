import { ApplyPlanRequestSchema, GeneratePlanRequestSchema } from '@agenkan/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { ExecutionLogRepository } from '../../domain/repositories/execution-log-repository.js'
import type { PlanExecutorService } from '../../domain/services/plan-executor-service.js'
import type { PlannerService } from '../../domain/services/planner-service.js'

const LogsQuerySchema = z.object({
  noteId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export function registerPlannerRoutes(
  app: FastifyInstance,
  planner: PlannerService,
  executor: PlanExecutorService,
  logs: ExecutionLogRepository
): void {
  app.post('/api/planner/generate', async (request) => {
    const body = GeneratePlanRequestSchema.parse(request.body)
    return planner.generate(body)
  })

  app.post('/api/planner/apply', async (request, reply) => {
    const body = ApplyPlanRequestSchema.parse(request.body)
    return reply.code(201).send(executor.apply(body))
  })

  app.get('/api/logs', async (request) => {
    const { noteId, limit } = LogsQuerySchema.parse(request.query)
    return noteId ? logs.listByNote(noteId, limit) : logs.listRecent(limit)
  })
}
