import React, { useState, useEffect } from 'react'

interface Settings {
  vikunjaApiUrl: string
  vikunjaApiToken: string
  vikunjaApiTokenCreate: string
  vikunjaApiTokenExisting: string
  vikunjaApiTokenManagement: string
  ollamaUrl: string
  ollamaModel: string
}

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    vikunjaApiUrl: '',
    vikunjaApiToken: '',
    vikunjaApiTokenCreate: '',
    vikunjaApiTokenExisting: '',
    vikunjaApiTokenManagement: '',
    ollamaUrl: '',
    ollamaModel: ''
  })
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<string[]>([])
  const [testResult, setTestResult] = useState<{vikunja?: string, ollama?: string}>({})

  useEffect(() => {
    window.api.settings.get().then((s: any) => {
      setSettings(s)
      setLoading(false)
    })
    window.api.ollama.listModels().then((m: string[]) => setModels(m))
  }, [])

  const handleSave = async () => {
    await window.api.settings.save(settings)
    onClose()
  }

  const testVikunja = async () => {
    await window.api.settings.save(settings)
    const res = await window.api.vikunja.testConnection()
    setTestResult(prev => ({...prev, vikunja: res.message}))
  }

  const testOllama = async () => {
    await window.api.settings.save(settings)
    const res = await window.api.ollama.testConnection()
    setTestResult(prev => ({...prev, ollama: res.message}))
  }

  if (loading) return null

  return (
    <div className="modal-overlay interactive">
      <div className="modal-content glass-panel">
        <h2 style={{ marginBottom: '1.5rem' }}>Configuración</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Vikunja</h3>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>URL del API</label>
            <input 
              className="input-field" 
              value={settings.vikunjaApiUrl}
              onChange={e => setSettings({...settings, vikunjaApiUrl: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Token Base (Fallback)</label>
            <input 
              type="password"
              className="input-field" 
              value={settings.vikunjaApiToken}
              onChange={e => setSettings({...settings, vikunjaApiToken: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Token - Crear Proyecto (Opcional)</label>
            <input 
              type="password"
              className="input-field" 
              value={settings.vikunjaApiTokenCreate}
              onChange={e => setSettings({...settings, vikunjaApiTokenCreate: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Token - Proyecto Existente (Opcional)</label>
            <input 
              type="password"
              className="input-field" 
              value={settings.vikunjaApiTokenExisting}
              onChange={e => setSettings({...settings, vikunjaApiTokenExisting: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Token - Management (Opcional)</label>
            <input 
              type="password"
              className="input-field" 
              value={settings.vikunjaApiTokenManagement}
              onChange={e => setSettings({...settings, vikunjaApiTokenManagement: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn" onClick={testVikunja}>Probar Conexión</button>
            {testResult.vikunja && <span style={{ fontSize: '0.9rem', color: testResult.vikunja.includes('exitos') ? 'var(--success)' : 'var(--danger)' }}>{testResult.vikunja}</span>}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Ollama</h3>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>URL de Ollama</label>
            <input 
              className="input-field" 
              value={settings.ollamaUrl}
              onChange={e => setSettings({...settings, ollamaUrl: e.target.value})}
            />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Modelo</label>
            <select 
              className="input-field" 
              value={settings.ollamaModel}
              onChange={e => setSettings({...settings, ollamaModel: e.target.value})}
            >
              <option value="">Selecciona un modelo...</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
              {/* Fallback en caso de que el modelo guardado no esté en la lista */}
              {settings.ollamaModel && !models.includes(settings.ollamaModel) && (
                <option value={settings.ollamaModel}>{settings.ollamaModel}</option>
              )}
            </select>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn" onClick={testOllama}>Probar Modelo</button>
            {testResult.ollama && <span style={{ fontSize: '0.9rem', color: testResult.ollama.includes('disponible') ? 'var(--success)' : 'var(--danger)' }}>{testResult.ollama}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  )
}
