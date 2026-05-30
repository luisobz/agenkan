import { Ollama } from 'ollama'

export interface OllamaClientConfig {
  baseUrl: string
  model: string
}

export class OllamaAdapter {
  private client: Ollama
  private model: string

  constructor(config: OllamaClientConfig) {
    this.client = new Ollama({ host: config.baseUrl })
    this.model = config.model
  }

  updateConfig(config: OllamaClientConfig): void {
    this.client = new Ollama({ host: config.baseUrl })
    this.model = config.model
  }

  /**
   * Send a chat completion request and return the raw text response.
   */
  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      options: {
        temperature: 0,
        num_predict: 4096
      },
      format: 'json'
    })

    return response.message.content
  }

  /**
   * Send a follow-up message in the same conversation context.
   */
  async retry(
    systemPrompt: string,
    originalUserMessage: string,
    originalResponse: string,
    retryMessage: string
  ): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: originalUserMessage },
        { role: 'assistant', content: originalResponse },
        { role: 'user', content: retryMessage }
      ],
      options: {
        temperature: 0,
        num_predict: 4096
      },
      format: 'json'
    })

    return response.message.content
  }

  /**
   * Check if Ollama is reachable and the model is available.
   */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const models = await this.client.list()
      const available = models.models.some(
        (m) => m.name === this.model || m.name.startsWith(this.model.split(':')[0])
      )
      if (available) {
        return { ok: true, message: `Modelo "${this.model}" disponible` }
      }
      const names = models.models.map((m) => m.name).join(', ')
      return {
        ok: false,
        message: `Modelo "${this.model}" no encontrado. Disponibles: ${names}`
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      return { ok: false, message: `No se pudo conectar a Ollama: ${msg}` }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const models = await this.client.list()
      return models.models.map(m => m.name)
    } catch {
      return []
    }
  }
}
