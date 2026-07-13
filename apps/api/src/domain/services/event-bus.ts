/** Topics clients can react to. Coarse on purpose: clients just re-fetch. */
export type DomainEventTopic = 'notes' | 'boards'

export interface DomainEvent {
  topic: DomainEventTopic
  /** Present when the change is scoped to one board. */
  boardId?: string
}

export type DomainEventListener = (event: DomainEvent) => void

/** Port for broadcasting data changes to connected clients (SSE). */
export interface DomainEventBus {
  publish(event: DomainEvent): void
  /** Returns an unsubscribe function. */
  subscribe(listener: DomainEventListener): () => void
}
