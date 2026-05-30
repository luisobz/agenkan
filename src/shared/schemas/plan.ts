import { z } from 'zod'

/* ── Individual action schemas ── */

export const CreateProjectActionSchema = z.object({
  type: z.literal('create_project'),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional()
})

export const SelectProjectActionSchema = z.object({
  type: z.literal('use_existing_project'),
  projectId: z.number().int().positive()
})

export const CreateTaskActionSchema = z.object({
  type: z.literal('create_task'),
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  priority: z.number().int().min(0).max(5).default(0),
  labels: z.array(z.string().min(1).max(40)).default([]),
  comments: z.array(z.string().min(1).max(5000)).default([])
})

export const UpdateTaskActionSchema = z.object({
  type: z.literal('update_task'),
  taskId: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional(),
  labels: z.array(z.string().min(1).max(40)).optional(),
  comments: z.array(z.string().min(1).max(5000)).optional()
})

export const CreateLabelActionSchema = z.object({
  type: z.literal('create_label'),
  title: z.string().min(1).max(40),
  hexColor: z.string().optional()
})

export const ManagementActionSchema = z.object({
  type: z.literal('management_action'),
  actionName: z.string(),
  payload: z.record(z.any()).optional()
})

export const ActionSchema = z.discriminatedUnion('type', [
  CreateProjectActionSchema,
  SelectProjectActionSchema,
  CreateTaskActionSchema,
  UpdateTaskActionSchema,
  CreateLabelActionSchema,
  ManagementActionSchema
])

/* ── Target: where actions will be executed ── */

export const PlanTargetSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('existing'),
    projectId: z.number().int().positive()
  }),
  z.object({
    mode: z.literal('new'),
    projectName: z.string().min(1).max(120)
  }),
  z.object({
    mode: z.literal('global')
  })
])

/* ── Full plan: the AI output contract ── */

export const PlanSchema = z
  .object({
    summary: z.string().min(1).max(2000),
    target: PlanTargetSchema,
    actions: z.array(ActionSchema).min(1).max(50)
  })
  .strict()

export type CreateProjectAction = z.infer<typeof CreateProjectActionSchema>
export type SelectProjectAction = z.infer<typeof SelectProjectActionSchema>
export type CreateTaskAction = z.infer<typeof CreateTaskActionSchema>
export type UpdateTaskAction = z.infer<typeof UpdateTaskActionSchema>
export type CreateLabelAction = z.infer<typeof CreateLabelActionSchema>
export type ManagementAction = z.infer<typeof ManagementActionSchema>
export type Action = z.infer<typeof ActionSchema>
export type PlanTarget = z.infer<typeof PlanTargetSchema>
export type Plan = z.infer<typeof PlanSchema>
