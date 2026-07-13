import type { OllamaStatus, Plan } from '@agenkan/shared'

/** Everything the model needs to know to turn a note into a plan. */
export interface PlanningContext {
  noteTitle: string
  noteContent: string
  /** Present when the user picked an existing board as destination. */
  targetBoard: { name: string; labels: string[] } | null
}

export interface AiPlanResult {
  plan: Plan
  rawResponse: string
  model: string
}

/** Port for the AI provider. The domain never talks to Ollama directly. */
export interface AiPlanner {
  generatePlan(context: PlanningContext): Promise<AiPlanResult>
  checkStatus(): Promise<OllamaStatus>
  listModels(): Promise<string[]>
}
