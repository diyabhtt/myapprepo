import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { conversationKeyFor } from '@/lib/conversationRouting'
import { initialAssistantMessage } from '@/services/conversation'
import { getClaimContext, loadPrototypeData } from '@/services/prototypeData'
import { LANGUAGE_OPTIONS, type CallTranscriptEntry, type ChatMessage, type ClaimContext, type IdentityMode, type Member, type PrototypeData, type SupportedLanguage } from '@/types'

interface AppSessionState {
  currentMemberId?: string
  activeAuthorizationId?: string
  identityMode: IdentityMode
  selectedClaimId?: string
  chatLanguage: SupportedLanguage
  callLanguage: SupportedLanguage
  isMuted: boolean
  isSpeakerOn: boolean
  callStartedAt?: string
  chatHistories: Record<string, ChatMessage[]>
  callTranscripts: Record<string, CallTranscriptEntry[]>
}

interface AppContextValue extends AppSessionState {
  data: PrototypeData
  currentMember?: Member
  activeAuthorization?: import('@/types').ROIAuthorization
  selectMember: (memberId: string, identityMode: IdentityMode, authorizationId?: string) => void
  recoverMemberFromClaim: (claimId: string) => Member | undefined
  signOut: () => void
  setSelectedClaimId: (claimId?: string) => void
  setChatLanguage: (language: SupportedLanguage) => void
  setCallLanguage: (language: SupportedLanguage) => void
  setMuted: (value: boolean) => void
  setSpeakerOn: (value: boolean) => void
  ensureConversation: (claimId?: string, conversationId?: string) => void
  appendChatMessage: (message: ChatMessage, claimId?: string, conversationId?: string) => void
  clearConversation: (claimId?: string, conversationId?: string) => void
  appendCallTranscript: (entry: CallTranscriptEntry, claimId?: string, conversationId?: string) => void
  replaceCallTranscript: (entries: CallTranscriptEntry[], claimId?: string, conversationId?: string) => void
  startCall: () => void
  endCall: () => void
  getClaimContext: (claimId?: string) => ClaimContext | undefined
  getConversationKey: (claimId?: string, conversationId?: string) => string
}

const SESSION_STORAGE_KEY = 'member-claims-intelligence-session'

