import assert from 'node:assert/strict'
import test from 'node:test'
import type { BoardDetail, Note } from '@agenkan/shared'
import { buildApp } from '../src/app.js'
import type { AiPlanner } from '../src/domain/services/ai-planner.js'

const PASSWORD = 'test-password'

const fakePlanner: AiPlanner = {
  async generatePlan(context) {
    return {
      plan: {
        summary: `Plan para: ${context.noteTitle}`,
        boardName: 'Tablero de prueba',
        cards: [
          { title: 'Primera tarea', description: '', labels: ['test'], priority: 2 },
          { title: 'Segunda tarea', description: 'Con detalle', labels: [], priority: 0 }
        ]
      },
      rawResponse: '{}',
      model: 'fake-model'
    }
  },
  async checkStatus() {
    return { reachable: true, modelAvailable: true, models: ['fake-model'], message: 'ok' }
  },
  async listModels() {
    return ['fake-model']
  }
}

async function createTestApp() {
  return buildApp({
    config: {
      port: 0,
      host: '127.0.0.1',
      apiPassword: PASSWORD,
      databasePath: ':memory:',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'fake-model',
      webDistPath: null
    },
    aiPlanner: fakePlanner
  })
}

const authHeaders = { authorization: `Bearer ${PASSWORD}` }

test('rejects requests without the password', async () => {
  const app = await createTestApp()
  const response = await app.inject({ method: 'GET', url: '/api/notes' })
  assert.equal(response.statusCode, 401)
  await app.close()
})

test('health endpoint is public', async () => {
  const app = await createTestApp()
  const response = await app.inject({ method: 'GET', url: '/api/health' })
  assert.equal(response.statusCode, 200)
  assert.equal(response.json().status, 'ok')
  await app.close()
})

test('full flow: note → generated plan → applied to a new board', async () => {
  const app = await createTestApp()

  const noteResponse = await app.inject({
    method: 'POST',
    url: '/api/notes',
    headers: authHeaders,
    payload: { title: 'Ideas del finde', content: 'Comprar pintura y pintar el salón' }
  })
  assert.equal(noteResponse.statusCode, 201)
  const note = noteResponse.json() as Note
  assert.equal(note.status, 'draft')

  const planResponse = await app.inject({
    method: 'POST',
    url: '/api/planner/generate',
    headers: authHeaders,
    payload: { noteId: note.id, target: { mode: 'new' } }
  })
  assert.equal(planResponse.statusCode, 200)
  const { plan, model, rawResponse } = planResponse.json()
  assert.equal(plan.cards.length, 2)

  const applyResponse = await app.inject({
    method: 'POST',
    url: '/api/planner/apply',
    headers: authHeaders,
    payload: { noteId: note.id, target: { mode: 'new' }, plan, model, rawResponse }
  })
  assert.equal(applyResponse.statusCode, 201)
  const { boardId, createdCardIds } = applyResponse.json()
  assert.equal(createdCardIds.length, 2)

  const boardResponse = await app.inject({
    method: 'GET',
    url: `/api/boards/${boardId}`,
    headers: authHeaders
  })
  const board = boardResponse.json() as BoardDetail
  assert.equal(board.columns.length, 3)
  assert.equal(board.columns[0]?.cards.length, 2)
  assert.equal(board.columns[0]?.cards[0]?.noteId, note.id)

  const updatedNote = (
    await app.inject({ method: 'GET', url: `/api/notes/${note.id}`, headers: authHeaders })
  ).json() as Note
  assert.equal(updatedNote.status, 'planned')
  assert.equal(updatedNote.boardId, boardId)

  const logs = (
    await app.inject({
      method: 'GET',
      url: `/api/logs?noteId=${note.id}`,
      headers: authHeaders
    })
  ).json()
  assert.equal(logs.length, 1)
  assert.equal(logs[0].status, 'success')

  await app.close()
})

test('cards can be moved between columns', async () => {
  const app = await createTestApp()

  const board = (
    await app.inject({
      method: 'POST',
      url: '/api/boards',
      headers: authHeaders,
      payload: { name: 'Manual' }
    })
  ).json() as BoardDetail
  const [todo, doing] = board.columns
  assert.ok(todo && doing)

  const card = (
    await app.inject({
      method: 'POST',
      url: '/api/cards',
      headers: authHeaders,
      payload: { columnId: todo.id, title: 'Mover esto' }
    })
  ).json()

  const moveResponse = await app.inject({
    method: 'POST',
    url: `/api/cards/${card.id}/move`,
    headers: authHeaders,
    payload: { toColumnId: doing.id, position: 0 }
  })
  assert.equal(moveResponse.statusCode, 200)
  assert.equal(moveResponse.json().columnId, doing.id)

  await app.close()
})
