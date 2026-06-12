/**
 * JSON Schema mirror of PlanSchema (@agenkan/shared), passed to Ollama as
 * `format` so the model is constrained to valid output at decoding time.
 * Keep both in sync if the plan contract changes.
 */
export const PLAN_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Resumen del plan en 1-2 frases, en el idioma de la nota'
    },
    boardName: {
      type: 'string',
      description: 'Nombre corto y descriptivo propuesto para el tablero'
    },
    cards: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título accionable, empieza con un verbo'
          },
          description: {
            type: 'string',
            description: 'Contexto y detalles de la nota. Vacío si no hay nada que añadir'
          },
          labels: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 5,
            description: 'Etiquetas cortas en minúsculas'
          },
          priority: {
            type: 'integer',
            minimum: 0,
            maximum: 3,
            description: '0 sin prioridad, 1 baja, 2 media, 3 alta'
          }
        },
        required: ['title', 'description', 'labels', 'priority']
      }
    }
  },
  required: ['summary', 'boardName', 'cards']
} as const
