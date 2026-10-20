/** Connection settings the user configures once per device. */
export interface ConnectionConfig {
  /** API base URL, e.g. "https://mi-casa.duckdns.org:3210". */
  baseUrl: string
  password: string
}

const ENDPOINT_STORAGE_KEY = 'agenkan.endpoint'
const PASSWORD_STORAGE_KEY = 'agenkan.password'
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

export function loadConnection(): ConnectionConfig | null {
  try {
    const baseUrl = localStorage.getItem(ENDPOINT_STORAGE_KEY)
    const password = sessionStorage.getItem(PASSWORD_STORAGE_KEY)
    if (baseUrl !== null && password !== null) {
      return { baseUrl, password }
    }

    // Migrate the previous format once, then remove its persisted password.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<ConnectionConfig>
      if (
        typeof parsed.baseUrl === 'string' &&
        typeof parsed.password === 'string'
      ) {
        localStorage.setItem(ENDPOINT_STORAGE_KEY, parsed.baseUrl)
        sessionStorage.setItem(PASSWORD_STORAGE_KEY, parsed.password)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        return { baseUrl: parsed.baseUrl, password: parsed.password }
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
    return null
  } catch {
    return null
  }
}

export function saveConnection(config: ConnectionConfig): void {
  localStorage.setItem(ENDPOINT_STORAGE_KEY, config.baseUrl)
  sessionStorage.setItem(PASSWORD_STORAGE_KEY, config.password)
}

export function clearConnection(): void {
  localStorage.removeItem(ENDPOINT_STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  sessionStorage.removeItem(PASSWORD_STORAGE_KEY)
}
