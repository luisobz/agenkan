import type {
  Board,
  BoardDetail,
  BoardSummary,
  Card,
  CardInput,
  CardMove,
  CardUpdate,
  Column
} from '@agenkan/shared'

export interface CreateCardOptions {
  /** Note the card originates from, when created by the AI planner. */
  noteId?: string
}

export interface BoardRepository {
  listSummaries(): BoardSummary[]
  getBoard(id: string): Board | null
  getDetail(id: string): BoardDetail | null
  create(name: string, columnNames: string[]): BoardDetail
  rename(id: string, name: string): Board | null
  delete(id: string): boolean

  addColumn(boardId: string, name: string): Column
  renameColumn(columnId: string, name: string): Column | null
  deleteColumn(columnId: string): boolean

  getCard(cardId: string): Card | null
  createCard(input: CardInput, options?: CreateCardOptions): Card
  updateCard(cardId: string, update: CardUpdate): Card | null
  moveCard(cardId: string, move: CardMove): Card | null
  deleteCard(cardId: string): boolean

  /** Distinct labels already used on a board, for the AI to reuse. */
  listLabels(boardId: string): string[]
}
