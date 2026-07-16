import { ArrowLeft, MessageSquareText, Phone, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ChatComposer } from '@/components/ChatComposer'
import { ChatMessageBubble } from '@/components/ChatMessageBubble'
import { ClaimContextBanner } from '@/components/ClaimContextBanner'
import { EmptyState } from '@/components/EmptyState'
import { LanguageModal } from '@/components/LanguageModal'
import { ThinkingBubble } from '@/components/ThinkingBubble'
import { useAppContext } from '@/context/AppContext'
import { buildAssistantHref, buildCallHref, createConversationId, parseConversationKey } from '@/lib/conversationRouting'
import { relativeToneLabel } from '@/lib/formatters'
import { suggestedQuestions } from '@/services/conversation'
import { askOrchestrator } from '@/services/orchestratorApi'
import { type ChatMessage } from '@/types'

interface RecentItem {
  id: string
  href: string
  title: string
  detail: string
  timestamp: string
}

export function AssistantPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const claimId = searchParams.get('claimId') ?? undefined
  const conversationId = searchParams.get('conversationId') ?? undefined
  const {
    data,
    currentMember,
    activeAuthorization,
    identityMode,
    chatLanguage,
    clearConversation,
    appendChatMessage,
    ensureConversation,
    getClaimContext,
    chatHistories,
    callTranscripts,
    recoverMemberFromClaim,
    setChatLanguage,
    setSelectedClaimId,
    getConversationKey,
  } = useAppContext()
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | undefined>(undefined)
  const pendingConversationRef = useRef<{ claimId?: string; id: string } | undefined>(undefined)

  if (!conversationId && (!pendingConversationRef.current || pendingConversationRef.current.claimId !== claimId)) {
    pendingConversationRef.current = { claimId, id: createConversationId(claimId) }
  }

  const activeConversationId = conversationId ?? pendingConversationRef.current?.id

  useEffect(() => {
    if (claimId) {
      recoverMemberFromClaim(claimId)
      setSelectedClaimId(claimId)
    }
  }, [claimId, recoverMemberFromClaim, setSelectedClaimId])

  useEffect(() => {
    if (!conversationId && activeConversationId) {
      navigate(buildAssistantHref(claimId, activeConversationId), { replace: true })
    }
  }, [activeConversationId, claimId, conversationId, navigate])

  const context = useMemo(() => (claimId ? getClaimContext(claimId) : undefined), [claimId, getClaimContext])
  const member = context?.member ?? currentMember
  const conversationKey = getConversationKey(claimId, activeConversationId)
  const messages = chatHistories[conversationKey] ?? []

  useEffect(() => {
    ensureConversation(claimId, activeConversationId)
  }, [activeConversationId, claimId, ensureConversation])

  const recentItems = useMemo<RecentItem[]>(() => {
    if (!member) return []

    const items: RecentItem[] = []

    for (const [key, entries] of Object.entries(chatHistories)) {
      if (!entries.length) continue
      const parsed = parseConversationKey(key)
      const claim = parsed.claimId ? data.claimsById[parsed.claimId] : undefined
      const lastEntry = entries[entries.length - 1]
      items.push({
        id: `chat-${key}`,
        href: buildAssistantHref(parsed.claimId, key),
        title: claim ? claim.serviceName : `Questions for ${member.fullName}`,
        detail: claim ? `Chat • ${claim.id}` : 'Chat • General benefits and claims',
        timestamp: lastEntry.timestamp,
      })
    }

    for (const [key, entries] of Object.entries(callTranscripts)) {
      if (!entries.length) continue
      const parsed = parseConversationKey(key)
      const claim = parsed.claimId ? data.claimsById[parsed.claimId] : undefined
      const lastEntry = entries[entries.length - 1]
      items.push({
        id: `call-${key}`,
        href: buildCallHref(parsed.claimId, key),
        title: claim ? `${claim.serviceName} call` : `${member.fullName} voice call`,
        detail: claim ? `Call • ${claim.id}` : 'Call • General benefits and claims',
        timestamp: lastEntry.timestamp,
      })
    }

    if (!items.length) {
      return (data.claimsByMemberId[member.id] ?? [])
        .filter((claim) => claim.needsAttention)
        .slice(0, 3)
        .map((claim) => ({
          id: `claim-${claim.id}`,
          href: buildAssistantHref(claim.id, createConversationId(claim.id)),
          title: claim.serviceName,
          detail: `${claim.statusLabel} • ${claim.id}`,
          timestamp: claim.serviceDate,
        }))
    }

    return items.sort((first, second) => second.timestamp.localeCompare(first.timestamp)).slice(0, 5)
  }, [callTranscripts, chatHistories, data.claimsById, data.claimsByMemberId, member])

  if (!member) {
    return <Navigate to="/" replace />
  }
  const activeMember = member

  async function sendMessage(question: string): Promise<void> {
    const userMessage: ChatMessage = {
      id: `${conversationKey}-${Date.now()}-user`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
      language: chatLanguage,
    }
    appendChatMessage(userMessage, claimId, activeConversationId)
    setSendError(undefined)
    setIsSending(true)
    try {
      const answer = await askOrchestrator({
        conversationKey,
        memberId: activeMember.id,
        claimId,
        callerName: identityMode === 'helper' ? activeAuthorization?.authorizedCallerName : undefined,
        question,
      })
      appendChatMessage(
        {
          id: `${conversationKey}-${Date.now()}-assistant`,
          role: 'assistant',
          content: answer,
          timestamp: new Date().toISOString(),
          language: chatLanguage,
        },
        claimId,
        activeConversationId,
      )
    } catch {
      setSendError('Could not reach the assistant backend. Confirm adk web is running and try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-brand-surface)] xl:grid xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="hidden bg-[var(--color-brand-deep)] px-7 py-10 text-white xl:flex xl:flex-col">
        <div className="text-xl font-bold">AI Assistant</div>
        <div className="mt-2 text-xs font-medium text-lime-300">● Online and secure</div>
        {identityMode === 'helper' && activeAuthorization ? (
          <div className="mt-6 rounded-2xl bg-white/10 px-4 py-4 text-sm text-slate-100">
            Helping {activeMember.fullName} as {activeAuthorization.authorizedCallerName} ({activeAuthorization.relationship})
          </div>
        ) : null}
        <button
          type="button"
          className="focus-ring motion-surface mt-10 inline-flex rounded-xl bg-[var(--color-brand-lime)] px-5 py-3 text-base font-semibold text-[var(--color-brand-ink)] shadow-[0_14px_32px_rgba(132,204,22,0.2)] hover:-translate-y-0.5"
          onClick={() => {
            const nextConversationId = createConversationId()
            setSelectedClaimId(undefined)
            navigate(buildAssistantHref(undefined, nextConversationId))
          }}
        >
          ＋ New conversation
        </button>
        <div className="mt-10 text-xs font-bold tracking-[0.08em] text-slate-400">SAVED HISTORY</div>
        <div className="mt-6 space-y-4">
          {recentItems.map((item) => (
            <Link key={item.id} to={item.href} className="focus-ring motion-surface block rounded-2xl bg-white/5 px-4 py-3 hover:-translate-y-0.5 hover:bg-white/10">
              <div className="text-sm font-medium text-white">{item.title}</div>
              <div className="mt-1 text-xs text-slate-300">{item.detail}</div>
            </Link>
          ))}
        </div>
        <div className="mt-auto pt-24 text-xs leading-5 text-slate-300">
          Responses use the member, claim, coverage, and ROI records already loaded in this local session.
        </div>
      </aside>

      <section className="flex min-h-screen flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-brand-border)] bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
          <button type="button" className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-border)] px-4 py-2 text-sm font-semibold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <h1 className="text-2xl font-bold text-[var(--color-brand-ink)]">How can I help today?</h1>
          <div className="ml-auto flex flex-wrap gap-3">
            <button type="button" className="focus-ring rounded-xl border border-[var(--color-brand-border)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-ink)]" onClick={() => setShowLanguageModal(true)}>
              🌐 {chatLanguage}
            </button>
            <Link to={buildCallHref(claimId, activeConversationId)} className="focus-ring motion-surface rounded-xl bg-[var(--color-brand-teal)] px-4 py-3 text-sm font-semibold text-white hover:-translate-y-0.5">
              <Phone className="mr-2 inline h-4 w-4" />
              Start voice call
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
          <p className="text-base text-[var(--color-brand-muted)]">Ask about claims, coverage, referrals, prior authorization, costs, or authorized family access.</p>

          {context ? <ClaimContextBanner context={context} /> : null}

          <section className="card motion-surface flex-1 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-brand-ink)]">Conversation</div>
                <div className="text-xs text-[var(--color-brand-muted)]">{relativeToneLabel(chatLanguage)}</div>
              </div>
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--color-brand-border)] px-4 py-2 text-xs font-semibold text-[var(--color-brand-muted)] hover:-translate-y-0.5"
                onClick={() => clearConversation(claimId, activeConversationId)}
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            {messages.length > 0 || isSending ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                {isSending ? <ThinkingBubble /> : null}
              </div>
            ) : (
              <EmptyState title="No conversation yet" description="Ask a question to start the shared assistant." />
            )}

            {sendError ? (
              <div className="mt-4 rounded-2xl border border-[var(--color-alert-red)]/30 bg-[var(--color-alert-red)]/10 px-4 py-3 text-sm text-[var(--color-alert-red)]">
                {sendError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {suggestedQuestions(context, chatLanguage).map((question) => (
                <button
                  key={question.id}
                  type="button"
                  disabled={isSending}
                  className="focus-ring rounded-full border border-[var(--color-brand-border)] bg-[var(--color-brand-surface)] px-4 py-2 text-sm text-[var(--color-brand-ink)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => sendMessage(question.label)}
                >
                  {question.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <ChatComposer placeholder="Type your question…" onSend={sendMessage} disabled={isSending} />
            </div>
          </section>

          <div className="motion-surface rounded-3xl border border-[var(--color-brand-border)] bg-white px-4 py-3 text-xs text-[var(--color-brand-muted)]">
            <MessageSquareText className="mr-2 inline h-4 w-4 text-[var(--color-brand-teal)]" />
            Answers stay grounded in the local member, claim, coverage, scheduling, and ROI records loaded from the CSV files.
          </div>
        </div>
      </section>

      {showLanguageModal ? (
        <LanguageModal
          title="Chat language"
          selectedLanguage={chatLanguage}
          onClose={() => setShowLanguageModal(false)}
          onSelect={(language) => {
            setChatLanguage(language)
            setShowLanguageModal(false)
          }}
        />
      ) : null}
    </main>
  )
}
