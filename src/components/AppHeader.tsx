import { CircleHelp, LogOut } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { buildAssistantHref, createConversationId } from '@/lib/conversationRouting'
import { maskMemberId } from '@/lib/formatters'
import { type Member, type ROIAuthorization } from '@/types'

interface AppHeaderProps {
  member?: Member
  activeAuthorization?: ROIAuthorization
  onSignOut?: () => void
}

const navItems: Array<{ label: string; to: string; createsFreshConversation?: boolean }> = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Claims', to: '/claims' },
  { label: 'Coverage', to: '/assistant', createsFreshConversation: true },
  { label: 'My Care', to: '/dashboard#care' },
]

export function AppHeader({ member, activeAuthorization, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-brand-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <button
          type="button"
          className="focus-ring flex items-center gap-3 text-left"
          onClick={() => navigate('/dashboard')}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-lime)] font-bold text-white">
            H
          </span>
          <span>
            <span className="block text-xl font-bold text-[var(--color-brand-ink)]">MemberPath AI</span>
            <span className="block text-xs text-[var(--color-brand-muted)]">Member & Claims Intelligence</span>
          </span>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-3 lg:flex">
          {navItems.map((item) => (
            item.createsFreshConversation ? (
              <button
                key={item.label}
                type="button"
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium ${
                  location.pathname === '/assistant' ? 'bg-[var(--color-brand-mint)] text-[var(--color-brand-ink)]' : 'text-[var(--color-brand-muted)]'
                }`}
                onClick={() => navigate(buildAssistantHref(undefined, createConversationId()))}
              >
                {item.label}
              </button>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `focus-ring rounded-full px-4 py-2 text-sm font-medium ${
                    isActive ? 'bg-[var(--color-brand-mint)] text-[var(--color-brand-ink)]' : 'text-[var(--color-brand-muted)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="focus-ring hidden rounded-full bg-[var(--color-brand-mint)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-ink)] sm:inline-flex"
          >
            <CircleHelp className="mr-2 h-4 w-4" />
            Help
          </button>
          {member ? (
            <div className="hidden rounded-2xl border border-[var(--color-brand-border)] px-4 py-2 md:block">
              <div className="text-xs font-bold text-[var(--color-brand-muted)]">PLAN</div>
              <div className="text-sm font-semibold text-[var(--color-brand-ink)]">{member.planType}</div>
              <div className="text-xs text-[var(--color-brand-muted)]">Member ID: {maskMemberId(member.id)}</div>
              {activeAuthorization ? (
                <div className="mt-1 text-xs text-[var(--color-brand-teal)]">
                  Helping as {activeAuthorization.authorizedCallerName}
                </div>
              ) : null}
            </div>
          ) : null}
          {member ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-deep)] text-sm font-bold text-white">
                {member.initials}
              </div>
              {onSignOut ? (
                <button
                  type="button"
                  className="focus-ring rounded-full border border-[var(--color-brand-border)] p-2 text-[var(--color-brand-muted)]"
                  aria-label="Sign out"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
