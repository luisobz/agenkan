import { z } from 'zod'
import { CardPrioritySchema } from './kanban.js'

/**
 * AI planner contract.
 *
 * The destination board is chosen by the USER before planning (new board or an
 * existing one), never by the model — that removes any chance of hallucinated
 * IDs. The model only proposes a board name (used when the target is a new
 * board) and the cards themselves.
 */

export const PlanTargetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('new') }),
  z.object({ mode: z.literal('existing'), boardId: z.string().uuid() })
])

export const PlanCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2_000).default(''),
  labels: z.array(z.string().min(1).max(40)).max(5).default([]),
  priority: CardPrioritySchema.default(0)
})

export const PlanSchema = z.object({
  summary: z.string().min(1).max(500),
  boardName: z.string().min(1).max(120),
  cards: z.array(PlanCardSchema).min(1).max(30)
})

/* ── API request/response shapes ── */

export const GeneratePlanRequestSchema = z.object({
  noteId: z.string().uuid(),
  target: PlanTargetSchema
})

export const GeneratePlanResponseSchema = z.object({
  plan: PlanSchema,
  rawResponse: z.string(),
  model: z.string()
})

export const ApplyPlanRequestSchema = z.object({
  noteId: z.string().uuid(),
  target: PlanTargetSchema,
  plan: PlanSchema,
  rawResponse: z.string().optional(),
  model: z.string().optional()
})

export const ApplyPlanResponseSchema = z.object({
  boardId: z.string().uuid(),
  boardName: z.string(),
  createdCardIds: z.array(z.string().uuid())
})

export type PlanTarget = z.infer<typeof PlanTargetSchema>
export type PlanCard = z.infer<typeof PlanCardSchema>
export type Plan = z.infer<typeof PlanSchema>
export type GeneratePlanRequest = z.infer<typeof GeneratePlanRequestSchema>
export type GeneratePlanResponse = z.infer<typeof GeneratePlanResponseSchema>
export type ApplyPlanRequest = z.infer<typeof ApplyPlanRequestSchema>
export type ApplyPlanResponse = z.infer<typeof ApplyPlanResponseSchema>
