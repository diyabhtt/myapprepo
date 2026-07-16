import { type ReactNode } from 'react'

interface CallControlButtonProps {
  label: string
  active?: boolean
  danger?: boolean
  icon: ReactNode
  onClick: () => void
}

export function CallControlButton({ label, active = false, danger = false, icon, onClick }: CallControlButtonProps) {
  return (
    <button
      type="button"
      className={`focus-ring flex min-w-24 flex-col items-center gap-2 rounded-3xl px-4 py-3 text-sm font-medium ${
        danger
          ? 'bg-[var(--color-alert-red)] text-white'
          : active
            ? 'bg-white text-[var(--color-brand-ink)]'
            : 'bg-white/10 text-white'
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}
