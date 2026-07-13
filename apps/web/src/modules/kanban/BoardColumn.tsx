import type { Card, ColumnWithCards } from '@agenkan/shared'
import { useState, type DragEvent } from 'react'
import { CARD_DRAG_TYPE, CardItem } from './CardItem.js'

export interface BoardColumnProps {
  column: ColumnWithCards
  onDropCard: (cardId: string, toColumnId: string, position: number) => void
  onAddCard: (columnId: string, title: string) => void
  onCardClick: (card: Card) => void
  onRename: (columnId: string, name: string) => void
  onDelete: (columnId: string) => void
}

export function BoardColumn({
  column,
  onDropCard,
  onAddCard,
  onCardClick,
  onRename,
  onDelete
}: BoardColumnProps) {
  const [dragOver, setDragOver] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  const extractCardId = (event: DragEvent): string | null =>
    event.dataTransfer.getData(CARD_DRAG_TYPE) || null

  const handleDropOnColumn = (event: DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    const cardId = extractCardId(event)
    if (cardId) onDropCard(cardId, column.id, column.cards.length)
  }

  const handleDropOnCard = (event: DragEvent, position: number) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
    const cardId = extractCardId(event)
    if (cardId) onDropCard(cardId, column.id, position)
  }

  const handleAddCard = () => {
    const title = newCardTitle.trim()
    if (!title) return
    onAddCard(column.id, title)
    setNewCardTitle('')
  }

  const handleRename = () => {
    const name = window.prompt('Nombre de la columna', column.name)?.trim()
    if (name && name !== column.name) onRename(column.id, name)
  }

  return (
    <section
      className={`kanban-column ${dragOver ? 'is-drag-over' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDropOnColumn}
    >
      <header className="kanban-column__header">
        <button
          className="kanban-column__name"
          onClick={handleRename}
          title="Renombrar columna"
        >
          {column.name}
        </button>
        <span className="kanban-column__count">{column.cards.length}</span>
        <button
          className="kanban-column__delete"
          onClick={() => onDelete(column.id)}
          title="Eliminar columna"
        >
          ×
        </button>
      </header>

      <div className="kanban-column__cards">
        {column.cards.map((card, index) => (
          <div key={card.id} onDrop={(event) => handleDropOnCard(event, index)}>
            <CardItem card={card} onClick={onCardClick} />
          </div>
        ))}
      </div>

      <div className="kanban-column__add">
        <input
          className="ui-input"
          placeholder="+ Añadir tarjeta"
          value={newCardTitle}
          onChange={(event) => setNewCardTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAddCard()
          }}
        />
      </div>
    </section>
  )
}