const defaultSessionState: AppSessionState = {
  identityMode: 'member',
  chatLanguage: LANGUAGE_OPTIONS[0],
  callLanguage: LANGUAGE_OPTIONS[0],
  isMuted: false,
  isSpeakerOn: true,
  chatHistories: {},
  callTranscripts: {},
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: PropsWithChildren) {
  const data = useMemo(() => loadPrototypeData(), [])
  const [state, setState] = useState<AppSessionState>(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return defaultSessionState
    try {
      return { ...defaultSessionState, ...JSON.parse(stored) } as AppSessionState
    } catch {
      return defaultSessionState
    }
  })

  useEffect(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const currentMember = state.currentMemberId ? data.membersById[state.currentMemberId] : undefined
  const activeAuthorization = state.activeAuthorizationId ? data.roiById[state.activeAuthorizationId] : undefined

  const getConversationKey = useCallback((claimId?: string, conversationId?: string): string => conversationKeyFor(claimId, conversationId), [])

  const getClaimContextForState = useCallback((claimId?: string): ClaimContext | undefined => {
    if (!claimId) return undefined
    return getClaimContext(data, claimId)
  }, [data])

  const selectMember = useCallback((memberId: string, identityMode: IdentityMode, authorizationId?: string): void => {
    setState((current) => ({
      ...current,
      currentMemberId: memberId,
      activeAuthorizationId: authorizationId,
      identityMode,
    }))
  }, [])

  const recoverMemberFromClaim = useCallback((claimId: string): Member | undefined => {
    const context = getClaimContext(data, claimId)
    if (!context) return undefined
    setState((current) => {
      if (current.currentMemberId === context.member.id && current.selectedClaimId === claimId) {
        return current
      }
      return {
        ...current,
        currentMemberId: context.member.id,
        selectedClaimId: claimId,
      }
    })
    return context.member
  }, [data])

  const signOut = useCallback((): void => {
    setState(defaultSessionState)
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }, [])

  const setSelectedClaimId = useCallback((claimId?: string): void => {
    setState((current) => (current.selectedClaimId === claimId ? current : { ...current, selectedClaimId: claimId }))
  }, [])

  const setChatLanguage = useCallback((language: SupportedLanguage): void => {
    setState((current) => (current.chatLanguage === language ? current : { ...current, chatLanguage: language }))
  }, [])

  const setCallLanguage = useCallback((language: SupportedLanguage): void => {
    setState((current) => (current.callLanguage === language ? current : { ...current, callLanguage: language }))
  }, [])

  const setMuted = useCallback((value: boolean): void => {
    setState((current) => (current.isMuted === value ? current : { ...current, isMuted: value }))
  }, [])

  const setSpeakerOn = useCallback((value: boolean): void => {
    setState((current) => (current.isSpeakerOn === value ? current : { ...current, isSpeakerOn: value }))
  }, [])

  const ensureConversation = useCallback((claimId?: string, conversationId?: string): void => {
    const key = getConversationKey(claimId, conversationId)
    const member = claimId ? getClaimContextForState(claimId)?.member : currentMember
    if (!member) return
    setState((current) => {
      if (current.chatHistories[key]?.length) return current
      return {
        ...current,
        chatHistories: {
          ...current.chatHistories,
          [key]: [initialAssistantMessage(getClaimContextForState(claimId), member, current.chatLanguage)],
        },
      }
    })
  }, [currentMember, getClaimContextForState, getConversationKey])

  const appendChatMessage = useCallback((message: ChatMessage, claimId?: string, conversationId?: string): void => {
    const key = getConversationKey(claimId, conversationId)
    setState((current) => ({
      ...current,
      chatHistories: {
        ...current.chatHistories,
        [key]: [...(current.chatHistories[key] ?? []), message],
      },
    }))
  }, [getConversationKey])

  const clearConversation = useCallback((claimId?: string, conversationId?: string): void => {
    const key = getConversationKey(claimId, conversationId)
    const member = claimId ? getClaimContextForState(claimId)?.member : currentMember
    if (!member) return
    setState((current) => ({
      ...current,
      chatHistories: {
        ...current.chatHistories,
        [key]: [initialAssistantMessage(getClaimContextForState(claimId), member, current.chatLanguage)],
      },
    }))
  }, [currentMember, getClaimContextForState, getConversationKey])

  const appendCallTranscript = useCallback((entry: CallTranscriptEntry, claimId?: string, conversationId?: string): void => {
    const key = getConversationKey(claimId, conversationId)
    setState((current) => ({
      ...current,
      callTranscripts: {
        ...current.callTranscripts,
        [key]: [...(current.callTranscripts[key] ?? []), entry],
      },
    }))
  }, [getConversationKey])

  const replaceCallTranscript = useCallback((entries: CallTranscriptEntry[], claimId?: string, conversationId?: string): void => {
    const key = getConversationKey(claimId, conversationId)
    setState((current) => ({
      ...current,
      callTranscripts: {
        ...current.callTranscripts,
        [key]: entries,
      },
    }))
  }, [getConversationKey])

  const startCall = useCallback((): void => {
    setState((current) => (current.callStartedAt ? current : { ...current, callStartedAt: new Date().toISOString() }))
  }, [])

  const endCall = useCallback((): void => {
    setState((current) => ({
      ...current,
      callStartedAt: undefined,
      isMuted: false,
      isSpeakerOn: true,
    }))
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      data,
      currentMember,
      activeAuthorization,
      selectMember,
      recoverMemberFromClaim,
      signOut,
      setSelectedClaimId,
      setChatLanguage,
      setCallLanguage,
      setMuted,
      setSpeakerOn,
      ensureConversation,
      appendChatMessage,
      clearConversation,
      appendCallTranscript,
      replaceCallTranscript,
      startCall,
      endCall,
      getClaimContext: getClaimContextForState,
      getConversationKey,
    }),
    [
      appendCallTranscript,
      appendChatMessage,
      clearConversation,
      currentMember,
      activeAuthorization,
      data,
      endCall,
      ensureConversation,
      getClaimContextForState,
      getConversationKey,
      recoverMemberFromClaim,
      replaceCallTranscript,
      selectMember,
      setCallLanguage,
      setChatLanguage,
      setMuted,
      setSelectedClaimId,
      setSpeakerOn,
      signOut,
      startCall,
      state,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider')
  }
  return context
}
