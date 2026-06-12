import { Badge, type BadgeTone } from '@agenkan/ui'
import type { CardPriority } from '@agenkan/shared'

const PRIORITY_LABELS: Record<number, { text: string; tone: BadgeTone }> = {
  1: { text: 'Baja', tone: 'neutral' },
  2: { text: 'Media', tone: 'warning' },
  3: { text: 'Alta', tone: 'danger' }
}

export function PriorityBadge({ priority }: { priority: CardPriority }) {
  const config = PRIORITY_LABELS[priority]
  if (!config) return null
  return <Badge tone={config.tone}>{config.text}</Badge>
}
