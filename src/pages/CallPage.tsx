import { ArrowLeft, Globe2, Mic, MicOff, PhoneOff, Type, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ChatComposer } from '@/components/ChatComposer'
import { LanguageModal } from '@/components/LanguageModal'
import { useAppContext } from '@/context/AppContext'
import { buildAssistantHref, buildCallHref, createConversationId } from '@/lib/conversationRouting'
import { formatLongDate, formatTimer } from '@/lib/formatters'
import { browserSpeechSupported, createSpeechRecognition, speakText, type BrowserSpeechRecognition } from '@/services/browserSpeech'
import { answerClaimQuestion, answerGeneralBenefitsQuestion } from '@/services/conversation'

type CallStatus = 'ready' | 'listening' | 'thinking' | 'speaking'

export function CallPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const claimId = searchParams.get('claimId') ?? undefined
  const conversationId = searchParams.get('conversationId') ?? undefined
  const {
    currentMember,
    activeAuthorization,
    callLanguage,
    callStartedAt,
    callTranscripts,
    isMuted,
    isSpeakerOn,
    getClaimContext,
    recoverMemberFromClaim,
    setSelectedClaimId,
    setCallLanguage,
    setMuted,
    setSpeakerOn,
    appendCallTranscript,
    replaceCallTranscript,
    startCall,
    endCall,
    getConversationKey,
  } = useAppContext()
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showTypedComposer, setShowTypedComposer] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [callStatus, setCallStatus] = useState<CallStatus>('ready')
  const [voiceNotice, setVoiceNotice] = useState('')
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const liveTranscriptRef = useRef('')
  const transcriptBufferRef = useRef('')
  const transcriptHandledRef = useRef(false)
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
      navigate(buildCallHref(claimId, activeConversationId), { replace: true })
    }
  }, [activeConversationId, claimId, conversationId, navigate])

  const context = useMemo(() => (claimId ? getClaimContext(claimId) : undefined), [claimId, getClaimContext])
  const member = context?.member ?? currentMember
  const transcriptKey = getConversationKey(claimId, activeConversationId)
  const transcript = callTranscripts[transcriptKey] ?? []
  const speechSupported = browserSpeechSupported()
  const recentTranscript = transcript.slice(-6)

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript
  }, [liveTranscript])

  useEffect(() => {
    if (!member) return
    if (!callStartedAt) {
      startCall()
      const intro = context
        ? `Secure call started for ${context.claim.serviceName}. ${context.claim.nextStep}`
        : `Secure call started for ${member.fullName}. Ask about claims, coverage, referrals, or family access.`
      replaceCallTranscript(
        [
          {
            id: `${transcriptKey}-intro`,
            speaker: 'assistant',
            content: intro,
            timestamp: new Date().toISOString(),
            language: callLanguage,
          },
        ],
        claimId,
        activeConversationId,
      )
    }
  }, [activeConversationId, callLanguage, callStartedAt, claimId, context, member, replaceCallTranscript, startCall, transcriptKey])

  useEffect(() => {
    if (!callStartedAt) return undefined
    const started = new Date(callStartedAt).getTime()
    const interval = window.setInterval(() => {
      setSecondsElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [callStartedAt])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (!member) {
    return <Navigate to="/" replace />
  }
  const activeMember = member

  function appendMemberSpeech(message: string): void {
    appendCallTranscript(
      {
        id: `${transcriptKey}-${Date.now()}-member`,
        speaker: 'member',
        content: message,
        timestamp: new Date().toISOString(),
        language: callLanguage,
      },
      claimId,
      activeConversationId,
    )
  }

  function appendAssistantSpeech(message: string): void {
    appendCallTranscript(
      {
        id: `${transcriptKey}-${Date.now()}-assistant`,
        speaker: 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
        language: callLanguage,
      },
      claimId,
      activeConversationId,
    )
  }

  function answerMessage(message: string): void {
    const response = context ? answerClaimQuestion(message, context, callLanguage) : answerGeneralBenefitsQuestion(message, activeMember, callLanguage)
    setCallStatus('speaking')
    appendAssistantSpeech(response)
    const spoken = isSpeakerOn ? speakText(response, callLanguage, () => setCallStatus('ready')) : false
    if (!spoken || !isSpeakerOn) {
      setCallStatus('ready')
    }
  }

  function finalizeCapturedSpeech(rawMessage: string): void {
    const message = rawMessage.trim()
    transcriptHandledRef.current = true
    setLiveTranscript('')
    liveTranscriptRef.current = ''
    transcriptBufferRef.current = ''
    if (!message) {
      setVoiceNotice('I did not catch that. Hold to talk and try again, or use Type instead.')
      setCallStatus('ready')
      return
    }
    setVoiceNotice('')
    appendMemberSpeech(message)
    setCallStatus('thinking')
    window.setTimeout(() => answerMessage(message), 450)
  }

  function stopRecognition(): void {
    recognitionRef.current?.stop()
  }

  function startListening(): void {
    if (isMuted) {
      setVoiceNotice('Your microphone is muted. Unmute it before using push to talk.')
      return
    }
    if (!speechSupported) {
      setShowTypedComposer(true)
      setVoiceNotice('Voice recognition is not available in this browser. Use Type instead.')
      return
    }

    recognitionRef.current?.abort()
    transcriptHandledRef.current = false
    transcriptBufferRef.current = ''
    setLiveTranscript('')
    setVoiceNotice('')
    setCallStatus('listening')

    const recognition = createSpeechRecognition(callLanguage)
    if (!recognition) {
      setShowTypedComposer(true)
      setVoiceNotice('Voice recognition is not available in this browser. Use Type instead.')
      setCallStatus('ready')
      return
    }

    recognition.onresult = (event) => {
      let finalTranscript = transcriptBufferRef.current
      let interimTranscript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcriptText = Array.from({ length: result.length }, (_, alternativeIndex) => result[alternativeIndex].transcript).join(' ').trim()
        if (!transcriptText) continue
        if (result.isFinal) {
          finalTranscript = `${finalTranscript} ${transcriptText}`.trim()
        } else {
          interimTranscript = `${interimTranscript} ${transcriptText}`.trim()
        }
      }
      transcriptBufferRef.current = finalTranscript
      setLiveTranscript(`${finalTranscript} ${interimTranscript}`.trim())
    }

    recognition.onerror = (event) => {
      setCallStatus('ready')
      setVoiceNotice(event.error === 'not-allowed' ? 'Microphone access was blocked. Use Type instead or allow microphone access.' : `Voice capture error: ${event.error}`)
    }

    recognition.onend = () => {
      recognitionRef.current = null
      if (transcriptHandledRef.current) return
      finalizeCapturedSpeech(transcriptBufferRef.current || liveTranscriptRef.current)
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  function sendTypedFallback(message: string): void {
    appendMemberSpeech(message)
    setCallStatus('thinking')
    setVoiceNotice('')
    window.setTimeout(() => answerMessage(message), 450)
  }

  const statusLabel =
    callStatus === 'listening'
      ? 'Listening'
      : callStatus === 'thinking'
        ? 'Thinking'
        : callStatus === 'speaking'
          ? 'Speaking'
          : 'Ready'
  const statusAccentClass =
    callStatus === 'listening'
      ? 'text-lime-300'
      : callStatus === 'thinking'
        ? 'text-amber-200'
        : callStatus === 'speaking'
          ? 'text-sky-200'
          : 'text-slate-200'
  const waveformActive = callStatus !== 'ready'
  const callSummary = context
    ? `${context.claim.serviceName} • ${context.claim.id} • ${context.claim.providerName}`
    : `Benefits and claims support for ${member.fullName}`

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#164f46,_#0b2f2b_55%,_#061614_100%)] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <button type="button" className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold" onClick={() => navigate(buildAssistantHref(claimId, activeConversationId))}>
          <ArrowLeft className="h-4 w-4" />
          Back to chat
        </button>
        <div className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold">
          Secure voice call • {callLanguage}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[430px]">
        <div className="overflow-hidden rounded-[42px] border border-white/10 bg-white/8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="relative min-h-[820px] overflow-hidden bg-[linear-gradient(180deg,rgba(18,79,71,0.96)_0%,rgba(8,34,32,0.98)_58%,rgba(4,18,17,1)_100%)] p-6 sm:p-7">
            <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute -right-12 top-48 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative flex items-center justify-between text-xs font-medium text-slate-200">
              <div className="rounded-full bg-white/10 px-3 py-1.5">Connected</div>
              <div>{formatTimer(secondsElapsed)}</div>
            </div>

            <div className="relative mt-12 flex flex-col items-center text-center">
              <div className={`flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10 text-3xl font-bold shadow-[0_0_0_12px_rgba(255,255,255,0.05)] ${waveformActive ? 'animate-pulse' : ''}`}>
                AI
              </div>
              <div className={`mt-6 text-sm uppercase tracking-[0.16em] ${statusAccentClass}`}>{statusLabel}</div>
              <h1 className="mt-3 text-3xl font-bold">Claims Assistant</h1>
              <p className="mt-2 text-sm text-slate-200">Helping {member.fullName}</p>
              <p className="mt-2 max-w-[280px] text-xs leading-5 text-slate-300">{callSummary}</p>
              {context ? (
                <div className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs text-slate-100">
                  Service date {formatLongDate(context.claim.serviceDate)}
                </div>
              ) : null}
              {activeAuthorization ? (
                <div className="mt-3 rounded-full bg-white/10 px-4 py-2 text-xs text-slate-100">
                  Signed in as {activeAuthorization.authorizedCallerName} • {activeAuthorization.relationship}
                </div>
              ) : null}
            </div>

            <div className="relative mt-10 flex items-end justify-center gap-2">
              {[20, 34, 50, 34, 20].map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className={`w-2 rounded-full bg-white/85 ${waveformActive ? 'animate-pulse' : 'opacity-60'}`}
                  style={{ height }}
                />
              ))}
            </div>

            {liveTranscript ? (
              <div className="relative mt-8 rounded-[26px] border border-lime-300/25 bg-lime-300/10 px-4 py-4 text-sm text-lime-50">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-200">You are saying</div>
                <div>{liveTranscript}</div>
              </div>
            ) : null}

            {voiceNotice ? (
              <div className="relative mt-4 rounded-[22px] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-50">
                {voiceNotice}
              </div>
            ) : null}

            {showTypedComposer ? (
              <div className="relative mt-5 rounded-[26px] bg-white/10 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Type instead</div>
                <ChatComposer placeholder="Type instead of speaking…" onSend={sendTypedFallback} />
              </div>
            ) : null}

            <div className="relative mt-6 rounded-[28px] bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Call history</div>
                  <div className="text-[11px] text-slate-300">Saved in this local session</div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium">{callLanguage}</div>
              </div>
              <div className="max-h-[180px] space-y-3 overflow-y-auto pr-1">
                {recentTranscript.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-3xl px-4 py-3 text-sm ${
                      entry.speaker === 'assistant'
                        ? 'bg-white/10 text-white'
                        : entry.speaker === 'member'
                          ? 'ml-auto bg-[var(--color-brand-lime)] text-[var(--color-brand-ink)]'
                          : 'bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">{entry.speaker}</div>
                    <div>{entry.content}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-6">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`focus-ring flex flex-col items-center gap-2 rounded-3xl px-4 py-3 text-xs font-medium ${isMuted ? 'bg-white/10 text-white' : 'bg-white text-[var(--color-brand-ink)]'}`}
                  onClick={() => setMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>

                <button
                  type="button"
                  className={`focus-ring flex flex-col items-center gap-2 rounded-3xl px-4 py-3 text-xs font-medium ${isSpeakerOn ? 'bg-white text-[var(--color-brand-ink)]' : 'bg-white/10 text-white'}`}
                  onClick={() => setSpeakerOn(!isSpeakerOn)}
                >
                  {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  {isSpeakerOn ? 'Speaker' : 'Earpiece'}
                </button>

                <button
                  type="button"
                  className="focus-ring flex flex-col items-center gap-2 rounded-3xl bg-white/10 px-4 py-3 text-xs font-medium text-white"
                  onClick={() => setShowLanguageModal(true)}
                >
                  <Globe2 className="h-5 w-5" />
                  Language
                </button>
              </div>

              <button
                type="button"
                className={`focus-ring mt-4 flex w-full items-center justify-center rounded-[32px] px-6 py-4 text-base font-semibold ${
                  callStatus === 'listening' ? 'bg-[var(--color-brand-lime)] text-[var(--color-brand-ink)]' : 'bg-white text-[var(--color-brand-ink)]'
                }`}
                onPointerDown={(event) => {
                  event.preventDefault()
                  startListening()
                }}
                onPointerUp={stopRecognition}
                onPointerCancel={stopRecognition}
                onPointerLeave={() => {
                  if (callStatus === 'listening') {
                    stopRecognition()
                  }
                }}
              >
                <Mic className="mr-3 h-5 w-5" />
                {callStatus === 'listening' ? 'Release to send' : 'Hold to talk'}
              </button>

              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_88px] gap-3">
                <button
                  type="button"
                  className={`focus-ring flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-medium ${showTypedComposer ? 'bg-white text-[var(--color-brand-ink)]' : 'bg-white/10 text-white'}`}
                  onClick={() => setShowTypedComposer((current) => !current)}
                >
                  <Type className="h-5 w-5" />
                  Type instead
                </button>

                <button
                  type="button"
                  className="focus-ring flex items-center justify-center rounded-full bg-[var(--color-alert-red)] text-white shadow-[0_12px_24px_rgba(193,39,45,0.35)]"
                  onClick={() => {
                    endCall()
                    navigate(buildAssistantHref(claimId, activeConversationId))
                  }}
                  aria-label="End call"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
              </div>

              {!speechSupported ? (
                <div className="mt-4 text-center text-[11px] text-slate-300">
                  Voice recognition is unavailable in this browser. Use the typed fallback control instead.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showLanguageModal ? (
        <LanguageModal
          title="Call language"
          selectedLanguage={callLanguage}
          onClose={() => setShowLanguageModal(false)}
          onSelect={(language) => {
            setCallLanguage(language)
            setShowLanguageModal(false)
          }}
        />
      ) : null}
    </main>
  )
}
