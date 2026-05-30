import { z } from 'zod'

export const ActionResultSchema = z.object({
  actionIndex: z.number().int().min(0),
  actionType: z.string(),
  success: z.boolean(),
  message: z.string(),
  vikunjaId: z.number().int().positive().optional(),
  error: z.string().optional()
})

export const ExecutionResultSchema = z.object({
  id: z.string().uuid(),
  noteId: z.string().uuid(),
  planJson: z.string(),
  status: z.enum(['success', 'partial', 'error']),
  results: z.array(ActionResultSchema),
  projectId: z.number().int().positive().optional(),
  createdAt: z.string().datetime()
})

export const NoteTaskLinkSchema = z.object({
  id: z.string().uuid(),
  noteId: z.string().uuid(),
  vikunjaTaskId: z.number().int().positive(),
  vikunjaProjectId: z.number().int().positive(),
  taskTitle: z.string(),
  createdAt: z.string().datetime()
})

export type ActionResult = z.infer<typeof ActionResultSchema>
export type ExecutionResult = z.infer<typeof ExecutionResultSchema>
export type NoteTaskLink = z.infer<typeof NoteTaskLinkSchema>
