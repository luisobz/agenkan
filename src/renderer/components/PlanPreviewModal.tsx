import React from 'react'

interface PlanPreviewModalProps {
  plan: any
  onClose: () => void
  onExecute: () => void
  executing: boolean
}

export function PlanPreviewModal({ plan, onClose, onExecute, executing }: PlanPreviewModalProps) {
  return (
    <div className="modal-overlay interactive">
      <div className="modal-content glass-panel" style={{ maxWidth: '800px' }}>
        <h2 style={{ marginBottom: '1rem' }}>Plan de Acción Generado</h2>
        
        <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Resumen:</p>
          <p style={{ color: 'var(--text-secondary)' }}>{plan.summary}</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Destino</h3>
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px' }}>
            {plan.target.mode === 'new' ? (
              <p>Crear nuevo proyecto: <strong>{plan.target.projectName}</strong></p>
            ) : (
              <p>Usar proyecto existente ID: <strong>{plan.target.projectId}</strong></p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Acciones ({plan.actions.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {plan.actions.map((action: any, i: number) => (
              <div key={i} style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
                {action.type === 'create_task' && (
                  <>
                    <div style={{ fontWeight: 500 }}>Crear tarea: {action.title}</div>
                    {action.description && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{action.description}</div>}
                    {action.labels?.length > 0 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                        {action.labels.map((l: string) => <span key={l} style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{l}</span>)}
                      </div>
                    )}
                  </>
                )}
                {action.type === 'create_project' && <div>Crear proyecto auxiliar: {action.name}</div>}
                {action.type === 'update_task' && <div>Actualizar tarea ID: {action.taskId}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose} disabled={executing}>Cancelar</button>
          <button className="btn btn-primary" onClick={onExecute} disabled={executing}>
            {executing ? 'Ejecutando...' : 'Ejecutar en Vikunja'}
          </button>
        </div>
      </div>
    </div>
  )
}
