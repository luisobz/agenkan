/** Connection settings the user configures once per device. */
export interface ConnectionConfig {
  /** API base URL, e.g. "https://mi-casa.duckdns.org:3210". */
  baseUrl: string
  password: string
}

const STORAGE_KEY = 'agenkan.connection'

/**
 * When the web app is served by the API itself (desktop usage), the endpoint
 * is simply the current origin and only the password needs to be typed.
 */
export function defaultBaseUrl(): string {
  return window.location.protocol.startsWith('http')
    ? window.location.origin
    : ''
}

export function loadConnection(): ConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ConnectionConfig>
    if (typeof parsed.baseUrl !== 'string' || typeof parsed.password !== 'string') {
      return null
    }
    return { baseUrl: parsed.baseUrl, password: parsed.password }
  } catch {
    return null
  }
}

export function saveConnection(config: ConnectionConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearConnection(): void {
  localStorage.removeItem(STORAGE_KEY)
}
