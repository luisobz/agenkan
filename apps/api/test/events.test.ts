import assert from 'node:assert/strict'
import test from 'node:test'
import { buildApp } from '../src/app.js'
import type { DomainEvent } from '../src/domain/services/event-bus.js'
import { InMemoryEventBus } from '../src/infrastructure/events/in-memory-event-bus.js'

const PASSWORD = 'test-password'
const authHeaders = { authorization: `Bearer ${PASSWORD}` }

async function createTestApp(bus: InMemoryEventBus) {
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
    eventBus: bus
  })
}

test('in-memory bus delivers events and honors unsubscribe', () => {
  const bus = new InMemoryEventBus()
  const received: DomainEvent[] = []
  const unsubscribe = bus.subscribe((event) => received.push(event))

  bus.publish({ topic: 'notes' })
  assert.deepEqual(received, [{ topic: 'notes' }])

  unsubscribe()
  bus.publish({ topic: 'boards' })
  assert.equal(received.length, 1)
})

test('mutations publish domain events', async () => {
  const bus = new InMemoryEventBus()
  const received: DomainEvent[] = []
  bus.subscribe((event) => received.push(event))
  const app = await createTestApp(bus)

  await app.inject({
    method: 'POST',
    url: '/api/notes',
    headers: authHeaders,
    payload: { title: 'Nota', content: 'algo' }
  })
  assert.deepEqual(received, [{ topic: 'notes' }])

  const board = (
    await app.inject({
      method: 'POST',
      url: '/api/boards',
      headers: authHeaders,
      payload: { name: 'Tablero' }
    })
  ).json()
  assert.deepEqual(received[1], { topic: 'boards', boardId: board.id })

  await app.close()
})

test('the SSE endpoint requires authentication', async () => {
  const app = await createTestApp(new InMemoryEventBus())
  const response = await app.inject({ method: 'GET', url: '/api/events' })
  assert.equal(response.statusCode, 401)
  await app.close()
})
