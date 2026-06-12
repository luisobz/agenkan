import type { GeneratePlanRequest, GeneratePlanResponse } from '@agenkan/shared'
import { NotFoundError } from '../errors.js'
import type { BoardRepository } from '../repositories/board-repository.js'
import type { NoteRepository } from '../repositories/note-repository.js'
import type { AiPlanner, PlanningContext } from './ai-planner.js'

/**
 * Orchestrates plan generation: loads the note, gathers context about the
 * destination board and delegates the actual inference to the AiPlanner port.
 */
export class PlannerService {
  constructor(
    private readonly notes: NoteRepository,
    private readonly boards: BoardRepository,
    private readonly aiPlanner: AiPlanner
  ) {}

  async generate(request: GeneratePlanRequest): Promise<GeneratePlanResponse> {
    const note = this.notes.get(request.noteId)
    if (!note) throw new NotFoundError('Nota', request.noteId)

    const context: PlanningContext = {
      noteTitle: note.title,
      noteContent: note.content,
      targetBoard: this.resolveTargetBoard(request)
    }

    return this.aiPlanner.generatePlan(context)
  }

  private resolveTargetBoard(
    request: GeneratePlanRequest
  ): PlanningContext['targetBoard'] {
    if (request.target.mode !== 'existing') return null

    const board = this.boards.getBoard(request.target.boardId)
    if (!board) throw new NotFoundError('Tablero', request.target.boardId)

    return {
      name: board.name,
      labels: this.boards.listLabels(board.id)
    }
  }
}
