import { formatCurrency, formatLongDate } from '@/lib/formatters'
import { type ClaimContext } from '@/types'
import { StatusBadge } from './StatusBadge'

interface ClaimContextBannerProps {
  context: ClaimContext
}

export function ClaimContextBanner({ context }: ClaimContextBannerProps) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand-muted)]">Selected claim</div>
          <h2 className="mt-1 text-lg font-bold text-[var(--color-brand-ink)]">{context.claim.serviceName}</h2>
        </div>
        <StatusBadge statusGroup={context.claim.statusGroup} label={context.claim.statusLabel} />
      </div>
      <div className="grid gap-4 text-sm text-[var(--color-brand-muted)] md:grid-cols-3">
        <div>
          <div className="font-semibold text-[var(--color-brand-ink)]">{context.claim.id}</div>
          <div>{context.claim.providerName}</div>
        </div>
        <div>
          <div>{formatLongDate(context.claim.serviceDate)}</div>
          <div>{formatCurrency(context.claim.billedAmount)} billed</div>
        </div>
        <div>
          <div>{formatCurrency(context.claim.paidAmount)} plan paid</div>
          <div>{formatCurrency(context.claim.estimatedMemberCost)} estimated member cost</div>
        </div>
      </div>
    </section>
  )
}
