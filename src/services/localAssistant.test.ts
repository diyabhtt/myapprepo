import { answerWithLocalData, answerWithLocalDataResult } from '@/services/localAssistant'
import { getClaimContext, loadPrototypeData } from '@/services/prototypeData'

describe('localAssistant', () => {
  it('answers the Nepali action-needed question from CSV-backed claim data', () => {
    const data = loadPrototypeData()
    const context = getClaimContext(data, 'CLM000151')
    const member = data.membersById.MBR00036

    expect(context).toBeDefined()

    const answer = answerWithLocalData({
      question: 'CLM000151 किन कारबाही आवश्यक छ?',
      language: 'Nepali',
      member,
      context,
    })

    expect(answer).toContain('हालको स्थिति')
    expect(answer).toContain('लाभ-समन्वयसम्बन्धी विवरण')
    expect(answer).toContain('सदस्य र प्रदायक')
    expect(answer).not.toContain('coordination of benefits')
    expect(answer).not.toContain(context?.claim.serviceName ?? '')
  })

  it('answers in Japanese instead of falling back to English', () => {
    const data = loadPrototypeData()
    const context = getClaimContext(data, 'CLM000151')
    const member = data.membersById.MBR00036

    expect(context).toBeDefined()

    const answer = answerWithLocalData({
      question: 'こんにちは',
      language: 'Japanese',
      member,
      context,
    })

    expect(answer).toContain('こんにちは')
    expect(answer).toContain('現在の状況')
    expect(answer).not.toContain('Hello. I reviewed claim')
  })

  it('reports the actual fallback language when a language pack is unavailable', () => {
    const data = loadPrototypeData()
    const context = getClaimContext(data, 'CLM000151')
    const member = data.membersById.MBR00036

    expect(context).toBeDefined()

    const reply = answerWithLocalDataResult({
      question: 'Hallo',
      language: 'German',
      member,
      context,
    })

    expect(reply.language).toBe('English')
    expect(reply.content).toContain('Hello. I reviewed claim')
  })
})
