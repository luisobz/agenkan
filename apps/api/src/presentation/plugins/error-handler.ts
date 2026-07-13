import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { NotFoundError, PlanGenerationError } from '../../domain/errors.js'

/** Maps domain and validation errors to consistent HTTP responses. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'validation_error',
        message: error.errors
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ')
      })
    }

    if (error instanceof NotFoundError) {
      return reply
        .code(404)
        .send({ error: 'not_found', message: error.message })
    }

    if (error instanceof PlanGenerationError) {
      return reply.code(422).send({
        error: 'plan_generation_failed',
        message: error.message,
        rawResponse: error.rawResponse
      })
    }

    request.log.error(error)
    return reply.code(500).send({
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Error inesperado'
    })
  })
}
