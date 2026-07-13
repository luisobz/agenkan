import { createContext, useContext } from 'react'
import type { ApiClient } from '../../lib/api-client.js'

export interface ConnectionContextValue {
  api: ApiClient
  baseUrl: string
  disconnect: () => void
}

export const ConnectionContext = createContext<ConnectionContextValue | null>(
  null
)

/** Gives any component access to the authenticated API client. */
export function useConnection(): ConnectionContextValue {
  const value = useContext(ConnectionContext)
  if (!value) {
    throw new Error('useConnection must be used inside <ConnectionProvider>')
  }
  return value
}
