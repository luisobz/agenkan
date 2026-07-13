import { Badge } from '@agenkan/ui'
import type { Card } from '@agenkan/shared'
import { PriorityBadge } from './PriorityBadge.js'

export const CARD_DRAG_TYPE = 'application/x-agenkan-card'

export interface CardItemProps {
  card: Card
  onClick: (card: Card) => void
}

export function CardItem({ card, onClick }: CardItemProps) {
  return (
    <article
      className="kanban-card"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(CARD_DRAG_TYPE, card.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => onClick(card)}
    >
      <header className="kanban-card__header">
        <span className="kanban-card__title">{card.title}</span>
        <PriorityBadge priority={card.priority} />
      </header>
      {card.description && (
        <p className="kanban-card__description">{card.description}</p>
      )}
      {(card.labels.length > 0 || card.noteId) && (
        <footer className="kanban-card__footer">
          {card.labels.map((label) => (
            <Badge key={label} tone="accent">
              {label}
            </Badge>
          ))}
          {card.noteId && (
            <span
              className="kanban-card__note-mark"
              title="Creada desde una nota"
            >
              📝
            </span>
          )}
        </footer>
      )}
    </article>
  )
}
