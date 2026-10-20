/** Connection settings held in memory after the user authenticates. */
export interface ConnectionConfig {
  /** API base URL, e.g. "https://mi-casa.duckdns.org:3210". */
  baseUrl: string
  password: string
}

const ENDPOINT_STORAGE_KEY = 'agenkan.endpoint'
const LEGACY_STORAGE_KEY = 'agenkan.connection'

/**
 * When the web app is served by the API itself (desktop usage), the endpoint
 * is simply the current origin and only the password needs to be typed.
 */
export function defaultBaseUrl(): string {
  return window.location.protocol.startsWith('http')
    ? window.location.origin
    : ''
}

export function loadConnection(): string | null {
  try {
    const baseUrl = localStorage.getItem(ENDPOINT_STORAGE_KEY)
    // Drop the old record without reading its password into application code.
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return baseUrl
  } catch {
    return null
  }
}

export function saveConnection(baseUrl: string): void {
  localStorage.setItem(ENDPOINT_STORAGE_KEY, baseUrl)
}

export function clearConnection(): void {
  localStorage.removeItem(ENDPOINT_STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}
