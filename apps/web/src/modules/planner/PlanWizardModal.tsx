import { Badge, Button, Modal, Spinner } from '@agenkan/ui'
import type {
  BoardSummary,
  GeneratePlanResponse,
  Note,
  PlanTarget
} from '@agenkan/shared'
import { useEffect, useState } from 'react'
import { useConnection } from '../connection/connection-context.js'
import { PlanPreview } from './PlanPreview.js'

type WizardStep =
  | { name: 'target' }
  | { name: 'generating' }
  | { name: 'preview'; result: GeneratePlanResponse }
  | { name: 'applying'; result: GeneratePlanResponse }

export interface PlanWizardModalProps {
  note: Note
  onClose: () => void
  onApplied: (boardId: string) => void
}

/**
 * Guides the "note → kanban" flow: the user picks the destination board,
 * the AI proposes a plan, and nothing touches the board until it is approved.
 */
export function PlanWizardModal({
  note,
  onClose,
  onApplied
}: PlanWizardModalProps) {
  const { api } = useConnection()
  const [step, setStep] = useState<WizardStep>({ name: 'target' })
  const [target, setTarget] = useState<PlanTarget>({ mode: 'new' })
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listBoards()
      .then(setBoards)
      .catch(() => setBoards([]))
  }, [api])

  const generate = async (chosenTarget: PlanTarget) => {
    setTarget(chosenTarget)
    setStep({ name: 'generating' })
    setError(null)
    try {
      const result = await api.generatePlan({
        noteId: note.id,
        target: chosenTarget
      })
      setStep({ name: 'preview', result })
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : String(generateError)
      )
      setStep({ name: 'target' })
    }
  }

  const apply = async (result: GeneratePlanResponse) => {
    setStep({ name: 'applying', result })
    setError(null)
    try {
      const applied = await api.applyPlan({
        noteId: note.id,
        target,
        plan: result.plan,
        rawResponse: result.rawResponse,
        model: result.model
      })
      onApplied(applied.boardId)
    } catch (applyError) {
      setError(
        applyError instanceof Error ? applyError.message : String(applyError)
      )
      setStep({ name: 'preview', result })
    }
  }

  return (
    <Modal title={`Planificar: ${note.title}`} onClose={onClose}>
      {error && <p className="plan-wizard__error">{error}</p>}

      {step.name === 'target' && (
        <div className="plan-wizard__targets">
          <p className="plan-wizard__question">
            ¿Dónde quieres crear las tarjetas?
          </p>
          <Button
            variant="primary"
            onClick={() => void generate({ mode: 'new' })}
          >
            📂 En un tablero nuevo
          </Button>

          {boards === null && <Spinner label="Cargando tableros..." />}
          {boards && boards.length > 0 && (
            <>
              <p className="plan-wizard__divider">o en un tablero existente:</p>
              <ul className="plan-wizard__boards">
                {boards.map((board) => (
                  <li key={board.id}>
                    <Button
                      onClick={() =>
                        void generate({ mode: 'existing', boardId: board.id })
                      }
                    >
                      {board.name}
                      <Badge tone="neutral">{board.cardCount} tarjetas</Badge>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {step.name === 'generating' && (
        <div className="plan-wizard__loading">
          <Spinner label="La IA está analizando tu nota..." />
        </div>
      )}

      {(step.name === 'preview' || step.name === 'applying') && (
        <>
          <PlanPreview plan={step.result.plan} model={step.result.model} />
          <div className="plan-wizard__actions">
            <Button
              onClick={() => void generate(target)}
              disabled={step.name === 'applying'}
            >
              🔄 Regenerar
            </Button>
            <Button
              variant="primary"
              onClick={() => void apply(step.result)}
              disabled={step.name === 'applying'}
            >
              {step.name === 'applying' ? (
                <Spinner label="Aplicando..." />
              ) : (
                '✅ Aplicar al tablero'
              )}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
