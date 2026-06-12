import {
  BoardInputSchema,
  CardInputSchema,
  CardMoveSchema,
  CardUpdateSchema,
  ColumnInputSchema
} from '@agenkan/shared'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { NotFoundError } from '../../domain/errors.js'
import type { BoardRepository } from '../../domain/repositories/board-repository.js'
import { DEFAULT_COLUMNS } from '../../domain/services/plan-executor-service.js'

const IdParamsSchema = z.object({ id: z.string().uuid() })

export function registerBoardRoutes(
  app: FastifyInstance,
  boards: BoardRepository
): void {
  /* ── Boards ── */

  app.get('/api/boards', async () => boards.listSummaries())

  app.get('/api/boards/:id', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const board = boards.getDetail(id)
    if (!board) throw new NotFoundError('Tablero', id)
    return board
  })

  app.post('/api/boards', async (request, reply) => {
    const { name } = BoardInputSchema.parse(request.body)
    return reply.code(201).send(boards.create(name, DEFAULT_COLUMNS))
  })

  app.patch('/api/boards/:id', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const { name } = BoardInputSchema.parse(request.body)
    const board = boards.rename(id, name)
    if (!board) throw new NotFoundError('Tablero', id)
    return board
  })

  app.delete('/api/boards/:id', async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params)
    if (!boards.delete(id)) throw new NotFoundError('Tablero', id)
    return reply.code(204).send()
  })

  /* ── Columns ── */

  app.post('/api/boards/:id/columns', async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params)
    if (!boards.getBoard(id)) throw new NotFoundError('Tablero', id)
    const { name } = ColumnInputSchema.parse(request.body)
    return reply.code(201).send(boards.addColumn(id, name))
  })

  app.patch('/api/columns/:id', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const { name } = ColumnInputSchema.parse(request.body)
    const column = boards.renameColumn(id, name)
    if (!column) throw new NotFoundError('Columna', id)
    return column
  })

  app.delete('/api/columns/:id', async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params)
    if (!boards.deleteColumn(id)) throw new NotFoundError('Columna', id)
    return reply.code(204).send()
  })

  /* ── Cards ── */

  app.post('/api/cards', async (request, reply) => {
    const input = CardInputSchema.parse(request.body)
    return reply.code(201).send(boards.createCard(input))
  })

  app.patch('/api/cards/:id', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const update = CardUpdateSchema.parse(request.body)
    const card = boards.updateCard(id, update)
    if (!card) throw new NotFoundError('Tarjeta', id)
    return card
  })

  app.post('/api/cards/:id/move', async (request) => {
    const { id } = IdParamsSchema.parse(request.params)
    const move = CardMoveSchema.parse(request.body)
    const card = boards.moveCard(id, move)
    if (!card) throw new NotFoundError('Tarjeta', id)
    return card
  })

  app.delete('/api/cards/:id', async (request, reply) => {
    const { id } = IdParamsSchema.parse(request.params)
    if (!boards.deleteCard(id)) throw new NotFoundError('Tarjeta', id)
    return reply.code(204).send()
  })
}
