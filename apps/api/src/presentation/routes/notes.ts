import { NoteInputSchema } from '@agenkan/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { NotFoundError } from '../../domain/errors.js'
import type { NoteRepository } from '../../domain/repositories/note-repository.js'

const IdParamsSchema = z.object({ id: z.string().uuid() })

export function registerNoteRoutes(
  app: FastifyInstance,
  notes: NoteRepository
): void {
  app.get('/api/notes', async () => notes.list())

  app.get('/api/notes/:id', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const note = notes.get(id)
    if (!note) throw new NotFoundError('Nota', id)
    return note
  })

  app.post('/api/notes', async (request, reply) => {
    const input = NoteInputSchema.parse(request.body)
    return reply.code(201).send(notes.create(input))
  })

  app.put('/api/notes/:id', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const input = NoteInputSchema.parse(request.body)
    const note = notes.update(id, input)
    if (!note) throw new NotFoundError('Nota', id)
    return note
  })

  app.delete('/api/notes/:id', async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params)
    if (!notes.delete(id)) throw new NotFoundError('Nota', id)
    return reply.code(204).send()
  })
}
