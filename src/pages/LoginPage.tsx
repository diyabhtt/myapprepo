import { ChevronRight, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '@/context/AppContext'
import { matchAuthorizedHelper, matchMember } from '@/services/prototypeData'
import { type IdentityMode } from '@/types'

const identityCards: Array<{
  mode: IdentityMode
  title: string
  description: string
}> = [
  {
    mode: 'member',
    title: 'I am the member',
    description: 'Access my own plan and claims',
  },
  {
    mode: 'helper',
    title: 'I’m helping a member',
    description: 'Family member or authorized user',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { data, selectMember } = useAppContext()
  const [identityMode, setIdentityMode] = useState<IdentityMode>('member')
  const [memberId, setMemberId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [helperName, setHelperName] = useState('')
  const [helperRelationship, setHelperRelationship] = useState('')
  const [error, setError] = useState('')
  const helperRelationshipOptions = [...new Set(data.roiAuthorizations.map((authorization) => authorization.relationship))].sort((first, second) =>
    first.localeCompare(second),
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (identityMode === 'helper') {
      const helperAccess = matchAuthorizedHelper(data, { memberId, firstName, lastName, dob, helperName, relationship: helperRelationship })
      if (!helperAccess) {
        setError('We could not verify that helper access from the Release of Information records on file. Check the helper name and relationship on the authorization.')
        return
      }
      setError('')
      selectMember(helperAccess.member.id, identityMode, helperAccess.authorization.id)
      navigate('/dashboard')
      return
    }
    const member = matchMember(data, { memberId, firstName, lastName, dob })
    if (!member) {
      setError('We could not match that information to a member in the current dataset.')
      return
    }
    setError('')
    selectMember(member.id, identityMode)
    navigate('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[var(--color-brand-surface)]">
      <div className="grid min-h-screen lg:grid-cols-[610px_minmax(0,1fr)]">
        <section className="relative overflow-hidden bg-[var(--color-brand-deep)] px-8 py-14 text-white sm:px-16">
          <div className="absolute -left-32 top-[540px] h-[520px] w-[520px] rounded-full bg-[var(--color-brand-teal)]/20" />
          <div className="absolute -right-16 top-[-120px] h-96 w-96 rounded-full bg-[var(--color-brand-lime)]/20" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--color-brand-lime)] text-xl font-bold">H</span>
            <div className="text-xl font-semibold">Humana Military</div>
          </div>
          <div className="relative mt-28 max-w-md space-y-6">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <span>●</span>
              PROACTIVE MEMBER SUPPORT
            </div>
            <h1 className="text-5xl font-bold leading-tight">Clear answers. Faster resolutions.</h1>
            <p className="text-lg leading-7 text-neutral-200">
              Understand claims, check coverage, and fix issues before they turn into another call.
            </p>
          </div>
          <div className="relative mt-24 space-y-4 text-base font-medium">
            {[
              'Plain-language Claim Stories',
              'Proactive claim and authorization alerts',
              'Secure help for members and families',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex rounded-xl bg-[var(--color-brand-lime)] px-1.5 py-[3px] text-xs font-bold text-white">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="relative mt-24 flex flex-wrap gap-3">
            {['Secure', 'Member-first', 'AI-assisted'].map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
          <div className="w-full max-w-3xl">
            <div className="mb-5 flex items-center justify-between text-xs font-medium text-[var(--color-brand-muted)]">
              <span>Secure member access</span>
              <span className="font-semibold text-[var(--color-brand-teal)]">English (US)</span>
            </div>
            <div className="card px-6 py-8 sm:px-10">
              <h2 className="text-3xl font-bold text-[var(--color-brand-ink)]">Welcome</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-brand-muted)]">
                Start by telling us who you are. We’ll guide you to the right secure experience.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {identityCards.map((card) => {
                  const active = card.mode === identityMode
                  return (
                    <button
                      key={card.mode}
                      type="button"
                      className={`focus-ring flex items-start gap-4 rounded-2xl px-4 py-4 text-left ${
                        active
                          ? 'bg-[var(--color-brand-mint)] outline outline-2 outline-[var(--color-brand-lime)]'
                          : 'bg-white outline outline-1 outline-[var(--color-brand-border)]'
                      }`}
                      onClick={() => setIdentityMode(card.mode)}
                    >
                      <span
                        className={`mt-1 h-5 w-5 rounded-full ${active ? 'border-[6px] border-[var(--color-brand-lime)] bg-white' : 'border-2 border-[var(--color-brand-muted)] bg-white'}`}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[var(--color-brand-ink)]">{card.title}</span>
                        <span className="block text-xs text-[var(--color-brand-muted)]">{card.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="my-6 h-px bg-[var(--color-brand-border)]" />
              <div className="mb-4 text-base font-semibold text-[var(--color-brand-ink)]">Verify your identity</div>

              {identityMode === 'helper' ? (
                <div className="mb-4 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-brand-surface)] px-4 py-4 text-sm text-[var(--color-brand-muted)]">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-full bg-[var(--color-brand-mint)] p-2 text-[var(--color-brand-teal)]">
                      <UserRoundCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold text-[var(--color-brand-ink)]">Authorized helper access</div>
                      <div className="mt-1">
                        Enter the member’s ID, name, and date of birth, then enter your own name and relationship exactly as they appear on the Release of Information record.
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--color-brand-ink)]">Member ID</span>
                  <input
                    className="focus-ring w-full rounded-xl border border-[var(--color-brand-border)] px-4 py-3.5"
                    placeholder="Enter member ID"
                    value={memberId}
                    onChange={(event) => setMemberId(event.target.value)}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[var(--color-brand-ink)]">First name</span>
                    <input
                      className="focus-ring w-full rounded-xl border border-[var(--color-brand-border)] px-4 py-3.5"
                      placeholder="First name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-[var(--color-brand-ink)]">Last name</span>
                    <input
                      className="focus-ring w-full rounded-xl border border-[var(--color-brand-border)] px-4 py-3.5"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-[var(--color-brand-ink)]">Date of birth</span>
                  <input
                    type="date"
                    className="focus-ring w-full rounded-xl border border-[var(--color-brand-border)] px-4 py-3.5"
                    value={dob}
                    onChange={(event) => setDob(event.target.value)}
                  />
                </label>

                {identityMode === 'helper' ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-[var(--color-brand-ink)]">Authorized helper full name</span>
                      <input
                        className="focus-ring w-full rounded-xl border border-[var(--color-brand-border)] px-4 py-3.5"
                        placeholder="Enter your name as listed on ROI access"
                        value={helperName}
                        onChange={(event) => setHelperName(event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-[var(--color-brand-ink)]">Relationship to member</span>
                      <select
                        className="focus-ring w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-3.5"
                        value={helperRelationship}
                        onChange={(event) => setHelperRelationship(event.target.value)}
                      >
                        <option value="">Select relationship</option>
                        {helperRelationshipOptions.map((relationship) => (
                          <option key={relationship} value={relationship}>
                            {relationship}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}

                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-[var(--color-alert-green)]">
                  <span className="flex rounded-xl bg-[var(--color-brand-teal)] p-1 text-white">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <span>Your information is encrypted and used only to verify access.</span>
                </div>

                {error ? <div className="rounded-xl bg-[var(--color-alert-red-bg)] px-4 py-3 text-sm text-[var(--color-alert-red)]">{error}</div> : null}

                <button
                  type="submit"
                  className="focus-ring inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-brand-lime)] px-4 py-4 text-base font-semibold text-white"
                >
                  Continue securely
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-[var(--color-brand-muted)]">
                By continuing, you agree to the privacy and security terms.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-[var(--color-brand-muted)]">
              <span>Privacy</span>
              <span>Accessibility</span>
              <span>Contact support</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
