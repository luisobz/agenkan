import React, { useState, useEffect, useRef } from 'react'
import { SettingsModal } from './components/SettingsModal'
import { PlanPreviewModal } from './components/PlanPreviewModal'
import { LogsModal } from './components/LogsModal'
import logo from '../assets/logo.svg'

function App() {
  const [notes, setNotes] = useState<any[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showLaunchMenu, setShowLaunchMenu] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [actionMode, setActionMode] = useState<'create' | 'existing' | 'management'>('create')

  // Planner state
  const [generating, setGenerating] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<any | null>(null)
  const [currentRawResponse, setCurrentRawResponse] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executeResult, setExecuteResult] = useState<any | null>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    const list = await window.api.notes.list() as any[]
    setNotes(list)
    if (list.length > 0 && !activeNoteId) {
      selectNote(list[0].id)
    }
  }

  const selectNote = async (id: string) => {
    const note: any = await window.api.notes.get(id)
    setActiveNoteId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setExecuteResult(null)
  }

  const createNote = () => {
    setActiveNoteId(null)
    setTitle('Nueva nota')
    setContent('')
    setExecuteResult(null)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleSave(e.target.value, content)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    scheduleSave(title, e.target.value)
  }

  const scheduleSave = (t: string, c: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      const saved = await window.api.notes.save({ id: activeNoteId || undefined, title: t, content: c })
      if (!activeNoteId) {
        setActiveNoteId((saved as any).id)
      }
      loadNotes() // Refresh list
    }, 1000)
  }

  const handleGeneratePlan = async (mode: 'create' | 'existing' | 'management') => {
    setShowLaunchMenu(false)
    if (!content.trim()) return
    setGenerating(true)
    setActionMode(mode)
    setExecuteResult(null)
    try {
      // Force save before generating
      const saved: any = await window.api.notes.save({ id: activeNoteId || undefined, title, content })
      if (!activeNoteId) setActiveNoteId(saved.id)

      const result: any = await window.api.planner.generatePlan(content, mode)
      if (result.success && result.plan) {
        setCurrentPlan(result.plan)
        setCurrentRawResponse(result.rawResponse)
      } else {
        alert('Error generando plan: ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleExecutePlan = async () => {
    if (!currentPlan || !activeNoteId) return
    setExecuting(true)
    try {
      const s = await window.api.settings.get() as any
      const res: any = await window.api.executor.executePlan(currentPlan, activeNoteId, actionMode, currentRawResponse ?? undefined, s.ollamaModel)
      setExecuteResult(res)
      setCurrentPlan(null)
      setCurrentRawResponse(null)
      loadNotes() // Refresh to update isLaunched status
    } catch (err: any) {
      alert('Error ejecutando: ' + err.message)
    } finally {
      setExecuting(false)
    }
  }

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Eliminar esta nota?')) {
      await window.api.notes.delete(id)
      if (id === activeNoteId) {
        createNote()
      } else {
        loadNotes()
      }
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar interactive">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', gap: '0.5rem' }}>
          <img src={logo} alt="AgenKan Logo" style={{ width: '48px', height: '48px', marginTop: '0.5rem' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, textAlign: 'center', flex: 1 }}>AgenKan</h2>
            <button className="btn" onClick={() => setShowSettings(true)} style={{ padding: '0.4rem', position: 'absolute', right: '1rem', top: '1.5rem' }}>
              ⚙️
            </button>
          </div>
        </div>

        <button className="btn btn-primary interactive" style={{ marginTop: '1rem' }} onClick={createNote}>
          + Nueva Nota
        </button>
        <button className="btn interactive" style={{ marginTop: '0.5rem' }} onClick={() => setShowLogs(true)}>
          📜 Historial de Logs
        </button>

        <ul className="note-list">
          {notes.map(note => (
            <li
              key={note.id}
              className={`note-item interactive ${note.id === activeNoteId ? 'active' : ''}`}
              onClick={() => selectNote(note.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div className="note-item-title">
                    {note.title}
                    {note.isLaunched && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', backgroundColor: 'var(--success)', color: '#000', padding: '2px 6px', borderRadius: '10px', verticalAlign: 'middle' }}>Lanzada</span>}
                  </div>
                  <div className="note-item-date">{new Date(note.updatedAt).toLocaleDateString()}</div>
                </div>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      <div className="editor-container interactive">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <input
            className="editor-title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Título de la nota..."
          />
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-primary interactive"
              onClick={() => setShowLaunchMenu(!showLaunchMenu)}
              disabled={generating || !content.trim()}
            >
              {generating ? '✨ Pensando...' : '✨ Lanzar a Vikunja ▼'}
            </button>
            {showLaunchMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 10, width: '220px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                <button className="btn" style={{ width: '100%', borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-color)', justifyContent: 'flex-start', padding: '0.75rem 1rem' }} onClick={() => handleGeneratePlan('create')}>
                  📂 Crear proyecto nuevo
                </button>
                <button className="btn" style={{ width: '100%', borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-color)', justifyContent: 'flex-start', padding: '0.75rem 1rem' }} onClick={() => handleGeneratePlan('existing')}>
                  🔗 Usar proyecto existente
                </button>
                <button className="btn" style={{ width: '100%', borderRadius: 0, border: 'none', justifyContent: 'flex-start', padding: '0.75rem 1rem' }} onClick={() => handleGeneratePlan('management')}>
                  ⚙️ Management (ej. Etiquetas)
                </button>
              </div>
            )}
          </div>
        </div>

        {executeResult && (
          <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: executeResult.status === 'success' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 165, 2, 0.1)', border: `1px solid ${executeResult.status === 'success' ? 'var(--success)' : 'var(--warning)'}` }}>
            <h4 style={{ color: executeResult.status === 'success' ? 'var(--success)' : 'var(--warning)', marginBottom: '0.5rem' }}>
              {executeResult.status === 'success' ? 'Ejecutado con éxito' : 'Ejecutado parcialmente'}
            </h4>
            <ul style={{ marginLeft: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {executeResult.results.map((r: any, i: number) => (
                <li key={i}>{r.message}</li>
              ))}
            </ul>
          </div>
        )}

        <textarea
          className="editor-content"
          value={content}
          onChange={handleContentChange}
          placeholder="Escribe tus ideas aquí... La IA se encargará de extraer las tareas."
        />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showLogs && <LogsModal onClose={() => setShowLogs(false)} />}

      {currentPlan && (
        <PlanPreviewModal
          plan={currentPlan}
          onClose={() => setCurrentPlan(null)}
          onExecute={handleExecutePlan}
          executing={executing}
        />
      )}
    </div>
  )
}

export default App
