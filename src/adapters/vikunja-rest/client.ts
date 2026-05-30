import type {
  VikunjaClient,
  VikunjaProject,
  VikunjaTask,
  VikunjaLabel,
  VikunjaComment,
  CreateProjectInput,
  CreateTaskInput,
  UpdateTaskInput
} from '@shared/schemas/vikunja'

export class VikunjaRestClient implements VikunjaClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    // Remove trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.token = token
  }

  updateConfig(baseUrl: string, token: string): void {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.token = token
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `Vikunja API error ${response.status} on ${method} ${path}: ${errorText}`
      )
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.request('GET', '/projects')
      return { ok: true, message: 'Conexión exitosa con Vikunja' }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      return { ok: false, message: msg }
    }
  }

  async listProjects(): Promise<VikunjaProject[]> {
    return this.request<VikunjaProject[]>('GET', '/projects')
  }

  async createProject(input: CreateProjectInput): Promise<VikunjaProject> {
    return this.request<VikunjaProject>('PUT', '/projects', {
      title: input.title,
      description: input.description ?? ''
    })
  }

  async createTask(
    projectId: number,
    input: CreateTaskInput
  ): Promise<VikunjaTask> {
    return this.request<VikunjaTask>(
      'PUT',
      `/projects/${projectId}/tasks`,
      {
        title: input.title,
        description: input.description ?? '',
        priority: input.priority ?? 0
      }
    )
  }

  async updateTask(
    taskId: number,
    input: UpdateTaskInput
  ): Promise<VikunjaTask> {
    return this.request<VikunjaTask>('POST', `/tasks/${taskId}`, input)
  }

  async addComment(taskId: number, body: string): Promise<VikunjaComment> {
    return this.request<VikunjaComment>(
      'PUT',
      `/tasks/${taskId}/comments`,
      { comment: body }
    )
  }

  async listLabels(): Promise<VikunjaLabel[]> {
    return this.request<VikunjaLabel[]>('GET', '/labels')
  }

  async createLabel(
    title: string,
    hexColor: string = '#6c63ff'
  ): Promise<VikunjaLabel> {
    return this.request<VikunjaLabel>('PUT', '/labels', {
      title,
      hex_color: hexColor
    })
  }

  async addLabelToTask(taskId: number, labelId: number): Promise<void> {
    await this.request('PUT', `/tasks/${taskId}/labels`, {
      label_id: labelId
    })
  }
}
