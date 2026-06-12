import type {
  ApplyPlanRequest,
  ApplyPlanResponse,
  BoardDetail
} from '@agenkan/shared'
import { NotFoundError } from '../errors.js'
import type { BoardRepository } from '../repositories/board-repository.js'
import type { ExecutionLogRepository } from '../repositories/execution-log-repository.js'
import type { NoteRepository } from '../repositories/note-repository.js'

/** Column layout every new board starts with. */
export const DEFAULT_COLUMNS = ['Por hacer', 'En curso', 'Hecho']

/**
 * Applies a user-approved plan to the kanban: resolves the destination board,
 * creates the cards in its first column and records the execution for audit.
 */
export class PlanExecutorService {
  constructor(
    private readonly notes: NoteRepository,
    private readonly boards: BoardRepository,
    private readonly logs: ExecutionLogRepository
  ) {}

  apply(request: ApplyPlanRequest): ApplyPlanResponse {
    const note = this.notes.get(request.noteId)
    if (!note) throw new NotFoundError('Nota', request.noteId)

    try {
      const board = this.resolveBoard(request)
      const firstColumn = board.columns[0]
      if (!firstColumn) {
        throw new Error(`El tablero "${board.name}" no tiene columnas`)
      }

      const createdCardIds = request.plan.cards.map(
        (card) =>
          this.boards.createCard(
            {
              columnId: firstColumn.id,
              title: card.title,
              description: card.description,
              labels: card.labels,
              priority: card.priority
            },
            { noteId: note.id }
          ).id
      )

      this.notes.markPlanned(note.id, board.id)
      this.log(request, 'success', request.plan.summary)

      return { boardId: board.id, boardName: board.name, createdCardIds }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.log(request, 'error', message)
      throw error
    }
  }

  private resolveBoard(request: ApplyPlanRequest): BoardDetail {
    if (request.target.mode === 'existing') {
      const board = this.boards.getDetail(request.target.boardId)
      if (!board) throw new NotFoundError('Tablero', request.target.boardId)
      return board
    }
    return this.boards.create(request.plan.boardName, DEFAULT_COLUMNS)
  }

  private log(
    request: ApplyPlanRequest,
    status: 'success' | 'error',
    summary: string
  ): void {
    this.logs.create({
      noteId: request.noteId,
      model: request.model ?? 'desconocido',
      status,
      summary,
      rawResponse: request.rawResponse ?? ''
    })
  }
}
