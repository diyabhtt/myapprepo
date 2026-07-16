import { useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { ClaimsTable } from '@/components/ClaimsTable'
import { EmptyState } from '@/components/EmptyState'
import { useAppContext } from '@/context/AppContext'
import { filterClaims } from '@/services/prototypeData'
import { type Claim, type ClaimTab } from '@/types'

const EMPTY_CLAIMS: Claim[] = []

const tabs: Array<{ label: string; value: ClaimTab }> = [
  { label: 'All', value: 'all' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Needs action', value: 'needs-action' },
  { label: 'Completed', value: 'completed' },
]

export function ClaimsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, currentMember, activeAuthorization, identityMode, signOut, setSelectedClaimId } = useAppContext()
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const activeTab = (searchParams.get('status') as ClaimTab | null) ?? 'all'
  const claims = currentMember ? (data.claimsByMemberId[currentMember.id] ?? EMPTY_CLAIMS) : EMPTY_CLAIMS
  const filteredClaims = useMemo(
    () =>
      currentMember
        ? filterClaims(claims, { tab: activeTab === 'all' ? 'all' : activeTab, search, from: from || undefined, to: to || undefined })
        : [],
    [activeTab, claims, currentMember, from, search, to],
  )

  if (!currentMember) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-[var(--color-brand-surface)]">
      <AppHeader member={currentMember} activeAuthorization={activeAuthorization} onSignOut={signOut} />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-brand-ink)]">Claims</h1>
            <p className="mt-2 text-sm text-[var(--color-brand-muted)]">Search, filter, and open any claim in the shared assistant.</p>
            {identityMode === 'helper' && activeAuthorization ? (
              <div className="mt-3 inline-flex rounded-full bg-[var(--color-brand-mint)] px-4 py-2 text-xs font-medium text-[var(--color-brand-ink)]">
                Viewing claims for {currentMember.fullName} as {activeAuthorization.authorizedCallerName}
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="focus-ring rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3 text-sm"
              placeholder="Search claim, provider, or service"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <input type="date" className="focus-ring rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3 text-sm" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input type="date" className="focus-ring rounded-2xl border border-[var(--color-brand-border)] bg-white px-4 py-3 text-sm" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>

        <section className="card mt-8 p-6">
          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const active = tab.value === activeTab
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold ${
                    active ? 'bg-[var(--color-brand-lime)] text-white' : 'bg-[var(--color-brand-surface)] text-[var(--color-brand-muted)]'
                  }`}
                  onClick={() => {
                    if (tab.value === 'all') {
                      setSearchParams(new URLSearchParams())
                    } else {
                      setSearchParams(new URLSearchParams({ status: tab.value }))
                    }
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {filteredClaims.length > 0 ? (
            <ClaimsTable claims={filteredClaims} onSelectClaim={setSelectedClaimId} />
          ) : (
            <EmptyState
              title="No matching claims"
              description={
                search || from || to
                  ? 'Try changing the search or date filters.'
                  : activeTab === 'completed'
                    ? 'No completed claims are available in this dataset for the selected member.'
                    : 'No claims match the selected status.'
              }
            />
          )}
        </section>
      </main>
    </div>
  )
}
