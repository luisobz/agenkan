import { Badge, Button, Modal, Spinner, TextInput } from '@agenkan/ui'
import type { OllamaStatus, ServerSettings } from '@agenkan/shared'
import { useEffect, useState } from 'react'
import { useConnection } from '../connection/connection-context.js'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { api, baseUrl, disconnect } = useConnection()
  const [settings, setSettings] = useState<ServerSettings | null>(null)
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null))
    api.getOllamaStatus().then(setStatus).catch(() => setStatus(null))
  }, [api])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setMessage(null)
    try {
      setSettings(await api.updateSettings(settings))
      setStatus(await api.getOllamaStatus())
      setMessage('Configuración guardada')
    } catch (saveError) {
      setMessage(
        saveError instanceof Error ? saveError.message : String(saveError)
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Configuración"
      onClose={onClose}
      footer={
        <>
          <Button variant="danger" onClick={disconnect}>
            Desconectar de este servidor
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} disabled={saving || !settings}>
            {saving ? <Spinner label="Guardando..." /> : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="settings-modal__section">
        <h3>Conexión</h3>
        <p className="settings-modal__detail">
          Servidor: <code>{baseUrl}</code>
        </p>
      </div>

      <div className="settings-modal__section">
        <h3>Ollama</h3>
        {!settings ? (
          <Spinner label="Cargando configuración..." />
        ) : (
          <>
            <TextInput
              label="URL de Ollama (desde el servidor)"
              value={settings.ollamaUrl}
              onChange={(event) =>
                setSettings({ ...settings, ollamaUrl: event.target.value })
              }
            />
            {status && status.models.length > 0 ? (
              <label className="ui-field">
                <span className="ui-field__label">Modelo</span>
                <select
                  className="ui-input"
                  value={settings.ollamaModel}
                  onChange={(event) =>
                    setSettings({ ...settings, ollamaModel: event.target.value })
                  }
                >
                  {!status.models.includes(settings.ollamaModel) && (
                    <option value={settings.ollamaModel}>
                      {settings.ollamaModel} (no disponible)
                    </option>
                  )}
                  {status.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <TextInput
                label="Modelo"
                value={settings.ollamaModel}
                onChange={(event) =>
                  setSettings({ ...settings, ollamaModel: event.target.value })
                }
              />
            )}
          </>
        )}

        {status && (
          <p className="settings-modal__status">
            <Badge tone={status.reachable && status.modelAvailable ? 'success' : 'danger'}>
              {status.reachable
                ? status.modelAvailable
                  ? 'Listo'
                  : 'Modelo no disponible'
                : 'Sin conexión'}
            </Badge>{' '}
            {status.message}
          </p>
        )}
      </div>

      {message && <p className="settings-modal__message">{message}</p>}
    </Modal>
  )
}
