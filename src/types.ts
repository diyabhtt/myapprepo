export const CURRENT_DATE = '2026-07-16'

export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'Nepali',
  'Hindi',
  'Korean',
  'Vietnamese',
] as const

export type SupportedLanguage = (typeof LANGUAGE_OPTIONS)[number]
export type IdentityMode = 'member' | 'helper'
export type ClaimStatusGroup = 'needs-action' | 'in-progress' | 'completed'
export type ClaimTab = ClaimStatusGroup | 'all'
export type ChatRole = 'assistant' | 'user' | 'system'
export type CallSpeaker = 'assistant' | 'member' | 'system'
export type AttentionTone = 'amber' | 'red' | 'green' | 'teal'

export interface Member {
  id: string
  firstName: string
  lastName: string
  fullName: string
  dob: string
  age: number
  gender: string
  planType: string
  planId: string
  pcpId: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  chronicConditions: string[]
  enrollmentDate: string
  languagePreference: string
  initials: string
}

export interface Claim {
  id: string
  memberId: string
  providerId: string
  providerName: string
  serviceDate: string
  submittedDate?: string
  adjudicationDate?: string
  cptCode: string
  serviceName: string
  diagnosisCode: string
  rawStatus: string
  statusGroup: ClaimStatusGroup
  statusLabel: string
  denialCode?: string
  denialReason?: string
  plainLanguageReason: string
  denialFixable: boolean
  billedAmount: number
  paidAmount: number
  estimatedMemberCost: number
  referralOnFile: boolean
  priorAuthRequired: boolean
  priorAuthObtained: boolean
  denialRiskFlag: boolean
  modifierMismatch: boolean
  reprocessingDaysEstimate?: number
  needsAttention: boolean
  nextStep: string
  whoNeedsToAct: string
  searchableText: string
}

export interface CoverageRule {
  id: string
  planType: string
  cptCode: string
  cptDescription: string
  covered: boolean
  priorAuthRequired: boolean
  costSharePercent: number
  copay: number
  notes?: string
}

export interface Provider {
  id: string
  name: string
  specialty: string
  npi: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  networkStatus: string
  acceptingNewPatients: boolean
  hospitalAffiliation: string
}

export interface CareGap {
  id: string
  memberId: string
  measureId: string
  measureName: string
  status: string
  dueDate: string
  lastServiceDate?: string
  outreachAttempts: number
  careGapYear: number
}

export interface AppointmentSlot {
  id: string
  providerId: string
  providerName: string
  specialty: string
  networkStatus: string
  slotDate: string
  slotTime: string
  visitType: string
  durationMinutes: number
  telehealth: boolean
  address: string
  city: string
  state: string
  zip: string
  phone: string
  available: boolean
}

export interface ROIAuthorization {
  id: string
  memberId: string
  authorizedCallerName: string
  relationship: string
  authOnFile: boolean
  expirationDate: string
  authExpired: boolean
  dateAdded: string
}

export interface ComplianceFlag {
  id: string
  type: string
  severity: string
  entityType: string
  entityId: string
  flagDate: string
  metricValue: number
  metricLabel: string
  description: string
  recommendedAction: string
  resolved: boolean
}

export interface HistoricalIntervention {
  id: string
  measureId: string
  interventionYear: number
  interventionType: string
  primaryChannel: string
  membersTargeted: number
  membersClosed: number
  closureRatePercent: number
  costPerClosureUsd: number
  totalCostEstimateUsd: number
  notes: string
}

export interface CampaignDisposition {
  id: string
  campaignId: string
  memberId: string
  gapId: string
  measureId: string
  measureName: string
  channel: string
  attemptNumber: number
  attemptDate: string
  rawDispositionCode: string
  csrNotes?: string
  actionTaken: string
  gapCreditedInSystem: boolean
  actualCompletionLikely: boolean
}

export interface PrototypeData {
  members: Member[]
  claims: Claim[]
  coverageRules: CoverageRule[]
  providers: Provider[]
  careGaps: CareGap[]
  appointmentSlots: AppointmentSlot[]
  roiAuthorizations: ROIAuthorization[]
  complianceFlags: ComplianceFlag[]
  historicalInterventions: HistoricalIntervention[]
  campaignDispositions: CampaignDisposition[]
  membersById: Record<string, Member>
  claimsById: Record<string, Claim>
  claimsByMemberId: Record<string, Claim[]>
  providersById: Record<string, Provider>
  careGapsByMemberId: Record<string, CareGap[]>
  appointmentsByProviderId: Record<string, AppointmentSlot[]>
  roiById: Record<string, ROIAuthorization>
  roiByMemberId: Record<string, ROIAuthorization[]>
  coverageRulesByPlanAndCode: Record<string, CoverageRule>
  complianceFlagsByEntityId: Record<string, ComplianceFlag[]>
  historicalInterventionsByMeasureId: Record<string, HistoricalIntervention[]>
  campaignDispositionsByMemberId: Record<string, CampaignDisposition[]>
}

export interface AttentionItem {
  id: string
  kind: 'claim' | 'care-gap' | 'roi' | 'scheduling'
  title: string
  detail: string
  actionLabel: string
  actionHref: string
  tone: AttentionTone
  claimId?: string
}

export interface DashboardSummary {
  member: Member
  attentionItems: AttentionItem[]
  recentClaims: Claim[]
  activeAuthorizations: ROIAuthorization[]
  openCareGaps: CareGap[]
  latestAvailableSlots: AppointmentSlot[]
  hasFutureSlots: boolean
  schedulingMessage: string
}

export interface ClaimContext {
  claim: Claim
  member: Member
  provider?: Provider
  coverageRule?: CoverageRule
  roiAuthorizations: ROIAuthorization[]
  complianceFlags: ComplianceFlag[]
  historicalInterventions: HistoricalIntervention[]
}

export interface SuggestedQuestion {
  id: string
  label: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  language: SupportedLanguage
}

export interface CallTranscriptEntry {
  id: string
  speaker: CallSpeaker
  content: string
  timestamp: string
  language: SupportedLanguage
}
