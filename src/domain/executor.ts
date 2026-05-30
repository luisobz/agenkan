import type { Plan, Action } from '@shared/schemas/plan'
import type { ActionResult } from '@shared/schemas/execution'
import type { VikunjaClient, VikunjaLabel } from '@shared/schemas/vikunja'

export interface ExecutionContext {
  projectId: number
  labelCache: Map<string, number> // label name -> label id
}

/**
 * Execute a full plan against Vikunja.
 * Returns results for each action, supporting partial success.
 */
export async function executePlan(
  client: VikunjaClient,
  plan: Plan
): Promise<{ results: ActionResult[]; projectId: number }> {
  const results: ActionResult[] = []

  // Resolve the target project
  let projectId: number

  if (plan.target.mode === 'existing') {
    projectId = plan.target.projectId
  } else if (plan.target.mode === 'new') {
    try {
      const project = await client.createProject({
        title: plan.target.projectName
      })
      projectId = project.id
      results.push({
        actionIndex: -1,
        actionType: 'create_project',
        success: true,
        message: `Proyecto "${plan.target.projectName}" creado`,
        vikunjaId: project.id
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return {
        results: [
          {
            actionIndex: -1,
            actionType: 'create_project',
            success: false,
            message: 'Error al crear el proyecto',
            error: msg
          }
        ],
        projectId: 0
      }
    }
  } else {
    // mode === 'global'
    projectId = 0
  }

  // Build a label cache for idempotent label creation
  const labelCache = new Map<string, number>()
  try {
    const existingLabels = await client.listLabels()
    for (const label of existingLabels) {
      labelCache.set(label.title.toLowerCase(), label.id)
    }
  } catch {
    // Non-fatal: we'll create labels as needed
    console.warn('[Executor] Could not fetch existing labels')
  }

  const ctx: ExecutionContext = { projectId, labelCache }

  // Execute each action
  for (let i = 0; i < plan.actions.length; i++) {
    const action = plan.actions[i]
    const result = await executeAction(client, ctx, action, i)
    results.push(result)
  }

  return { results, projectId }
}

async function executeAction(
  client: VikunjaClient,
  ctx: ExecutionContext,
  action: Action,
  index: number
): Promise<ActionResult> {
  try {
    switch (action.type) {
      case 'create_task': {
        const task = await client.createTask(ctx.projectId, {
          title: action.title,
          description: action.description,
          priority: action.priority
        })

        // Add labels
        for (const labelName of action.labels) {
          try {
            const labelId = await resolveLabel(client, ctx, labelName)
            await client.addLabelToTask(task.id, labelId)
          } catch (err) {
            console.warn(`[Executor] Failed to add label "${labelName}":`, err)
          }
        }

        // Add comments
        for (const comment of action.comments) {
          try {
            await client.addComment(task.id, comment)
          } catch (err) {
            console.warn(`[Executor] Failed to add comment:`, err)
          }
        }

        return {
          actionIndex: index,
          actionType: 'create_task',
          success: true,
          message: `Tarea "${action.title}" creada`,
          vikunjaId: task.id
        }
      }

      case 'update_task': {
        const updated = await client.updateTask(action.taskId, {
          title: action.title,
          description: action.description
        })

        if (action.labels) {
          for (const labelName of action.labels) {
            try {
              const labelId = await resolveLabel(client, ctx, labelName)
              await client.addLabelToTask(updated.id, labelId)
            } catch (err) {
              console.warn(
                `[Executor] Failed to add label "${labelName}":`,
                err
              )
            }
          }
        }

        if (action.comments) {
          for (const comment of action.comments) {
            try {
              await client.addComment(updated.id, comment)
            } catch (err) {
              console.warn(`[Executor] Failed to add comment:`, err)
            }
          }
        }

        return {
          actionIndex: index,
          actionType: 'update_task',
          success: true,
          message: `Tarea #${action.taskId} actualizada`,
          vikunjaId: updated.id
        }
      }

      case 'create_project': {
        const project = await client.createProject({
          title: action.name,
          description: action.description
        })
        return {
          actionIndex: index,
          actionType: 'create_project',
          success: true,
          message: `Proyecto "${action.name}" creado`,
          vikunjaId: project.id
        }
      }

      case 'use_existing_project': {
        return {
          actionIndex: index,
          actionType: 'use_existing_project',
          success: true,
          message: `Usando proyecto #${action.projectId}`
        }
      }

      case 'create_label': {
        const labelId = await resolveLabel(client, ctx, action.title)
        return {
          actionIndex: index,
          actionType: 'create_label',
          success: true,
          message: `Etiqueta "${action.title}" creada/resuelta`,
          vikunjaId: labelId
        }
      }

      default:
        return {
          actionIndex: index,
          actionType: 'unknown',
          success: false,
          message: 'Tipo de acción desconocido',
          error: `Unknown action type`
        }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return {
      actionIndex: index,
      actionType: action.type,
      success: false,
      message: `Error ejecutando acción "${action.type}"`,
      error: msg
    }
  }
}

/**
 * Resolve a label name to an ID, creating it if necessary.
 * Uses the label cache for idempotency.
 */
async function resolveLabel(
  client: VikunjaClient,
  ctx: ExecutionContext,
  labelName: string
): Promise<number> {
  const key = labelName.toLowerCase()
  const cached = ctx.labelCache.get(key)
  if (cached) return cached

  const label = await client.createLabel(labelName)
  ctx.labelCache.set(key, label.id)
  return label.id
}
