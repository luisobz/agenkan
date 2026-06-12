import { z } from 'zod'

/** 0 = none, 1 = low, 2 = medium, 3 = high */
export const CardPrioritySchema = z.number().int().min(0).max(3)

export const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120),
  createdAt: z.string().datetime()
})

export const ColumnSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string().min(1).max(60),
  position: z.number().int().min(0)
})

export const CardSchema = z.object({
  id: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(10_000),
  labels: z.array(z.string().min(1).max(40)).max(10),
  priority: CardPrioritySchema,
  position: z.number().int().min(0),
  /** Note this card was generated from, if it came from the AI planner. */
  noteId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

/** A column together with its ordered cards, as rendered by the board view. */
export const ColumnWithCardsSchema = ColumnSchema.extend({
  cards: z.array(CardSchema)
})

/** Full board payload: everything the kanban view needs in one request. */
export const BoardDetailSchema = BoardSchema.extend({
  columns: z.array(ColumnWithCardsSchema)
})

export const BoardSummarySchema = BoardSchema.extend({
  cardCount: z.number().int().min(0)
})

/* ── Inputs ── */

export const BoardInputSchema = z.object({
  name: z.string().min(1).max(120)
})

export const ColumnInputSchema = z.object({
  name: z.string().min(1).max(60)
})

export const CardInputSchema = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).default(''),
  labels: z.array(z.string().min(1).max(40)).max(10).default([]),
  priority: CardPrioritySchema.default(0)
})

export const CardUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).optional(),
  labels: z.array(z.string().min(1).max(40)).max(10).optional(),
  priority: CardPrioritySchema.optional()
})

export const CardMoveSchema = z.object({
  toColumnId: z.string().uuid(),
  /** Index inside the target column where the card should land. */
  position: z.number().int().min(0)
})

export type CardPriority = z.infer<typeof CardPrioritySchema>
export type Board = z.infer<typeof BoardSchema>
export type Column = z.infer<typeof ColumnSchema>
export type Card = z.infer<typeof CardSchema>
export type ColumnWithCards = z.infer<typeof ColumnWithCardsSchema>
export type BoardDetail = z.infer<typeof BoardDetailSchema>
export type BoardSummary = z.infer<typeof BoardSummarySchema>
export type BoardInput = z.infer<typeof BoardInputSchema>
export type ColumnInput = z.infer<typeof ColumnInputSchema>
export type CardInput = z.infer<typeof CardInputSchema>
export type CardUpdate = z.infer<typeof CardUpdateSchema>
export type CardMove = z.infer<typeof CardMoveSchema>
