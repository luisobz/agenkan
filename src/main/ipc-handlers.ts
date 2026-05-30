import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import {
  listNotes,
  getNote,
  saveNote,
  deleteNote,
  getSettings,
  saveSettings,
  saveExecutionLog,
  listExecutionLogs,
  saveNoteTaskLink,
  getNoteTaskLinks
} from './database'
import { VikunjaRestClient } from '../adapters/vikunja-rest/client'
import { OllamaAdapter } from '../adapters/ollama/client'
import { generatePlan } from '../domain/planner'
import { executePlan } from '../domain/executor'
import type { Settings } from '@shared/schemas/settings'
import type { Plan } from '@shared/schemas/plan'
import type { VikunjaProject } from '@shared/schemas/vikunja'

let vikunjaClient: VikunjaRestClient
let ollamaAdapter: OllamaAdapter

function ensureClients(): void {
  const settings = getSettings()

  if (!vikunjaClient) {
    vikunjaClient = new VikunjaRestClient(
      settings.vikunjaApiUrl,
      settings.vikunjaApiToken
    )
  }

  // We will dynamically update the token based on the action mode when needed.
  // By default, just use the fallback token.
  vikunjaClient.updateConfig(settings.vikunjaApiUrl, settings.vikunjaApiToken)

  if (!ollamaAdapter) {
    ollamaAdapter = new OllamaAdapter({
      baseUrl: settings.ollamaUrl,
      model: settings.ollamaModel
    })
  } else {
    ollamaAdapter.updateConfig({
      baseUrl: settings.ollamaUrl,
      model: settings.ollamaModel
    })
  }
}

export function registerIpcHandlers(): void {
  /* ── Notes ── */

  ipcMain.handle('notes:list', () => {
    return listNotes()
  })

  ipcMain.handle('notes:get', (_event, id: string) => {
    return getNote(id)
  })

  ipcMain.handle(
    'notes:save',
    (_event, note: { id?: string; title: string; content: string }) => {
      const id = note.id ?? randomUUID()
      return saveNote({ id, title: note.title, content: note.content })
    }
  )

  ipcMain.handle('notes:delete', (_event, id: string) => {
    deleteNote(id)
    return { success: true }
  })

  /* ── Settings ── */

  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:save', (_event, settings: Settings) => {
    saveSettings(settings)
    ensureClients()
    return { success: true }
  })

  /* ── Vikunja ── */

  ipcMain.handle('vikunja:list-projects', async () => {
    ensureClients()
    return vikunjaClient.listProjects()
  })

  ipcMain.handle('vikunja:test-connection', async () => {
    ensureClients()
    return vikunjaClient.testConnection()
  })

  /* ── Ollama ── */

  ipcMain.handle('ollama:test-connection', async () => {
    ensureClients()
    return ollamaAdapter.testConnection()
  })

  ipcMain.handle('ollama:list-models', async () => {
    ensureClients()
    return ollamaAdapter.listModels()
  })

  /* ── Planner ── */

  ipcMain.handle(
    'planner:generate-plan',
    async (_event, noteContent: string, mode: 'create' | 'existing' | 'management') => {
      ensureClients()
      const settings = getSettings()
      
      let token = settings.vikunjaApiToken
      if (mode === 'create' && settings.vikunjaApiTokenCreate) token = settings.vikunjaApiTokenCreate
      if (mode === 'existing' && settings.vikunjaApiTokenExisting) token = settings.vikunjaApiTokenExisting
      if (mode === 'management' && settings.vikunjaApiTokenManagement) token = settings.vikunjaApiTokenManagement
      
      vikunjaClient.updateConfig(settings.vikunjaApiUrl, token)

      let projects: VikunjaProject[] = []
      try {
        projects = await vikunjaClient.listProjects()
      } catch (err: any) {
        return { success: false, error: 'Error de conexión con Vikunja (¿Token inválido?): ' + err.message }
      }
      return generatePlan(ollamaAdapter, noteContent, projects, mode)
    }
  )

  /* ── Executor ── */

  ipcMain.handle(
    'executor:execute-plan',
    async (_event, plan: Plan, noteId: string, mode: 'create' | 'existing' | 'management', rawResponse?: string, modelUsed?: string) => {
      ensureClients()
      const settings = getSettings()
      
      let token = settings.vikunjaApiToken
      if (mode === 'create' && settings.vikunjaApiTokenCreate) token = settings.vikunjaApiTokenCreate
      if (mode === 'existing' && settings.vikunjaApiTokenExisting) token = settings.vikunjaApiTokenExisting
      if (mode === 'management' && settings.vikunjaApiTokenManagement) token = settings.vikunjaApiTokenManagement
      
      vikunjaClient.updateConfig(settings.vikunjaApiUrl, token)

      const { results, projectId } = await executePlan(vikunjaClient, plan)

      // Determine overall status
      const allSuccess = results.every((r) => r.success)
      const anySuccess = results.some((r) => r.success)
      const status = allSuccess ? 'success' : anySuccess ? 'partial' : 'error'

      // Save execution log
      const logId = randomUUID()
      saveExecutionLog({
        id: logId,
        noteId,
        planJson: JSON.stringify(plan),
        resultJson: JSON.stringify(results),
        status,
        projectId,
        rawResponse,
        modelUsed
      })

      // Save note-task links for created tasks
      for (const result of results) {
        if (
          result.success &&
          result.actionType === 'create_task' &&
          result.vikunjaId
        ) {
          saveNoteTaskLink({
            id: randomUUID(),
            noteId,
            vikunjaTaskId: result.vikunjaId,
            vikunjaProjectId: projectId,
            taskTitle: result.message
          })
        }
      }

      if (anySuccess) {
        const note = getNote(noteId)
        if (note) {
          saveNote({ ...note, isLaunched: true })
        }
      }

      return { results, status, projectId }
    }
  )

  /* ── Logs ── */

  ipcMain.handle('logs:list', (_event, options?: { noteId?: string; limit?: number; offset?: number }) => {
    return listExecutionLogs(options)
  })

  /* ── Note-Task Links ── */

  ipcMain.handle('links:get', (_event, noteId: string) => {
    return getNoteTaskLinks(noteId)
  })
}
