import type { Plan } from '@agenkan/shared'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { PlanPreview } from './PlanPreview.js'

const plan: Plan = {
  summary: 'Plan para lanzar la web',
  boardName: 'Lanzamiento web',
  cards: [
    {
      title: 'Comprar dominio',
      description: 'Antes de fin de mes',
      labels: ['infraestructura'],
      priority: 3
    },
    {
      title: 'Avisar a marketing',
      description: '',
      labels: [],
      priority: 0
    }
  ]
}

test('renders the summary, board name and every card', () => {
  render(<PlanPreview plan={plan} model="qwen3:8b" />)

  expect(screen.getByText('Plan para lanzar la web')).toBeDefined()
  expect(screen.getByText('Lanzamiento web')).toBeDefined()
  expect(screen.getByText('Comprar dominio')).toBeDefined()
  expect(screen.getByText('Avisar a marketing')).toBeDefined()
  expect(screen.getByText('modelo: qwen3:8b')).toBeDefined()
})

test('shows labels and priority, and hides empty descriptions', () => {
  render(<PlanPreview plan={plan} model="qwen3:8b" />)

  expect(screen.getByText('infraestructura')).toBeDefined()
  expect(screen.getByText('Alta')).toBeDefined()
  expect(screen.getByText('Antes de fin de mes')).toBeDefined()
  // The second card has no description and priority 0 → no badge, no paragraph.
  expect(screen.queryByText('Baja')).toBeNull()
})
