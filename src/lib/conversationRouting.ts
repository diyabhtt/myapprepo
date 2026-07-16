export function createConversationId(claimId?: string): string {
  const timestamp = new Date().toISOString()
  return claimId ? `claim:${claimId}:${timestamp}` : `general:${timestamp}`
}

export function conversationKeyFor(claimId?: string, conversationId?: string): string {
  return conversationId ?? claimId ?? 'general'
}

export function parseConversationKey(key: string): { claimId?: string } {
  if (key === 'general' || key.startsWith('general:')) {
    return {}
  }
  if (key.startsWith('claim:')) {
    const [, claimId] = key.split(':')
    return { claimId }
  }
  return { claimId: key }
}

export function buildAssistantHref(claimId?: string, conversationId?: string): string {
  const params = new URLSearchParams()
  if (claimId) params.set('claimId', claimId)
  if (conversationId) params.set('conversationId', conversationId)
  const query = params.toString()
  return query ? `/assistant?${query}` : '/assistant'
}

export function buildCallHref(claimId?: string, conversationId?: string): string {
  const params = new URLSearchParams()
  if (claimId) params.set('claimId', claimId)
  if (conversationId) params.set('conversationId', conversationId)
  const query = params.toString()
  return query ? `/call?${query}` : '/call'
}
