import { initialAssistantMessage, suggestedQuestions } from '@/services/conversation'
import { getClaimContext, loadPrototypeData } from '@/services/prototypeData'

describe('conversation language helpers', () => {
  it('seeds claim conversations in the selected language', () => {
    const data = loadPrototypeData()
    const context = getClaimContext(data, 'CLM000155')
    const member = data.membersById.MBR00036

    expect(context).toBeDefined()

    const message = initialAssistantMessage(context, member, 'Spanish')

    expect(message.content).toContain('Estoy listo para ayudarte con la reclamación CLM000155')
    expect(message.content).not.toContain(context?.claim.serviceName ?? '')
  })

  it('translates suggested questions for claim context', () => {
    const data = loadPrototypeData()
    const context = getClaimContext(data, 'CLM000155')

    expect(context).toBeDefined()

    const questions = suggestedQuestions(context, 'Spanish')

    expect(questions[0]?.label).toContain('¿Por qué CLM000155')
    expect(questions[1]?.label).toContain('¿Quién debe actuar ahora en esta reclamación?')
    expect(questions[1]?.label).not.toContain(context?.claim.serviceName ?? '')
  })

  it('seeds Japanese claim conversations in Japanese', () => {
    const data = loadPrototypeData()
    const context = getClaimContext(data, 'CLM000155')
    const member = data.membersById.MBR00036

    expect(context).toBeDefined()

    const message = initialAssistantMessage(context, member, 'Japanese')

    expect(message.content).toContain('請求 CLM000155')
    expect(message.content).not.toContain('I’m ready to help with claim')
  })
})
