import { type ClaimStatusGroup } from '@/types'

const styles: Record<ClaimStatusGroup, string> = {
  'needs-action': 'bg-[var(--color-alert-amber-bg)] text-[var(--color-alert-amber)]',
  'in-progress': 'bg-[var(--color-alert-green-bg)] text-[var(--color-brand-teal)]',
  completed: 'bg-slate-100 text-[var(--color-brand-ink)]',
}

interface StatusBadgeProps {
  statusGroup: ClaimStatusGroup
  label: string
}

export function StatusBadge({ statusGroup, label }: StatusBadgeProps) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[statusGroup]}`}>{label}</span>
}
