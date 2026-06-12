import { beforeEach, expect, test } from 'vitest'
import {
  clearConnection,
  loadConnection,
  saveConnection
} from './connection-storage.js'

beforeEach(() => {
  localStorage.clear()
})

test('round-trips a connection config', () => {
  saveConnection({ baseUrl: 'http://server:3210', password: 'secret' })
  expect(loadConnection()).toEqual({
    baseUrl: 'http://server:3210',
    password: 'secret'
  })
})

test('returns null when nothing is stored', () => {
  expect(loadConnection()).toBeNull()
})

test('returns null on corrupted or incomplete data', () => {
  localStorage.setItem('agenkan.connection', 'not-json')
  expect(loadConnection()).toBeNull()

  localStorage.setItem('agenkan.connection', JSON.stringify({ baseUrl: 1 }))
  expect(loadConnection()).toBeNull()
})

test('clearConnection removes the stored config', () => {
  saveConnection({ baseUrl: 'http://server:3210', password: 'secret' })
  clearConnection()
  expect(loadConnection()).toBeNull()
})
