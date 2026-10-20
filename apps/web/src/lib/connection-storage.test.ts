import { beforeEach, expect, test } from 'vitest'
import {
  clearConnection,
  loadConnection,
  saveConnection
} from './connection-storage.js'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

test('round-trips a connection config', () => {
  saveConnection({ baseUrl: 'http://server:3210', password: 'secret' })
  expect(loadConnection()).toEqual({
    baseUrl: 'http://server:3210',
    password: 'secret'
  })
  expect(localStorage.getItem('agenkan.endpoint')).toBe('http://server:3210')
  expect(localStorage.getItem('agenkan.connection')).toBeNull()
  expect(sessionStorage.getItem('agenkan.password')).toBe('secret')
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
  saveConnection({ baseUrl: 'http://server:3210', password: 'secret' })
  clearConnection()
  expect(loadConnection()).toBeNull()
})

test('migrates a legacy saved password into session storage and removes it from local storage', () => {
  localStorage.setItem(
    'agenkan.connection',
    JSON.stringify({ baseUrl: 'http://server:3210', password: 'legacy-secret' })
  )

  expect(loadConnection()).toEqual({
    baseUrl: 'http://server:3210',
    password: 'legacy-secret'
  })
  expect(localStorage.getItem('agenkan.connection')).toBeNull()
  expect(localStorage.getItem('agenkan.endpoint')).toBe('http://server:3210')
  expect(sessionStorage.getItem('agenkan.password')).toBe('legacy-secret')
})
