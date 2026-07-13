import type {
  ApplyPlanRequest,
  ApplyPlanResponse,
  Board,
  BoardDetail,
  BoardSummary,
  Card,
  CardInput,
  CardMove,
  CardUpdate,
  Column,
  ExecutionLog,
  GeneratePlanRequest,
  GeneratePlanResponse,
  Note,
  NoteInput,
  OllamaStatus,
  ServerSettings,
  ServerSettingsUpdate
} from '@agenkan/shared'
import type { ConnectionConfig } from './connection-storage.js'

/** Thrown on 401 so the UI can drop back to the connection screen. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Contraseña incorrecta o sesión no válida')
    this.name = 'UnauthorizedError'
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

/** Typed HTTP client for the AgenKan API. One instance per connection. */
export class ApiClient {
  constructor(private readonly connection: ConnectionConfig) {}

  /* ── Auth ── */

  verify(): Promise<{ authenticated: boolean }> {
    return this.request('POST', '/api/auth/verify')
  }

  /* ── Notes ── */

  listNotes(): Promise<Note[]> {
    return this.request('GET', '/api/notes')
  }

  createNote(input: NoteInput): Promise<Note> {
    return this.request('POST', '/api/notes', input)
  }

  updateNote(id: string, input: NoteInput): Promise<Note> {
    return this.request('PUT', `/api/notes/${id}`, input)
  }

  deleteNote(id: string): Promise<void> {
    return this.request('DELETE', `/api/notes/${id}`)
  }

  /* ── Boards & cards ── */

  listBoards(): Promise<BoardSummary[]> {
    return this.request('GET', '/api/boards')
  }

  getBoard(id: string): Promise<BoardDetail> {
    return this.request('GET', `/api/boards/${id}`)
  }

  createBoard(name: string): Promise<BoardDetail> {
    return this.request('POST', '/api/boards', { name })
  }

  renameBoard(id: string, name: string): Promise<Board> {
    return this.request('PATCH', `/api/boards/${id}`, { name })
  }

  deleteBoard(id: string): Promise<void> {
    return this.request('DELETE', `/api/boards/${id}`)
  }

  addColumn(boardId: string, name: string): Promise<Column> {
    return this.request('POST', `/api/boards/${boardId}/columns`, { name })
  }

  renameColumn(columnId: string, name: string): Promise<Column> {
    return this.request('PATCH', `/api/columns/${columnId}`, { name })
  }

  deleteColumn(columnId: string): Promise<void> {
    return this.request('DELETE', `/api/columns/${columnId}`)
  }

  createCard(input: CardInput): Promise<Card> {
    return this.request('POST', '/api/cards', input)
  }

  updateCard(id: string, update: CardUpdate): Promise<Card> {
    return this.request('PATCH', `/api/cards/${id}`, update)
  }

  moveCard(id: string, move: CardMove): Promise<Card> {
    return this.request('POST', `/api/cards/${id}/move`, move)
  }

  deleteCard(id: string): Promise<void> {
    return this.request('DELETE', `/api/cards/${id}`)
  }

  /* ── Planner ── */

  generatePlan(request: GeneratePlanRequest): Promise<GeneratePlanResponse> {
    return this.request('POST', '/api/planner/generate', request)
  }

  applyPlan(request: ApplyPlanRequest): Promise<ApplyPlanResponse> {
    return this.request('POST', '/api/planner/apply', request)
  }

  listLogs(noteId?: string): Promise<ExecutionLog[]> {
    const query = noteId ? `?noteId=${noteId}` : ''
    return this.request('GET', `/api/logs${query}`)
  }

  /* ── Settings ── */

  getSettings(): Promise<ServerSettings> {
    return this.request('GET', '/api/settings')
  }

  updateSettings(patch: ServerSettingsUpdate): Promise<ServerSettings> {
    return this.request('PATCH', '/api/settings', patch)
  }

  getOllamaStatus(): Promise<OllamaStatus> {
    return this.request('GET', '/api/settings/ollama-status')
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.connection.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.connection.password}`,
        ...(body !== undefined && { 'Content-Type': 'application/json' })
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    })

    if (response.status === 401) throw new UnauthorizedError()

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message =
        errorBody && typeof errorBody === 'object' && 'message' in errorBody
          ? String(errorBody.message)
          : `Error ${response.status}`
      throw new ApiRequestError(message, response.status, errorBody)
    }

    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }
}
