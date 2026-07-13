import type { FastifyInstance } from 'fastify'
import type { DomainEventBus } from '../../domain/services/event-bus.js'

const HEARTBEAT_INTERVAL_MS = 25_000

/**
 * Server-Sent Events stream. Clients keep one connection open and re-fetch
 * whatever a received event invalidates. Auth is enforced by the global
 * onRequest hook before this handler runs.
 */
export function registerEventRoutes(
  app: FastifyInstance,
  bus: DomainEventBus
): void {
  app.get('/api/events', (request, reply) => {
    reply.hijack()
    const stream = reply.raw

    stream.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // The browser/APK may live on another origin than the API.
      'Access-Control-Allow-Origin': '*'
    })
    stream.write(':connected\n\n')

    const unsubscribe = bus.subscribe((event) => {
      stream.write(`data: ${JSON.stringify(event)}\n\n`)
    })
    const heartbeat = setInterval(() => {
      stream.write(':ping\n\n')
    }, HEARTBEAT_INTERVAL_MS)

    request.raw.on('close', () => {
      clearInterval(heartbeat)
      unsubscribe()
    })
  })
}
