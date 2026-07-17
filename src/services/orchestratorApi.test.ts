import { buildContextualMessage } from '@/services/orchestratorApi'

describe('orchestratorApi', () => {
  it('includes the selected language contract and member context', () => {
    const message = buildContextualMessage({
      conversationKey: 'claim:CLM000155:test-thread',
      memberId: 'MBR00036',
      claimId: 'CLM000155',
      callerName: 'Isabel Brown',
      responseLanguage: 'Spanish',
      question: '¿Qué pasó con esta reclamación?',
    })

    expect(message).toContain('The selected reply language is Spanish.')
    expect(message).toContain('Respond entirely in Spanish unless the user explicitly asks to switch languages.')
    expect(message).toContain('Caller identifies themself as: Isabel Brown.')
    expect(message).toContain('Member ID: MBR00036.')
    expect(message).toContain('Claim ID: CLM000155.')
    expect(message).toContain('¿Qué pasó con esta reclamación?')
  })
})
