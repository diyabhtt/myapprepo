import { formatCurrency, formatLongDate } from '@/lib/formatters'
import { type ChatMessage, type ClaimContext, type Member, type SuggestedQuestion, type SupportedLanguage } from '@/types'

function languagePrefix(language: SupportedLanguage): string {
  return language === 'English' ? '' : `[${language}] `
}

function translateQuestion(question: string, language: SupportedLanguage): string {
  if (language === 'English') return question
  return `${question} (${language})`
}

function coverageLine(context: ClaimContext): string {
  if (!context.coverageRule) {
    return 'Coverage rule data was not found for this CPT code, so the member cost and coverage details remain estimates.'
  }
  const coveredText = context.coverageRule.covered ? 'covered' : 'not covered'
  const priorAuthText = context.coverageRule.priorAuthRequired ? 'does require prior authorization' : 'does not require prior authorization'
  return `The plan rule lists this service as ${coveredText} and ${priorAuthText}.`
}

export function generateClaimSummary(context: ClaimContext, language: SupportedLanguage = 'English'): string {
  const reprocessing = context.claim.reprocessingDaysEstimate
    ? ` Once the missing information is received, reprocessing usually takes about ${context.claim.reprocessingDaysEstimate} days.`
    : ''
  return `${languagePrefix(language)}I found claim ${context.claim.id} for ${context.claim.serviceName} with ${context.claim.providerName} on ${formatLongDate(context.claim.serviceDate)}. ${context.claim.plainLanguageReason} ${context.claim.nextStep}${reprocessing}`.trim()
}

function answerForIntent(intent: string, context: ClaimContext): string {
  switch (intent) {
    case 'hello':
      return `Hello. I found ${context.claim.id} for ${context.claim.serviceName}. ${context.claim.nextStep}`
    case 'why':
      return `Confirmed data: ${context.claim.plainLanguageReason} Status: ${context.claim.statusLabel}.`
    case 'missing':
      if (!context.claim.referralOnFile) {
        return 'Confirmed data: the required referral is not attached to the claim yet.'
      }
      if (context.claim.priorAuthRequired && !context.claim.priorAuthObtained) {
        return 'Confirmed data: the required prior authorization has not been obtained yet.'
      }
      if (context.claim.modifierMismatch) {
        return 'Confirmed data: the claim appears to need a provider coding or modifier correction.'
      }
      return 'Confirmed data: the next step is tied to the plan review notes and claim status shown in the claim context.'
    case 'who':
      return `Confirmed data: ${context.claim.whoNeedsToAct} should act next. Suggested next step: ${context.claim.nextStep}`
    case 'owe':
      return `Estimated member cost: ${formatCurrency(context.claim.estimatedMemberCost)}. This is an estimate based on billed and paid amounts, not a guarantee. ${coverageLine(context)}`
    case 'covered':
      return coverageLine(context)
    case 'prior-auth':
      return context.claim.priorAuthRequired
        ? context.claim.priorAuthObtained
          ? 'Confirmed data: this service required prior authorization, and the claim record shows it was obtained.'
          : 'Confirmed data: this service required prior authorization, and the claim record does not show it as obtained.'
        : 'Confirmed data: this claim does not show a prior authorization requirement.'
    case 'referral':
      return context.claim.referralOnFile
        ? 'Confirmed data: the claim record shows a referral on file.'
        : 'Confirmed data: the claim record does not show a referral on file yet.'
    case 'how-long':
      return context.claim.reprocessingDaysEstimate
        ? `Estimated timing: once the missing step is resolved, reprocessing usually takes about ${context.claim.reprocessingDaysEstimate} days.`
        : 'Estimated timing: the dataset does not provide a reprocessing estimate for this claim.'
    case 'access':
      return context.roiAuthorizations.length > 0
        ? `Confirmed data: ${context.roiAuthorizations[0].authorizedCallerName} and ${context.roiAuthorizations.length - 1} other authorized contacts are on file.`
        : 'Confirmed data: no active authorized access records were found for this member.'
    default:
      return `Confirmed data: ${context.claim.statusLabel}. ${context.claim.nextStep} ${coverageLine(context)}`
  }
}

function detectIntent(question: string): string {
  const normalized = question.toLowerCase()
  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) return 'hello'
  if (normalized.includes('why')) return 'why'
  if (normalized.includes('missing')) return 'missing'
  if (normalized.includes('who')) return 'who'
  if (normalized.includes('owe') || normalized.includes('cost') || normalized.includes('pay')) return 'owe'
  if (normalized.includes('covered')) return 'covered'
  if (normalized.includes('prior authorization') || normalized.includes('prior auth')) return 'prior-auth'
  if (normalized.includes('referral')) return 'referral'
  if (normalized.includes('how long') || normalized.includes('reprocess') || normalized.includes('timing')) return 'how-long'
  if (normalized.includes('spouse') || normalized.includes('family') || normalized.includes('access')) return 'access'
  return 'general'
}

export function answerClaimQuestion(question: string, context: ClaimContext, language: SupportedLanguage): string {
  const answer = answerForIntent(detectIntent(question), context)
  return `${languagePrefix(language)}${answer}`
}

export function answerGeneralBenefitsQuestion(question: string, member: Member, language: SupportedLanguage): string {
  const normalized = question.toLowerCase()
  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    return `${languagePrefix(language)}Hello. I can help ${member.fullName} with claims, coverage, prior authorization, referrals, costs, and authorized access.`
  }
  if (normalized.includes('access') || normalized.includes('spouse') || normalized.includes('family')) {
    return `${languagePrefix(language)}Authorized family access depends on the Release of Information records on file for ${member.fullName}. Open the dashboard authorized access section to review current authorizations.`
  }
  if (normalized.includes('coverage')) {
    return `${languagePrefix(language)}${member.planType} coverage details are available through claims and CPT rule lookups. Open Claims or ask about a specific service name or CPT code.`
  }
  if (normalized.includes('care') || normalized.includes('appointment')) {
    return `${languagePrefix(language)}The current dataset does not contain future appointment slots after July 16, 2026, but it can still show active care reminders and the latest scheduling data.`
  }
  return `${languagePrefix(language)}I can explain claim status, coverage rules, prior authorization, referrals, costs, and authorized access for ${member.fullName}.`
}

export function suggestedQuestions(context: ClaimContext | undefined, language: SupportedLanguage): SuggestedQuestion[] {
  const defaults = context
    ? [
        `Why is ${context.claim.id} ${context.claim.statusLabel.toLowerCase()}?`,
        `Who needs to act on ${context.claim.serviceName}?`,
        `What will I owe for ${context.claim.serviceName}?`,
        `How long could ${context.claim.id} take to reprocess?`,
        `Is ${context.claim.serviceName} covered?`,
        'Who else can access this claim?',
      ]
    : [
        'What needs my attention today?',
        'How do referrals affect claims?',
        'How do I check coverage?',
        'Can my family access my account?',
      ]
  return defaults.map((label, index) => ({
    id: `${context?.claim.id ?? 'general'}-${index}`,
    label: translateQuestion(label, language),
  }))
}

export function initialAssistantMessage(context: ClaimContext | undefined, member: Member, language: SupportedLanguage): ChatMessage {
  return {
    id: `${context?.claim.id ?? 'general'}-welcome`,
    role: 'assistant',
    content: context
      ? generateClaimSummary(context, language)
      : `${languagePrefix(language)}How can I help today, ${member.firstName}? Ask about claims, coverage, referrals, prior authorization, costs, or family access.`,
    timestamp: new Date().toISOString(),
    language,
  }
}
