import { z } from 'zod'

export const ExecutionStatusSchema = z.enum(['success', 'error'])

/** Audit trail of a planning run: what the model returned and what happened. */
export const ExecutionLogSchema = z.object({
  id: z.string().uuid(),
  noteId: z.string().uuid(),
  model: z.string(),
  status: ExecutionStatusSchema,
  summary: z.string(),
  rawResponse: z.string(),
  createdAt: z.string().datetime()
})

export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>
export type ExecutionLog = z.infer<typeof ExecutionLogSchema>
