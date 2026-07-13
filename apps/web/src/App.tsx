import { useState } from 'react'
import logo from './assets/logo.svg'
import { ConnectionGate } from './modules/connection/ConnectionGate.js'
import { KanbanView } from './modules/kanban/KanbanView.js'
import { NotesView } from './modules/notes/NotesView.js'
import { SettingsModal } from './modules/settings/SettingsModal.js'

type MainView = 'notes' | 'kanban'

export default function App() {
  return (
    <ConnectionGate>
      <AppShell />
    </ConnectionGate>
  )
}

function AppShell() {
  const [view, setView] = useState<MainView>('notes')
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <img src={logo} alt="" />
          <span>AgenKan</span>
        </div>

        <nav className="app-shell__nav">
          <button
            className={view === 'notes' ? 'is-active' : ''}
            onClick={() => setView('notes')}
          >
            📝 Notas
          </button>
          <button
            className={view === 'kanban' ? 'is-active' : ''}
            onClick={() => setView('kanban')}
          >
            📋 Tablero
          </button>
        </nav>

        <button
          className="app-shell__settings"
          onClick={() => setShowSettings(true)}
          aria-label="Configuración"
        >
          ⚙️
        </button>
      </header>

      <main className="app-shell__main">
        {view === 'notes' ? (
          <NotesView
            onPlanApplied={(boardId) => {
              setSelectedBoardId(boardId)
              setView('kanban')
            }}
          />
        ) : (
          <KanbanView
            selectedBoardId={selectedBoardId}
            onSelectBoard={setSelectedBoardId}
          />
        )}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
