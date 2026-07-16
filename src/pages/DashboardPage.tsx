import { AlertCircle, ArrowRight, CalendarDays, Check, Clock3, FileSearch, Lock, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildAssistantHref, createConversationId } from '@/lib/conversationRouting'
import { AppHeader } from '@/components/AppHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/StatusBadge'
import { useAppContext } from '@/context/AppContext'
import { formatCurrency, formatLongDate, formatShortDate, maskMemberId } from '@/lib/formatters'
import { buildDashboardSummary } from '@/services/prototypeData'

const quickTools = [
  {
    title: 'Check coverage',
    description: 'Search a service or CPT code',
    href: '/assistant',
    icon: Check,
  },
  {
    title: 'Prior authorization',
    description: 'See requirements and status',
    href: '/claims?status=needs-action',
    icon: FileSearch,
  },
  {
    title: 'Authorized access',
    description: 'Manage Release of Information',
    href: '/dashboard#roi',
    icon: Shield,
  },
  {
    title: 'Find care',
    description: 'View providers and appointments',
    href: '/dashboard#care',
    icon: CalendarDays,
  },
]

export function DashboardPage() {
  const { currentMember, signOut, setSelectedClaimId, data, activeAuthorization } = useAppContext()

  if (!currentMember) {
    return <EmptyState title="Member session required" description="Sign in to open the dashboard." />
  }

  const summary = buildDashboardSummary(data, currentMember.id)
  if (!summary) {
    return <EmptyState title="Dashboard unavailable" description="We could not build the dashboard for this member." />
  }

  const assistantPrompts = summary.recentClaims.slice(0, 2).map((claim) => ({
    claimId: claim.id,
    label: claim.priorAuthRequired
      ? `Does ${claim.serviceName} need prior authorization?`
      : `What happened with claim ${claim.id}?`,
  }))

  return (
    <div className="min-h-screen bg-[var(--color-brand-surface)]">
      <AppHeader member={currentMember} activeAuthorization={activeAuthorization} onSignOut={signOut} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[var(--color-brand-ink)]">Good morning, {currentMember.firstName}</h1>
            <p className="mt-2 text-base text-[var(--color-brand-muted)]">Here is what needs your attention today.</p>
            {activeAuthorization ? (
              <div className="mt-4 inline-flex items-center rounded-full bg-[var(--color-brand-mint)] px-4 py-2 text-sm font-medium text-[var(--color-brand-ink)]">
                Signed in as {activeAuthorization.authorizedCallerName} • {activeAuthorization.relationship} access active through {formatLongDate(activeAuthorization.expirationDate)}
              </div>
            ) : null}
          </div>
          <div className="card min-w-[280px] px-5 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-brand-muted)]">Plan</div>
            <div className="mt-2 text-base font-semibold text-[var(--color-brand-ink)]">{currentMember.planType}</div>
            <div className="mt-1 text-xs text-[var(--color-brand-muted)]">Member ID: {maskMemberId(currentMember.id)}</div>
          </div>
        </div>

        <section className="card mt-10 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xl font-bold text-[var(--color-brand-ink)]">Needs your attention</div>
              <div className="mt-2 text-sm text-[var(--color-brand-muted)]">Resolve these items now to prevent delays or repeat calls.</div>
            </div>
            <div className="inline-flex rounded-full bg-[var(--color-alert-amber-bg)] px-4 py-2 text-xs font-semibold text-[var(--color-alert-amber)]">
              {summary.attentionItems.length} ACTIONS
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {summary.attentionItems.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                to={item.claimId ? buildAssistantHref(item.claimId, createConversationId(item.claimId)) : item.actionHref}
                className={`focus-ring motion-surface lift-hover rounded-3xl px-5 py-5 ${
                  item.tone === 'amber'
                    ? 'bg-[var(--color-alert-amber-bg)]'
                    : item.tone === 'red'
                      ? 'bg-[var(--color-alert-red-bg)]'
                      : item.tone === 'green'
                        ? 'bg-[var(--color-alert-green-bg)]'
                        : 'bg-emerald-50'
                }`}
                onClick={() => setSelectedClaimId(item.claimId)}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${item.tone === 'red' ? 'bg-[var(--color-alert-red)] text-white' : item.tone === 'amber' ? 'bg-[var(--color-alert-amber)] text-white' : 'bg-[var(--color-brand-teal)] text-white'}`}>
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-[var(--color-brand-ink)]">{item.title}</div>
                    <div className="mt-1 text-sm text-[var(--color-brand-muted)]">{item.detail}</div>
                    <div className={`mt-3 text-xs font-semibold ${item.tone === 'red' ? 'text-[var(--color-alert-red)]' : 'text-[var(--color-alert-amber)]'}`}>
                      {item.actionLabel} →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_470px]">
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="text-xl font-bold text-[var(--color-brand-ink)]">Recent claims</div>
              <Link to="/claims" className="text-xs font-semibold text-[var(--color-brand-teal)]">
                View all claims →
              </Link>
            </div>
            <div className="space-y-4">
              {summary.recentClaims.map((claim) => (
              <Link
                key={claim.id}
                to={buildAssistantHref(claim.id, createConversationId(claim.id))}
                className="focus-ring motion-surface flex flex-wrap items-center gap-4 rounded-2xl px-2 py-2 hover:-translate-y-0.5 hover:bg-[var(--color-brand-surface)]"
                onClick={() => setSelectedClaimId(claim.id)}
              >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-mint)] text-[var(--color-brand-teal)]">
                    +
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <div className="text-base font-semibold text-[var(--color-brand-ink)]">{claim.providerName}</div>
                    <div className="text-xs text-[var(--color-brand-muted)]">{claim.serviceName}</div>
                  </div>
                  <div className="text-xs text-[var(--color-brand-muted)]">{formatShortDate(claim.serviceDate)}</div>
                  <div className="min-w-24 text-right text-sm font-semibold text-[var(--color-brand-ink)]">{formatCurrency(claim.billedAmount)}</div>
                  <StatusBadge statusGroup={claim.statusGroup} label={claim.statusLabel} />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] bg-[var(--color-brand-deep)] p-7 text-white shadow-[0_12px_30px_rgba(10,31,28,0.18)]">
            <div className="inline-flex rounded-full bg-[var(--color-brand-lime)] px-4 py-2 text-xs font-semibold text-[var(--color-brand-ink)]">
              AI ASSISTANT
            </div>
            <h2 className="mt-8 text-2xl font-bold">Ask about your claims or benefits</h2>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              I can explain denials, coverage, referrals, prior authorization, and next steps.
            </p>
            <div className="mt-8 space-y-3">
              {assistantPrompts.map((prompt) => (
                <Link
                  key={prompt.label}
                  to={buildAssistantHref(prompt.claimId, createConversationId(prompt.claimId))}
                  className="focus-ring motion-surface block rounded-xl bg-green-900 px-4 py-3 text-xs font-medium text-white hover:-translate-y-0.5"
                >
                  {prompt.label}
                </Link>
              ))}
            </div>
            <Link
              to={buildAssistantHref(undefined, createConversationId())}
              className="focus-ring motion-surface mt-8 flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-sm text-[var(--color-brand-muted)] hover:-translate-y-0.5"
            >
              <span>Type your question…</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-lime)] text-lg font-bold text-[var(--color-brand-ink)]">
                →
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[var(--color-brand-ink)]">Quick tools</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.title === 'Check coverage' ? buildAssistantHref(undefined, createConversationId()) : tool.href}
                className="card focus-ring motion-surface lift-hover px-5 py-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-mint)] text-[var(--color-brand-teal)]">
                  <tool.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-base font-semibold text-[var(--color-brand-ink)]">{tool.title}</div>
                <div className="mt-2 text-xs text-[var(--color-brand-muted)]">{tool.description}</div>
                <div className="mt-6 text-xs font-semibold text-[var(--color-brand-teal)]">Open →</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <div id="care" className="card p-6">
            <div className="text-lg font-bold text-[var(--color-brand-ink)]">Upcoming care</div>
            {summary.openCareGaps[0] ? (
              <>
                <div className="mt-6 text-base font-semibold text-[var(--color-brand-ink)]">{summary.openCareGaps[0].measureName}</div>
                <div className="mt-2 text-xs text-[var(--color-brand-muted)]">
                  Due by {formatLongDate(summary.openCareGaps[0].dueDate)}. {summary.openCareGaps[0].outreachAttempts} outreach attempts already logged.
                </div>
              </>
            ) : (
              <div className="mt-6 text-sm text-[var(--color-brand-muted)]">No open care gaps were found for this member.</div>
            )}
            <div className="mt-5 rounded-2xl bg-[var(--color-brand-surface)] px-4 py-4 text-sm text-[var(--color-brand-muted)]">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-[var(--color-brand-teal)]" />
                <div>
                  <div className="font-medium text-[var(--color-brand-ink)]">{summary.schedulingMessage}</div>
                  {summary.latestAvailableSlots[0] ? (
                    <div className="mt-1 text-xs">
                      Latest slot on file: {summary.latestAvailableSlots[0].providerName} on {formatLongDate(summary.latestAvailableSlots[0].slotDate)}.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div id="roi" className="card p-6">
            <div className="text-lg font-bold text-[var(--color-brand-ink)]">Authorized access</div>
            {summary.activeAuthorizations[0] ? (
              <>
                <div className="mt-6 text-base font-semibold text-[var(--color-brand-ink)]">
                  {summary.activeAuthorizations.length} active authorization{summary.activeAuthorizations.length > 1 ? 's' : ''} on file
                </div>
                <div className="mt-4 space-y-3">
                  {summary.activeAuthorizations.map((authorization) => (
                    <div key={authorization.id} className="rounded-2xl bg-[var(--color-brand-surface)] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-brand-ink)]">{authorization.authorizedCallerName}</div>
                          <div className="mt-1 text-xs text-[var(--color-brand-muted)]">
                            {authorization.relationship} • Expires {formatLongDate(authorization.expirationDate)}
                          </div>
                        </div>
                        <div className="inline-flex rounded-full bg-[var(--color-alert-green-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--color-alert-green)]">
                          ACTIVE
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6 text-sm text-[var(--color-brand-muted)]">No active authorized access records are on file for this member.</div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--color-brand-border)] bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-brand-muted)]">
            <Lock className="h-4 w-4 text-[var(--color-brand-teal)]" />
            Secure member and authorization data stays local in this browser session.
            <Link to="/claims?status=needs-action" className="ml-auto inline-flex items-center font-semibold text-[var(--color-brand-teal)]">
              Open needs-action claims
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
