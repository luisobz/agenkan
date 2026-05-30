import { z } from 'zod'

export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).default('Sin título'),
  content: z.string().default(''),
  isLaunched: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null)
})

export const NoteDraftSchema = NoteSchema.pick({
  title: true,
  content: true
})

export type Note = z.infer<typeof NoteSchema>
export type NoteDraft = z.infer<typeof NoteDraftSchema>
