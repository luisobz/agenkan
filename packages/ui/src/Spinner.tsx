export interface SpinnerProps {
  label?: string
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <span className="ui-spinner" role="status">
      <span className="ui-spinner__circle" />
      {label && <span className="ui-spinner__label">{label}</span>}
    </span>
  )
}
