import type { VikunjaProject } from '@shared/schemas/vikunja'

/**
 * Build the system prompt for the planner.
 * Kept minimal: the AI must return ONLY valid JSON.
 */
export function buildSystemPrompt(projects: VikunjaProject[], mode: 'create' | 'existing' | 'management'): string {
  const projectList = projects
    .map((p) => `  - id: ${p.id}, title: "${p.title}"`)
    .join('\n')

  let modeSpecificRules = ''
  let targetSchema = ''
  let actionsExample = ''
  let allowedActions = ''

  if (mode === 'create') {
    modeSpecificRules = `
8. DEBES usar "mode": "new" en el target.
9. Proporciona un nombre descriptivo y profesional para el proyecto.
10. Dedúcete las tareas necesarias a partir de la nota.`
    targetSchema = `    "mode": "new",\n    "projectName": "Nombre generado para el proyecto"`
    actionsExample = `    {
      "type": "create_task",
      "title": "Título de la tarea",
      "description": "Descripción",
      "labels": ["etiqueta1"]
    }`
    allowedActions = '"create_task", "create_project"'
  } else if (mode === 'existing') {
    modeSpecificRules = `
8. DEBES elegir uno de los PROYECTOS EXISTENTES y usar "mode": "existing" en el target.
9. Mapea las tareas a ese proyecto.
10. NO inventes un ID de proyecto que no esté en la lista.`
    targetSchema = `    "mode": "existing",\n    "projectId": 123`
    actionsExample = `    {
      "type": "create_task",
      "title": "Título de la tarea"
    }`
    allowedActions = '"create_task", "update_task", "use_existing_project"'
  } else if (mode === 'management') {
    modeSpecificRules = `
8. DEBES usar "mode": "global" en el target.
9. Tu objetivo es crear etiquetas globales, actualizar configuraciones o categorizaciones.
10. Usa la acción "create_label" para crear etiquetas versátiles si la nota lo sugiere.`
    targetSchema = `    "mode": "global"`
    actionsExample = `    {
      "type": "create_label",
      "title": "Backend",
      "hexColor": "#ff0000"
    }`
    allowedActions = '"create_label", "update_task"'
  }

  return `Eres un asistente de planificación de tareas. Tu ÚNICO trabajo es convertir notas de texto libre en un plan de acciones JSON estructurado para un gestor de proyectos.

REGLAS ESTRICTAS:
1. Devuelve SOLO JSON válido. Sin texto antes ni después.
2. No incluyas markdown, backticks ni explicaciones.
3. No inventes datos que no estén en la nota.
4. Si faltan datos, usa null o arrays vacíos.
5. Prioriza crear tareas, comentarios y etiquetas.
6. NUNCA propongas acciones de tipo "delete".
7. Cada acción debe ser clara y procesable.${modeSpecificRules}

PROYECTOS EXISTENTES:
${projectList || '  (ninguno)'}

ESQUEMA DE SALIDA (cumplir exactamente):
{
  "summary": "Resumen corto del plan en 1-2 frases",
  "target": {
${targetSchema}
  },
  "actions": [
${actionsExample}
  ]
}

Tipos de acción válidos: ${allowedActions}.
Responde SOLO con el JSON.`
}

/**
 * Build the user prompt containing the note content.
 */
export function buildUserPrompt(noteContent: string): string {
  return `Analiza la siguiente nota y genera el plan de acciones JSON:\n\n---\n${noteContent}\n---`
}

/**
 * Build a retry prompt when the AI returns invalid JSON.
 */
export function buildRetryPrompt(
  originalResponse: string,
  error: string
): string {
  return `Tu respuesta anterior no es JSON válido. Error: ${error}

Respuesta incorrecta:
${originalResponse.slice(0, 500)}

Corrige y devuelve SOLO JSON válido que cumpla el esquema. Sin texto extra.`
}
