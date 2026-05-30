import { contextBridge, ipcRenderer } from 'electron'

const api = {
  notes: {
    list: (): Promise<unknown[]> => ipcRenderer.invoke('notes:list'),
    get: (id: string): Promise<unknown> => ipcRenderer.invoke('notes:get', id),
    save: (note: {
      id?: string
      title: string
      content: string
    }): Promise<unknown> => ipcRenderer.invoke('notes:save', note),
    delete: (id: string): Promise<unknown> =>
      ipcRenderer.invoke('notes:delete', id)
  },
  vikunja: {
    listProjects: (): Promise<unknown[]> =>
      ipcRenderer.invoke('vikunja:list-projects'),
    testConnection: (): Promise<{ ok: boolean; message: string }> =>
      ipcRenderer.invoke('vikunja:test-connection')
  },
  ollama: {
    testConnection: (): Promise<{ ok: boolean; message: string }> =>
      ipcRenderer.invoke('ollama:test-connection'),
    listModels: (): Promise<string[]> =>
      ipcRenderer.invoke('ollama:list-models')
  },
  planner: {
    generatePlan: (
      noteContent: string,
      mode: 'create' | 'existing' | 'management'
    ): Promise<unknown> => ipcRenderer.invoke('planner:generate-plan', noteContent, mode)
  },
  executor: {
    executePlan: (
      plan: unknown,
      noteId: string,
      mode: 'create' | 'existing' | 'management',
      rawResponse?: string,
      modelUsed?: string
    ): Promise<unknown> => ipcRenderer.invoke('executor:execute-plan', plan, noteId, mode, rawResponse, modelUsed)
  },
  settings: {
    get: (): Promise<unknown> => ipcRenderer.invoke('settings:get'),
    save: (settings: unknown): Promise<unknown> =>
      ipcRenderer.invoke('settings:save', settings)
  },
  logs: {
    list: (options?: { noteId?: string; limit?: number; offset?: number }): Promise<unknown[]> =>
      ipcRenderer.invoke('logs:list', options)
  },
  links: {
    get: (noteId: string): Promise<unknown[]> =>
      ipcRenderer.invoke('links:get', noteId)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
