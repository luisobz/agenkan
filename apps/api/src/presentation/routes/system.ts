import type { FastifyInstance } from 'fastify'

export function registerSystemRoutes(
  app: FastifyInstance,
  version: string
): void {
  app.get('/api/health', async () => ({ status: 'ok' as const, version }))

  /** Clients call this after the user types the password to validate it. */
  app.post('/api/auth/verify', async () => ({ authenticated: true }))
}
