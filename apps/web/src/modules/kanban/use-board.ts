import type {
  BoardDetail,
  BoardSummary,
  CardInput,
  CardUpdate
} from '@agenkan/shared'
import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '../connection/connection-context.js'

export interface UseBoards {
  boards: BoardSummary[]
  loading: boolean
  refresh: () => Promise<void>
  create: (name: string) => Promise<BoardDetail>
  remove: (id: string) => Promise<void>
}

export function useBoards(): UseBoards {
  const { api } = useConnection()
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setBoards(await api.listBoards())
    setLoading(false)
  }, [api])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (name: string) => {
      const board = await api.createBoard(name)
      await refresh()
      return board
    },
    [api, refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      await api.deleteBoard(id)
      await refresh()
    },
    [api, refresh]
  )

  return { boards, loading, refresh, create, remove }
}

export interface UseBoard {
  board: BoardDetail | null
  loading: boolean
  refresh: () => Promise<void>
  moveCard: (cardId: string, toColumnId: string, position: number) => Promise<void>
  createCard: (input: CardInput) => Promise<void>
  updateCard: (cardId: string, update: CardUpdate) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  addColumn: (name: string) => Promise<void>
  renameColumn: (columnId: string, name: string) => Promise<void>
  deleteColumn: (columnId: string) => Promise<void>
}

export function useBoard(boardId: string | null): UseBoard {
  const { api } = useConnection()
  const [board, setBoard] = useState<BoardDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!boardId) {
      setBoard(null)
      return
    }
    setBoard(await api.getBoard(boardId))
  }, [api, boardId])

  useEffect(() => {
    setLoading(true)
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  /** Moves the card locally first so dragging feels instant. */
  const moveCard = useCallback(
    async (cardId: string, toColumnId: string, position: number) => {
      setBoard((current) => {
        if (!current) return current
        const card = current.columns
          .flatMap((column) => column.cards)
          .find((candidate) => candidate.id === cardId)
        if (!card) return current

        return {
          ...current,
          columns: current.columns.map((column) => {
            const without = column.cards.filter((c) => c.id !== cardId)
            if (column.id !== toColumnId) return { ...column, cards: without }
            const cards = [...without]
            cards.splice(Math.min(position, cards.length), 0, {
              ...card,
              columnId: toColumnId
            })
            return { ...column, cards }
          })
        }
      })

      await api.moveCard(cardId, { toColumnId, position })
      await refresh()
    },
    [api, refresh]
  )

  const createCard = useCallback(
    async (input: CardInput) => {
      await api.createCard(input)
      await refresh()
    },
    [api, refresh]
  )

  const updateCard = useCallback(
    async (cardId: string, update: CardUpdate) => {
      await api.updateCard(cardId, update)
      await refresh()
    },
    [api, refresh]
  )

  const deleteCard = useCallback(
    async (cardId: string) => {
      await api.deleteCard(cardId)
      await refresh()
    },
    [api, refresh]
  )

  const addColumn = useCallback(
    async (name: string) => {
      if (!boardId) return
      await api.addColumn(boardId, name)
      await refresh()
    },
    [api, boardId, refresh]
  )

  const renameColumn = useCallback(
    async (columnId: string, name: string) => {
      await api.renameColumn(columnId, name)
      await refresh()
    },
    [api, refresh]
  )

  const deleteColumn = useCallback(
    async (columnId: string) => {
      await api.deleteColumn(columnId)
      await refresh()
    },
    [api, refresh]
  )

  return {
    board,
    loading,
    refresh,
    moveCard,
    createCard,
    updateCard,
    deleteCard,
    addColumn,
    renameColumn,
    deleteColumn
  }
}
