import type { ConnectionConfig } from './connection-storage.js'

export interface ServerEvent {
  topic: 'notes' | 'boards'
  boardId?: string
}

const INITIAL_RETRY_MS = 1_000
const MAX_RETRY_MS = 30_000

/**
 * Subscribes to the API's Server-Sent Events stream.
 *
 * Built on fetch + ReadableStream instead of EventSource because EventSource
 * cannot send the Authorization header our auth scheme requires. Reconnects
 * with exponential backoff until the returned dispose function is called.
 */
export function connectServerEvents(
  connection: ConnectionConfig,
  onEvent: (event: ServerEvent) => void
): () => void {
  const controller = new AbortController()
  let stopped = false

  const run = async () => {
    let retryMs = INITIAL_RETRY_MS

    while (!stopped) {
      try {
        const response = await fetch(`${connection.baseUrl}/api/events`, {
          headers: { Authorization: `Bearer ${connection.password}` },
          signal: controller.signal
        })
        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: HTTP ${response.status}`)
        }

        retryMs = INITIAL_RETRY_MS
        await readEventStream(response.body, onEvent)
      } catch {
        // Connection dropped or refused; fall through to the retry wait.
      }

      if (stopped) return
      await sleep(retryMs)
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
    }
  }

  void run()

  return () => {
    stopped = true
    controller.abort()
  }
}

/** Parses `data: <json>` lines out of the raw SSE byte stream. */
async function readEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ServerEvent) => void
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) return

    buffer += decoder.decode(value, { stream: true })

    let separatorIndex = buffer.indexOf('\n\n')
    while (separatorIndex !== -1) {
      const rawMessage = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)
      emitDataLines(rawMessage, onEvent)
      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}

function emitDataLines(
  rawMessage: string,
  onEvent: (event: ServerEvent) => void
): void {
  for (const line of rawMessage.split('\n')) {
    if (!line.startsWith('data:')) continue
    try {
      onEvent(JSON.parse(line.slice('data:'.length).trim()) as ServerEvent)
    } catch {
      // Ignore malformed payloads; the next event will resync state anyway.
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
