import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useDebouncedCallback } from './use-debounced-callback.js'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('delays the call and only fires the latest one', () => {
  const callback = vi.fn()
  const { result } = renderHook(() => useDebouncedCallback(callback, 500))

  result.current.run('first')
  result.current.run('second')
  expect(callback).not.toHaveBeenCalled()

  vi.advanceTimersByTime(500)
  expect(callback).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith('second')
})

test('flush runs the pending call immediately', () => {
  const callback = vi.fn()
  const { result } = renderHook(() => useDebouncedCallback(callback, 500))

  result.current.run('pending')
  result.current.flush()
  expect(callback).toHaveBeenCalledWith('pending')

  // Nothing left to fire afterwards.
  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(1)
})

test('cancel drops the pending call', () => {
  const callback = vi.fn()
  const { result } = renderHook(() => useDebouncedCallback(callback, 500))

  result.current.run('dropped')
  result.current.cancel()
  vi.advanceTimersByTime(1000)
  expect(callback).not.toHaveBeenCalled()
})
