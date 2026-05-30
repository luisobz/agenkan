import React, { useState, useEffect } from 'react'

export function LogsModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const limit = 10
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    setLoading(true)
    const res = await window.api.logs.list({ limit, offset: page * limit })
    setLogs(res as any[])
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
  }, [page])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ margin: 0 }}>📜 Historial Global de Logs</h2>
        <button className="btn" onClick={onClose}>Volver al Bloc de Notas</button>
      </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          {loading && <p>Cargando...</p>}
          {!loading && logs.length === 0 && <p>No hay logs disponibles.</p>}
          
          {logs.map(log => (
            <div key={log.id} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', border: `1px solid ${log.status === 'success' ? 'var(--success)' : log.status === 'error' ? 'var(--danger)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>Fecha: {new Date(log.createdAt).toLocaleString()}</strong>
                <span style={{ color: log.status === 'success' ? 'var(--success)' : log.status === 'error' ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {log.status}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Modelo Usado: {log.modelUsed || 'Desconocido'} | Nota ID: {log.noteId}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Respuesta Raw (Ollama)</h4>
                  <pre style={{ backgroundColor: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '4px', overflowX: 'hidden', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.8rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {log.rawResponse || log.planJson}
                  </pre>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Resultados (Vikunja)</h4>
                  <ul style={{ backgroundColor: 'var(--bg-primary)', padding: '0.5rem 0.5rem 0.5rem 1.5rem', borderRadius: '4px', margin: 0, fontSize: '0.8rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {log.results && log.results.map((r: any, i: number) => (
                      <li key={i} style={{ color: r.success ? 'var(--success)' : 'var(--danger)' }}>
                        [{r.actionType}] {r.message} {r.error ? `- ${r.error}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn" 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >
            Anterior
          </button>
          <span>Página {page + 1}</span>
          <button 
            className="btn" 
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < limit || loading}
          >
            Siguiente
          </button>
        </div>
      </div>
  )
}
