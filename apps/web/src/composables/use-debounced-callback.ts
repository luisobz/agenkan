import { useEffect, useMemo, useRef } from 'react'

/**
 * Returns a debounced version of `callback` plus a `flush` to run any pending
 * call immediately (e.g. before navigating away). The latest callback is
 * always used, so it can safely capture fresh state.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): { run: (...args: Args) => void; flush: () => void; cancel: () => void } {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const state = useRef<{ timer: number | null; args: Args | null }>({
    timer: null,
    args: null
  })

  const api = useMemo(() => {
    const cancel = () => {
      if (state.current.timer !== null) {
        window.clearTimeout(state.current.timer)
        state.current.timer = null
      }
    }

    const flush = () => {
      if (state.current.timer !== null && state.current.args !== null) {
        const args = state.current.args
        cancel()
        state.current.args = null
        callbackRef.current(...args)
      }
    }

    const run = (...args: Args) => {
      cancel()
      state.current.args = args
      state.current.timer = window.setTimeout(() => {
        state.current.timer = null
        state.current.args = null
        callbackRef.current(...args)
      }, delayMs)
    }

    return { run, flush, cancel }
  }, [delayMs])

  useEffect(() => api.cancel, [api])

  return api
}
