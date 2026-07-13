import { Button, Modal, TextArea, TextInput } from '@agenkan/ui'
import type { Card, CardPriority, ColumnWithCards } from '@agenkan/shared'
import { useState } from 'react'

export interface CardModalProps {
  card: Card
  columns: ColumnWithCards[]
  onSave: (update: {
    title: string
    description: string
    labels: string[]
    priority: CardPriority
  }) => void
  onMove: (toColumnId: string) => void
  onDelete: () => void
  onClose: () => void
}

/**
 * Card detail editor. Also covers moving the card via a column selector,
 * which is the touch-friendly alternative to drag & drop on mobile.
 */
export function CardModal({
  card,
  columns,
  onSave,
  onMove,
  onDelete,
  onClose
}: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [labelsText, setLabelsText] = useState(card.labels.join(', '))
  const [priority, setPriority] = useState<CardPriority>(card.priority)

  const handleSave = () => {
    const labels = labelsText
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 10)
    onSave({ title: title.trim() || card.title, description, labels, priority })
  }

  return (
    <Modal
      title="Editar tarjeta"
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" onClick={onDelete}>
            Eliminar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="card-modal__fields">
        <TextInput
          label="Título"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextArea
          label="Descripción"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextInput
          label="Etiquetas (separadas por comas)"
          value={labelsText}
          onChange={(event) => setLabelsText(event.target.value)}
        />

        <label className="ui-field">
          <span className="ui-field__label">Prioridad</span>
          <select
            className="ui-input"
            value={priority}
            onChange={(event) =>
              setPriority(Number(event.target.value) as CardPriority)
            }
          >
            <option value={0}>Sin prioridad</option>
            <option value={1}>Baja</option>
            <option value={2}>Media</option>
            <option value={3}>Alta</option>
          </select>
        </label>

        <label className="ui-field">
          <span className="ui-field__label">Mover a columna</span>
          <select
            className="ui-input"
            value={card.columnId}
            onChange={(event) => onMove(event.target.value)}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  )
}
