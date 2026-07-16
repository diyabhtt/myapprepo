const ORCHESTRATOR_BASE_URL = (import.meta.env.VITE_ORCHESTRATOR_URL as string | undefined) ?? 'http://127.0.0.1:8000'
const APP_NAME = 'orchestrator'
const USER_ID = 'frontend-user'
const SESSION_MAP_STORAGE_KEY = 'member-claims-intelligence-orchestrator-sessions'

function loadSessionIdsByConversationKey(): Map<string, string> {
  try {
    const stored = sessionStorage.getItem(SESSION_MAP_STORAGE_KEY)
    if (!stored) return new Map()
    return new Map(Object.entries(JSON.parse(stored) as Record<string, string>))
  } catch {
    return new Map()
  }
}

const sessionIdsByConversationKey = loadSessionIdsByConversationKey()

function persistSessionIdsByConversationKey(): void {
  sessionStorage.setItem(SESSION_MAP_STORAGE_KEY, JSON.stringify(Object.fromEntries(sessionIdsByConversationKey)))
}

interface RunEventPart {
  text?: string
  functionCall?: unknown
  functionResponse?: unknown
}

interface RunEventContent {
  role?: string
  parts?: RunEventPart[]
}

interface RunEvent {
  content?: RunEventContent
  partial?: boolean
}

async function createSession(): Promise<string> {
  const response = await fetch(`${ORCHESTRATOR_BASE_URL}/apps/${APP_NAME}/users/${USER_ID}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!response.ok) {
    throw new Error(`Failed to create orchestrator session (HTTP ${response.status})`)
  }
  const session = (await response.json()) as { id: string }
  return session.id
}

async function getOrCreateSessionId(conversationKey: string): Promise<string> {
  const existing = sessionIdsByConversationKey.get(conversationKey)
  if (existing) return existing

  const sessionId = await createSession()
  sessionIdsByConversationKey.set(conversationKey, sessionId)
  persistSessionIdsByConversationKey()
  return sessionId
}

function isFinalResponseEvent(event: RunEvent): boolean {
  if (event.partial) return false
  const parts = event.content?.parts ?? []
  if (parts.length === 0) return false
  const hasFunctionCall = parts.some((part) => part.functionCall)
  const hasFunctionResponse = parts.some((part) => part.functionResponse)
  const hasText = parts.some((part) => part.text)
  return hasText && !hasFunctionCall && !hasFunctionResponse
}

function extractFinalText(events: RunEvent[]): string {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (isFinalResponseEvent(event)) {
      return (event.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim()
    }
  }
  return ''
}

export interface AskOrchestratorParams {
  conversationKey: string
  memberId?: string
  claimId?: string
  callerName?: string
  question: string
}

function buildContextualMessage({ memberId, claimId, callerName, question }: AskOrchestratorParams): string {
  const contextParts: string[] = []
  if (callerName) contextParts.push(`Caller identifies themself as: ${callerName}.`)
  if (memberId) contextParts.push(`Member ID: ${memberId}.`)
  if (claimId) contextParts.push(`Claim ID: ${claimId}.`)
  const context = contextParts.length ? `[${contextParts.join(' ')}] ` : ''
  return `${context}${question}`
}

async function runTurn(sessionId: string, message: string): Promise<Response> {
  return fetch(`${ORCHESTRATOR_BASE_URL}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_name: APP_NAME,
      user_id: USER_ID,
      session_id: sessionId,
      new_message: { role: 'user', parts: [{ text: message }] },
    }),
  })
}

export async function askOrchestrator(params: AskOrchestratorParams): Promise<string> {
  const message = buildContextualMessage(params)
  let sessionId = await getOrCreateSessionId(params.conversationKey)
  let response = await runTurn(sessionId, message)

  if (response.status === 404) {
    // A session ID persisted from a previous backend process is no longer
    // known to the (possibly restarted) backend -- start a fresh one.
    sessionIdsByConversationKey.delete(params.conversationKey)
    sessionId = await getOrCreateSessionId(params.conversationKey)
    response = await runTurn(sessionId, message)
  }

  if (!response.ok) {
    throw new Error(`Orchestrator request failed (HTTP ${response.status})`)
  }

  const events = (await response.json()) as RunEvent[]
  return extractFinalText(events) || "I wasn't able to generate a response. Please try again."
}
