import type { OllamaStatus, Plan } from '@agenkan/shared'
import { PlanSchema } from '@agenkan/shared'
import { Ollama, type Message } from 'ollama'
import { PlanGenerationError } from '../../domain/errors.js'
import type {
  AiPlanner,
  AiPlanResult,
  PlanningContext
} from '../../domain/services/ai-planner.js'
import type { SettingsRepository } from '../../domain/repositories/settings-repository.js'
import { PLAN_JSON_SCHEMA } from './plan-json-schema.js'
import {
  buildRetryPrompt,
  buildSystemPrompt,
  buildUserPrompt
} from './prompts.js'

const MAX_ATTEMPTS = 2

/**
 * AiPlanner backed by a local Ollama instance.
 *
 * Reliability comes from three layers:
 *  1. structured outputs (`format` = JSON Schema) constrain decoding,
 *  2. zod validates the business rules the schema can't express,
 *  3. on validation failure, one retry feeds the exact error back to the model.
 */
export class OllamaPlanner implements AiPlanner {
  constructor(private readonly settings: SettingsRepository) {}

  async generatePlan(context: PlanningContext): Promise<AiPlanResult> {
    const { ollamaUrl, ollamaModel } = this.settings.get()
    const client = new Ollama({ host: ollamaUrl })

    const messages: Message[] = [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(context) }
    ]

    let lastError = ''
    let lastResponse = ''

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const response = await client.chat({
        model: ollamaModel,
        messages,
        format: PLAN_JSON_SCHEMA,
        options: { temperature: 0.1, num_predict: 4096 }
      })
      lastResponse = response.message.content

      const result = this.parsePlan(lastResponse)
      if (result.ok) {
        return {
          plan: result.plan,
          rawResponse: lastResponse,
          model: ollamaModel
        }
      }

      lastError = result.error
      messages.push(
        { role: 'assistant', content: lastResponse },
        { role: 'user', content: buildRetryPrompt(result.error) }
      )
    }

    throw new PlanGenerationError(
      `El modelo no produjo un plan válido tras ${MAX_ATTEMPTS} intentos. Último error: ${lastError}`,
      lastResponse
    )
  }

  async checkStatus(): Promise<OllamaStatus> {
    const { ollamaUrl, ollamaModel } = this.settings.get()
    try {
      const client = new Ollama({ host: ollamaUrl })
      const { models } = await client.list()
      const names = models.map((model) => model.name)
      const modelAvailable = names.some(
        (name) => name === ollamaModel || name.split(':')[0] === ollamaModel
      )
      return {
        reachable: true,
        modelAvailable,
        models: names,
        message: modelAvailable
          ? `Modelo "${ollamaModel}" disponible`
          : `Modelo "${ollamaModel}" no encontrado en Ollama`
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        reachable: false,
        modelAvailable: false,
        models: [],
        message: `No se pudo conectar a Ollama (${ollamaUrl}): ${message}`
      }
    }
  }

  async listModels(): Promise<string[]> {
    const status = await this.checkStatus()
    return status.models
  }

  private parsePlan(
    raw: string
  ): { ok: true; plan: Plan } | { ok: false; error: string } {
    try {
      const plan = PlanSchema.parse(JSON.parse(raw))
      return { ok: true, plan }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, error: message }
    }
  }
}
