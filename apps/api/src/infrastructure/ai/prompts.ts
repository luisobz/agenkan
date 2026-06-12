import type { PlanningContext } from '../../domain/services/ai-planner.js'

const FEW_SHOT_NOTE = `Título: Lanzamiento web
Mudar la landing antes de fin de mes. Falta comprar el dominio (urgente),
migrar el DNS y avisar a marketing para que prepare el anuncio. Revisar
también si el certificado SSL caduca.`

const FEW_SHOT_PLAN = `{
  "summary": "Plan para mudar la landing: compra de dominio, migración de DNS, coordinación con marketing y revisión del SSL.",
  "boardName": "Lanzamiento web",
  "cards": [
    {
      "title": "Comprar el dominio nuevo",
      "description": "Necesario antes de fin de mes para poder mudar la landing.",
      "labels": ["infraestructura"],
      "priority": 3
    },
    {
      "title": "Migrar el DNS al dominio nuevo",
      "description": "Depende de la compra del dominio.",
      "labels": ["infraestructura"],
      "priority": 2
    },
    {
      "title": "Avisar a marketing para preparar el anuncio",
      "description": "",
      "labels": ["comunicación"],
      "priority": 2
    },
    {
      "title": "Revisar la caducidad del certificado SSL",
      "description": "Comprobar la fecha de expiración y renovarlo si hace falta.",
      "labels": ["infraestructura"],
      "priority": 1
    }
  ]
}`

/**
 * System prompt for the planner. Static rules live here; per-request data
 * (the note, the destination board) goes in the user message so the model
 * separates instructions from content cleanly.
 */
export function buildSystemPrompt(): string {
  return `Eres el planificador de AgenKan, un bloc de notas con tablero kanban integrado.
Tu único trabajo: convertir una nota de texto libre en tarjetas kanban accionables.

CRITERIOS PARA LAS TARJETAS:
- Cada tarjeta es UNA acción concreta y autocontenida. Empieza el título con un verbo.
- Extrae solo lo que está en la nota. No inventes tareas, fechas ni datos.
- Si la nota menciona varias cosas en una frase, sepáralas en tarjetas distintas.
- Usa "description" para contexto relevante de la nota; déjala vacía si no aporta nada.
- "labels": 0-3 etiquetas cortas en minúsculas que agrupen tarjetas relacionadas.
  Si te doy etiquetas existentes del tablero, reutilízalas antes de crear nuevas.
- "priority": 3 solo si la nota lo marca como urgente/crítico; 2 importante;
  1 secundario; 0 si la nota no da señales de prioridad.
- "boardName": nombre corto (2-4 palabras) que represente el tema global de la nota.
- Escribe TODO en el mismo idioma que la nota.

EJEMPLO
Nota:
${FEW_SHOT_NOTE}

Plan correcto:
${FEW_SHOT_PLAN}

Responde únicamente con el JSON del plan.`
}

/** User message: the destination board context plus the note itself. */
export function buildUserPrompt(context: PlanningContext): string {
  const boardSection = context.targetBoard
    ? `DESTINO: tablero existente "${context.targetBoard.name}".
Etiquetas ya usadas en ese tablero: ${
        context.targetBoard.labels.length > 0
          ? context.targetBoard.labels.join(', ')
          : '(ninguna)'
      }.
En "boardName" repite el nombre del tablero destino.`
    : `DESTINO: tablero nuevo. Propón en "boardName" un nombre corto y descriptivo.`

  return `${boardSection}

NOTA A PLANIFICAR
Título: ${context.noteTitle}
${context.noteContent}`
}

/** Follow-up sent when the previous answer failed schema validation. */
export function buildRetryPrompt(validationError: string): string {
  return `Tu respuesta no cumple el esquema del plan. Error de validación:
${validationError}

Corrige el problema y devuelve de nuevo el plan completo. Solo el JSON.`
}
