interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-brand-border)] bg-white px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-[var(--color-brand-ink)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-brand-muted)]">{description}</p>
    </div>
  )
}
