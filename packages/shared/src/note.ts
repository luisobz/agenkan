import { z } from 'zod'

/** Lifecycle of a note: a draft becomes "planned" once its plan is applied to a board. */
export const NoteStatusSchema = z.enum(['draft', 'planned'])

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string(),
  status: NoteStatusSchema,
  /** Board the note was planned into, if any. */
  boardId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const NoteInputSchema = z.object({
  title: z.string().min(1).max(200).default('Sin título'),
  content: z.string().max(50_000).default('')
})

export type NoteStatus = z.infer<typeof NoteStatusSchema>
export type Note = z.infer<typeof NoteSchema>
export type NoteInput = z.infer<typeof NoteInputSchema>
