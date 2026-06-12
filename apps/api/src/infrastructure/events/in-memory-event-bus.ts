import type {
  DomainEvent,
  DomainEventBus,
  DomainEventListener
} from '../../domain/services/event-bus.js'

/** Single-process event bus: enough while the API runs as one instance. */
export class InMemoryEventBus implements DomainEventBus {
  private readonly listeners = new Set<DomainEventListener>()

  publish(event: DomainEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  subscribe(listener: DomainEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
