import { z } from 'zod'

/* ── Vikunja API response schemas ── */

export const VikunjaProjectSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().default(''),
  is_archived: z.boolean().default(false),
  created: z.string().optional(),
  updated: z.string().optional()
})

export const VikunjaTaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().default(''),
  priority: z.number().int().default(0),
  project_id: z.number().int().positive(),
  created: z.string().optional(),
  updated: z.string().optional()
})

export const VikunjaLabelSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  hex_color: z.string().default('')
})

export const VikunjaCommentSchema = z.object({
  id: z.number().int().positive(),
  comment: z.string(),
  created: z.string().optional()
})

/* ── Input schemas for API calls ── */

export const CreateProjectInputSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional()
})

export const CreateTaskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  priority: z.number().int().min(0).max(5).optional()
})

export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional()
})

/* ── Client interface (adapter pattern) ── */

export interface VikunjaClient {
  listProjects(): Promise<VikunjaProject[]>
  createProject(input: CreateProjectInput): Promise<VikunjaProject>
  createTask(projectId: number, input: CreateTaskInput): Promise<VikunjaTask>
  updateTask(taskId: number, input: UpdateTaskInput): Promise<VikunjaTask>
  addComment(taskId: number, body: string): Promise<VikunjaComment>
  listLabels(): Promise<VikunjaLabel[]>
  createLabel(title: string, hexColor?: string): Promise<VikunjaLabel>
  addLabelToTask(taskId: number, labelId: number): Promise<void>
}

export type VikunjaProject = z.infer<typeof VikunjaProjectSchema>
export type VikunjaTask = z.infer<typeof VikunjaTaskSchema>
export type VikunjaLabel = z.infer<typeof VikunjaLabelSchema>
export type VikunjaComment = z.infer<typeof VikunjaCommentSchema>
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>
