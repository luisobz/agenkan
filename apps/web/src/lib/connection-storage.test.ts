import { beforeEach, expect, test } from 'vitest'
import {
  clearConnection,
  loadConnection,
  saveConnection
} from './connection-storage.js'

beforeEach(() => {
  localStorage.clear()
})

test('stores the endpoint but never stores the password', () => {
  saveConnection('http://server:3210')
  expect(loadConnection()).toBe('http://server:3210')
  expect(localStorage.getItem('agenkan.endpoint')).toBe('http://server:3210')
  expect(localStorage.getItem('agenkan.connection')).toBeNull()
})

test('returns null when nothing is stored', () => {
  expect(loadConnection()).toBeNull()
})

test('returns null on corrupted or incomplete data', () => {
  localStorage.setItem('agenkan.connection', 'not-json')
  expect(loadConnection()).toBeNull()

  localStorage.setItem('agenkan.connection', JSON.stringify({ baseUrl: 1 }))
  expect(loadConnection()).toBeNull()
  expect(localStorage.getItem('agenkan.connection')).toBeNull()
})

test('clearConnection removes the stored config', () => {
  saveConnection('http://server:3210')
  clearConnection()
  expect(loadConnection()).toBeNull()
})

test('removes a legacy saved password without loading or persisting it', () => {
  localStorage.setItem(
    'agenkan.connection',
    JSON.stringify({ baseUrl: 'http://server:3210', password: 'legacy-secret' })
  )

  expect(loadConnection()).toBeNull()
  expect(localStorage.getItem('agenkan.connection')).toBeNull()
  expect(localStorage.getItem('agenkan.endpoint')).toBeNull()
})
