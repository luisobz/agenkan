import { PlanSchema, type Plan } from '@shared/schemas/plan'
import type { VikunjaProject } from '@shared/schemas/vikunja'
import { OllamaAdapter } from '../adapters/ollama/client'
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildRetryPrompt
} from '../adapters/ollama/prompts'

export interface PlannerResult {
  success: boolean
  plan?: Plan
  error?: string
  rawResponse?: string
}

/**
 * Extracts JSON from a response that might contain markdown fences or extra text.
 */
function extractJson(raw: string): string {
  // Try to extract from markdown code block
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try to find a JSON object
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1)
  }

  return raw.trim()
}

/**
 * Parse and validate the AI response as a Plan.
 */
function parseAndValidate(raw: string): Plan {
  const jsonStr = extractJson(raw)
  const parsed = JSON.parse(jsonStr)
  return PlanSchema.parse(parsed)
}

/**
 * Generate a structured plan from a note using the AI.
 * Implements retry logic: if the first attempt fails, sends a correction prompt.
 * If the retry also fails, returns an error.
 */
export async function generatePlan(
  ollama: OllamaAdapter,
  noteContent: string,
  projects: VikunjaProject[],
  mode: 'create' | 'existing' | 'management'
): Promise<PlannerResult> {
  const systemPrompt = buildSystemPrompt(projects, mode)
  const userPrompt = buildUserPrompt(noteContent)

  let rawResponse = ''

  try {
    // First attempt
    rawResponse = await ollama.chat(systemPrompt, userPrompt)
    const plan = parseAndValidate(rawResponse)
    return { success: true, plan, rawResponse }
  } catch (firstError) {
    const firstErrorMsg =
      firstError instanceof Error ? firstError.message : String(firstError)

    console.warn('[Planner] First attempt failed:', firstErrorMsg)

    // Retry once with correction prompt
    try {
      const retryPrompt = buildRetryPrompt(rawResponse, firstErrorMsg)
      const retryResponse = await ollama.retry(
        systemPrompt,
        userPrompt,
        rawResponse,
        retryPrompt
      )
      rawResponse = retryResponse
      const plan = parseAndValidate(retryResponse)
      return { success: true, plan, rawResponse }
    } catch (retryError) {
      const retryErrorMsg =
        retryError instanceof Error ? retryError.message : String(retryError)

      console.error('[Planner] Retry also failed:', retryErrorMsg)

      return {
        success: false,
        error: `No se pudo generar un plan válido después de 2 intentos.\n\nError: ${retryErrorMsg}`,
        rawResponse
      }
    }
  }
}
