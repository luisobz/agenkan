import { Badge } from '@agenkan/ui'
import type { Plan } from '@agenkan/shared'
import { PriorityBadge } from '../kanban/PriorityBadge.js'

export interface PlanPreviewProps {
  plan: Plan
  model: string
}

export function PlanPreview({ plan, model }: PlanPreviewProps) {
  return (
    <div className="plan-preview">
      <p className="plan-preview__summary">{plan.summary}</p>
      <p className="plan-preview__board">
        Tablero: <strong>{plan.boardName}</strong>
        <span className="plan-preview__model">modelo: {model}</span>
      </p>

      <ul className="plan-preview__cards">
        {plan.cards.map((card, index) => (
          <li key={index} className="plan-preview__card">
            <div className="plan-preview__card-header">
              <span className="plan-preview__card-title">{card.title}</span>
              <PriorityBadge priority={card.priority} />
            </div>
            {card.description && (
              <p className="plan-preview__card-description">{card.description}</p>
            )}
            {card.labels.length > 0 && (
              <div className="plan-preview__card-labels">
                {card.labels.map((label) => (
                  <Badge key={label} tone="accent">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
