import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode
} from 'react'
import type { ConnectionConfig } from '../../lib/connection-storage.js'
import { connectServerEvents, type ServerEvent } from '../../lib/sse-client.js'

type EventHandler = (event: ServerEvent) => void
type Subscribe = (
  topic: ServerEvent['topic'],
  handler: EventHandler
) => () => void

const ServerEventsContext = createContext<Subscribe | null>(null)

/**
 * Keeps a single SSE connection per session and fans events out to whichever
 * hooks are mounted. Lives inside ConnectionGate, so it always has a verified
 * connection.
 */
export function ServerEventsProvider({
  connection,
  children
}: {
  connection: ConnectionConfig
  children: ReactNode
}) {
  const handlersRef = useRef(
    new Set<{ topic: string; handler: EventHandler }>()
  )

  useEffect(() => {
    return connectServerEvents(connection, (event) => {
      for (const entry of handlersRef.current) {
        if (entry.topic === event.topic) entry.handler(event)
      }
    })
  }, [connection])

  const subscribe = useMemo<Subscribe>(
    () => (topic, handler) => {
      const entry = { topic, handler }
      handlersRef.current.add(entry)
      return () => handlersRef.current.delete(entry)
    },
    []
  )

  return (
    <ServerEventsContext.Provider value={subscribe}>
      {children}
    </ServerEventsContext.Provider>
  )
}

/**
 * Runs `handler` whenever the server announces a change on `topic`.
 * The handler is kept in a ref, so callers don't need to memoize it.
 */
export function useServerEvents(
  topic: ServerEvent['topic'],
  handler: EventHandler
): void {
  const subscribe = useContext(ServerEventsContext)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!subscribe) return
    return subscribe(topic, (event) => handlerRef.current(event))
  }, [subscribe, topic])
}
