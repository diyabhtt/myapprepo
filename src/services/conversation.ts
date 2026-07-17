import { translateStatusLabel, translateUi } from '@/lib/i18n'
import { type ChatMessage, type ClaimContext, type Member, type SuggestedQuestion, type SupportedLanguage } from '@/types'

export function generateClaimSummary(context: ClaimContext, language: SupportedLanguage = 'English'): string {
  return translateUi(language, 'assistantInitialClaim', {
    claimId: context.claim.id,
    serviceName: context.claim.serviceName,
  })
}

export function answerClaimQuestion(_question: string, context: ClaimContext, language: SupportedLanguage): string {
  return generateClaimSummary(context, language)
}

export function answerGeneralBenefitsQuestion(_question: string, member: Member, language: SupportedLanguage): string {
  return translateUi(language, 'assistantInitialGeneral', { firstName: member.firstName })
}

export function suggestedQuestions(context: ClaimContext | undefined, language: SupportedLanguage): SuggestedQuestion[] {
  if (context) {
    return [
      {
        id: `${context.claim.id}-0`,
        label: translateUi(language, 'questionWhyClaimStatus', {
          claimId: context.claim.id,
          status: translateStatusLabel(context.claim.statusLabel, language),
        }),
      },
      {
        id: `${context.claim.id}-1`,
        label: translateUi(language, 'questionWhoActs', { serviceName: context.claim.serviceName }),
      },
      {
        id: `${context.claim.id}-2`,
        label: translateUi(language, 'questionMemberCost', { serviceName: context.claim.serviceName }),
      },
      {
        id: `${context.claim.id}-3`,
        label: translateUi(language, 'questionReprocessTiming', { claimId: context.claim.id }),
      },
      {
        id: `${context.claim.id}-4`,
        label: translateUi(language, 'questionCoverage', { serviceName: context.claim.serviceName }),
      },
      {
        id: `${context.claim.id}-5`,
        label: translateUi(language, 'questionAccess'),
      },
    ]
  }

  return [
    { id: 'general-0', label: translateUi(language, 'questionAttention') },
    { id: 'general-1', label: translateUi(language, 'questionReferral') },
    { id: 'general-2', label: translateUi(language, 'questionCoverageGeneral') },
    { id: 'general-3', label: translateUi(language, 'questionFamilyAccess') },
  ]
}

export function initialAssistantMessage(context: ClaimContext | undefined, member: Member, language: SupportedLanguage): ChatMessage {
  return {
    id: `${context?.claim.id ?? 'general'}-welcome`,
    role: 'assistant',
    content: context
      ? translateUi(language, 'assistantInitialClaim', {
          claimId: context.claim.id,
          serviceName: context.claim.serviceName,
        })
      : translateUi(language, 'assistantInitialGeneral', { firstName: member.firstName }),
    timestamp: new Date().toISOString(),
    language,
  }
}
