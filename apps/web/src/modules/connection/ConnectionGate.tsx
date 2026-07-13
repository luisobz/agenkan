import { Button, Spinner, TextInput } from '@agenkan/ui'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ApiClient } from '../../lib/api-client.js'
import {
  clearConnection,
  defaultBaseUrl,
  loadConnection,
  saveConnection,
  type ConnectionConfig
} from '../../lib/connection-storage.js'
import logo from '../../assets/logo.svg'
import { ConnectionContext } from './connection-context.js'
import { ServerEventsProvider } from './ServerEventsProvider.js'

/**
 * Blocks the app until a verified connection exists. The first time (or after
 * logout / 401) it shows the setup form: API endpoint + password. Once
 * verified, it provides the ApiClient to the rest of the app and remembers
 * the configuration on this device.
 */
export function ConnectionGate({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<ConnectionConfig | null>(
    loadConnection
  )

  const disconnect = useCallback(() => {
    clearConnection()
    setConnection(null)
  }, [])

  const contextValue = useMemo(() => {
    if (!connection) return null
    return {
      api: new ApiClient(connection),
      baseUrl: connection.baseUrl,
      disconnect
    }
  }, [connection, disconnect])

  if (!contextValue || !connection) {
    return (
      <ConnectionForm
        onConnected={(config) => {
          saveConnection(config)
          setConnection(config)
        }}
      />
    )
  }

  return (
    <ConnectionContext.Provider value={contextValue}>
      <ServerEventsProvider connection={connection}>
        {children}
      </ServerEventsProvider>
    </ConnectionContext.Provider>
  )
}

function ConnectionForm({
  onConnected
}: {
  onConnected: (config: ConnectionConfig) => void
}) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl())
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setChecking(true)
    setError(null)

    const config: ConnectionConfig = {
      baseUrl: baseUrl.trim().replace(/\/+$/, ''),
      password
    }

    try {
      await new ApiClient(config).verify()
      onConnected(config)
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : 'No se pudo conectar con el servidor'
      )
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="connection-gate">
      <form className="connection-gate__card" onSubmit={handleSubmit}>
        <img src={logo} alt="AgenKan" className="connection-gate__logo" />
        <h1>AgenKan</h1>
        <p className="connection-gate__subtitle">
          Conecta con tu servidor para empezar
        </p>

        <TextInput
          label="Endpoint de la API"
          type="url"
          placeholder="http://mi-servidor:3210"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          required
        />
        <TextInput
          label="Contraseña"
          type="password"
          placeholder="Contraseña del servidor"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          required
        />

        {error && <p className="connection-gate__error">{error}</p>}

        <Button variant="primary" type="submit" disabled={checking}>
          {checking ? <Spinner label="Conectando..." /> : 'Conectar'}
        </Button>
      </form>
    </div>
  )
}
