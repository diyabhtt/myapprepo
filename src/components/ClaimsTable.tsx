import { useNavigate } from 'react-router-dom'
import { buildAssistantHref, createConversationId } from '@/lib/conversationRouting'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { type Claim } from '@/types'
import { StatusBadge } from './StatusBadge'

interface ClaimsTableProps {
  claims: Claim[]
  onSelectClaim: (claimId: string) => void
}

export function ClaimsTable({ claims, onSelectClaim }: ClaimsTableProps) {
  const navigate = useNavigate()

  function openClaim(claimId: string): void {
    onSelectClaim(claimId)
    navigate(buildAssistantHref(claimId, createConversationId(claimId)))
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--color-brand-muted)]">
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Service date</th>
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Provider and service</th>
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Claim ID</th>
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Status</th>
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Billed</th>
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Plan paid</th>
            <th className="border-b border-[var(--color-brand-border)] px-4 py-3 font-semibold">Estimated member cost</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr
              key={claim.id}
              tabIndex={0}
              className="focus-ring cursor-pointer rounded-2xl text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[var(--color-brand-surface)] hover:shadow-[inset_0_0_0_1px_rgba(15,118,110,0.08)] focus-visible:bg-[var(--color-brand-surface)]"
              onClick={() => openClaim(claim.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openClaim(claim.id)
                }
              }}
            >
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4">{formatShortDate(claim.serviceDate)}</td>
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4">
                <div className="font-semibold text-[var(--color-brand-ink)]">{claim.providerName}</div>
                <div className="text-xs text-[var(--color-brand-muted)]">{claim.serviceName}</div>
              </td>
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4 font-medium">{claim.id}</td>
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4">
                <StatusBadge statusGroup={claim.statusGroup} label={claim.statusLabel} />
              </td>
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4">{formatCurrency(claim.billedAmount)}</td>
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4">{formatCurrency(claim.paidAmount)}</td>
              <td className="border-b border-[var(--color-brand-border)] px-4 py-4 font-medium">{formatCurrency(claim.estimatedMemberCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
