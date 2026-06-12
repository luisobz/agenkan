import type { Note } from '@agenkan/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { NoteList } from './NoteList.js'

function makeNote(overrides: Partial<Note>): Note {
  return {
    id: crypto.randomUUID(),
    title: 'Nota',
    content: '',
    status: 'draft',
    boardId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

const notes = [
  makeNote({ title: 'Compra semanal', content: 'leche, pan' }),
  makeNote({
    title: 'Proyecto web',
    content: 'migrar el dns',
    status: 'planned'
  })
]

test('renders every note with its status badge', () => {
  render(
    <NoteList
      notes={notes}
      activeNoteId={null}
      onSelect={() => {}}
      onCreate={() => {}}
    />
  )

  expect(screen.getByText('Compra semanal')).toBeDefined()
  expect(screen.getByText('Proyecto web')).toBeDefined()
  expect(screen.getByText('Borrador')).toBeDefined()
  expect(screen.getByText('Planificada')).toBeDefined()
})

test('filters by title and content', async () => {
  const user = userEvent.setup()
  render(
    <NoteList
      notes={notes}
      activeNoteId={null}
      onSelect={() => {}}
      onCreate={() => {}}
    />
  )

  await user.type(screen.getByPlaceholderText('Buscar notas...'), 'dns')

  expect(screen.queryByText('Compra semanal')).toBeNull()
  expect(screen.getByText('Proyecto web')).toBeDefined()
})

test('shows an empty state when the search has no results', async () => {
  const user = userEvent.setup()
  render(
    <NoteList
      notes={notes}
      activeNoteId={null}
      onSelect={() => {}}
      onCreate={() => {}}
    />
  )

  await user.type(screen.getByPlaceholderText('Buscar notas...'), 'zzz')
  expect(screen.getByText('Sin resultados')).toBeDefined()
})

test('selecting a note calls onSelect with it', async () => {
  const user = userEvent.setup()
  const onSelect = vi.fn()
  render(
    <NoteList
      notes={notes}
      activeNoteId={null}
      onSelect={onSelect}
      onCreate={() => {}}
    />
  )

  await user.click(screen.getByText('Compra semanal'))
  expect(onSelect).toHaveBeenCalledWith(notes[0])
})
