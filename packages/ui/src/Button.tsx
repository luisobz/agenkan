import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({
  variant = 'ghost',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={`ui-btn ui-btn--${variant} ${className}`} {...rest}>
      {children}
    </button>
  )
}
