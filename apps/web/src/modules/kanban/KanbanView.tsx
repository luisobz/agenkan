import { Button, Spinner } from '@agenkan/ui'
import type { Card } from '@agenkan/shared'
import { useEffect, useState } from 'react'
import { BoardColumn } from './BoardColumn.js'
import { CardModal } from './CardModal.js'
import { useBoard, useBoards } from './use-board.js'

export interface KanbanViewProps {
  selectedBoardId: string | null
  onSelectBoard: (boardId: string | null) => void
}

export function KanbanView({ selectedBoardId, onSelectBoard }: KanbanViewProps) {
  const boardsApi = useBoards()
  const boardApi = useBoard(selectedBoardId)
  const [editingCard, setEditingCard] = useState<Card | null>(null)

  // Auto-select the first board when nothing is selected yet.
  useEffect(() => {
    if (!selectedBoardId && boardsApi.boards.length > 0) {
      onSelectBoard(boardsApi.boards[0]?.id ?? null)
    }
  }, [selectedBoardId, boardsApi.boards, onSelectBoard])

  const handleCreateBoard = async () => {
    const name = window.prompt('Nombre del tablero nuevo')?.trim()
    if (!name) return
    const board = await boardsApi.create(name)
    onSelectBoard(board.id)
  }

  const handleDeleteBoard = async () => {
    if (!boardApi.board) return
    if (!window.confirm(`¿Eliminar el tablero "${boardApi.board.name}" y todas sus tarjetas?`)) {
      return
    }
    await boardsApi.remove(boardApi.board.id)
    onSelectBoard(null)
  }

  const handleAddColumn = async () => {
    const name = window.prompt('Nombre de la columna')?.trim()
    if (name) await boardApi.addColumn(name)
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (window.confirm('¿Eliminar esta columna y sus tarjetas?')) {
      await boardApi.deleteColumn(columnId)
    }
  }

  if (boardsApi.loading) {
    return (
      <div className="view-placeholder">
        <Spinner label="Cargando tableros..." />
      </div>
    )
  }

  return (
    <div className="kanban-view">
      <header className="kanban-view__toolbar">
        <select
          className="ui-input kanban-view__picker"
          value={selectedBoardId ?? ''}
          onChange={(event) => onSelectBoard(event.target.value || null)}
        >
          {boardsApi.boards.length === 0 && <option value="">Sin tableros</option>}
          {boardsApi.boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name} ({board.cardCount})
            </option>
          ))}
        </select>
        <Button onClick={() => void handleCreateBoard()}>+ Tablero</Button>
        {boardApi.board && (
          <>
            <Button onClick={() => void handleAddColumn()}>+ Columna</Button>
            <Button variant="danger" onClick={() => void handleDeleteBoard()}>
              Eliminar tablero
            </Button>
          </>
        )}
      </header>

      {boardsApi.boards.length === 0 && (
        <div className="view-placeholder">
          <p>No hay tableros todavía.</p>
          <p className="notes-view__hint">
            Crea uno aquí o planifica una nota con la IA.
          </p>
        </div>
      )}

      {boardApi.loading && (
        <div className="view-placeholder">
          <Spinner label="Cargando tablero..." />
        </div>
      )}

      {boardApi.board && !boardApi.loading && (
        <div className="kanban-view__columns">
          {boardApi.board.columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              onDropCard={(cardId, toColumnId, position) =>
                void boardApi.moveCard(cardId, toColumnId, position)
              }
              onAddCard={(columnId, title) =>
                void boardApi.createCard({
                  columnId,
                  title,
                  description: '',
                  labels: [],
                  priority: 0
                })
              }
              onCardClick={setEditingCard}
              onRename={(columnId, name) =>
                void boardApi.renameColumn(columnId, name)
              }
              onDelete={(columnId) => void handleDeleteColumn(columnId)}
            />
          ))}
        </div>
      )}

      {editingCard && boardApi.board && (
        <CardModal
          card={editingCard}
          columns={boardApi.board.columns}
          onSave={(update) => {
            void boardApi.updateCard(editingCard.id, update)
            setEditingCard(null)
          }}
          onMove={(toColumnId) => {
            void boardApi.moveCard(editingCard.id, toColumnId, 0)
            setEditingCard(null)
          }}
          onDelete={() => {
            if (window.confirm('¿Eliminar esta tarjeta?')) {
              void boardApi.deleteCard(editingCard.id)
              setEditingCard(null)
            }
          }}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  )
}
