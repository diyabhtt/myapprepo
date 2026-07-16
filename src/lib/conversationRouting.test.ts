import { buildAssistantHref, buildCallHref, conversationKeyFor, createConversationId, parseConversationKey } from '@/lib/conversationRouting'

describe('conversationRouting', () => {
  it('creates claim and general conversation ids', () => {
    expect(createConversationId('CLM000155')).toContain('claim:CLM000155:')
    expect(createConversationId()).toContain('general:')
  })

  it('builds assistant and call hrefs with conversation ids', () => {
    expect(buildAssistantHref('CLM000155', 'claim:CLM000155:test')).toBe('/assistant?claimId=CLM000155&conversationId=claim%3ACLM000155%3Atest')
    expect(buildCallHref(undefined, 'general:test')).toBe('/call?conversationId=general%3Atest')
  })

  it('parses new and legacy conversation keys', () => {
    expect(parseConversationKey('claim:CLM000155:test')).toEqual({ claimId: 'CLM000155' })
    expect(parseConversationKey('CLM000155')).toEqual({ claimId: 'CLM000155' })
    expect(parseConversationKey('general')).toEqual({})
    expect(conversationKeyFor('CLM000155', 'claim:CLM000155:test')).toBe('claim:CLM000155:test')
  })
})
