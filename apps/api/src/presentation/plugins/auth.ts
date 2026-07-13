import type { FastifyInstance, FastifyRequest } from 'fastify'

const PUBLIC_PATHS = new Set(['/api/health'])

function extractPassword(request: FastifyRequest): string | null {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

/**
 * Password gate for the API. Every /api/* request (except health) must carry
 * `Authorization: Bearer <API_PASSWORD>`. Static web assets stay public —
 * the app itself is useless without the password anyway.
 */
export function registerAuth(app: FastifyInstance, apiPassword: string): void {
  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0] ?? request.url
    if (!path.startsWith('/api/') || PUBLIC_PATHS.has(path)) return

    if (extractPassword(request) !== apiPassword) {
      await reply.code(401).send({
        error: 'unauthorized',
        message: 'Contraseña incorrecta o ausente'
      })
    }
  })
}
