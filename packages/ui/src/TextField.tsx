import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextInput({ label, className = '', ...rest }: TextInputProps) {
  const input = <input className={`ui-input ${className}`} {...rest} />
  if (!label) return input
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      {input}
    </label>
  )
}

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function TextArea({ label, className = '', ...rest }: TextAreaProps) {
  const textarea = <textarea className={`ui-input ui-textarea ${className}`} {...rest} />
  if (!label) return textarea
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      {textarea}
    </label>
  )
}
