import Papa from 'papaparse'
import appointmentSlotsCsv from '../../data/structured/appointment_slots.csv?raw'
import campaignDispositionsCsv from '../../data/structured/campaign_dispositions.csv?raw'
import careGapsCsv from '../../data/structured/care_gaps.csv?raw'
import claimsCsv from '../../data/structured/claims.csv?raw'
import complianceFlagsCsv from '../../data/structured/compliance_flags.csv?raw'
import coverageRulesCsv from '../../data/structured/coverage_rules.csv?raw'
import historicalInterventionsCsv from '../../data/structured/historical_interventions.csv?raw'
import membersCsv from '../../data/structured/members.csv?raw'
import providersCsv from '../../data/structured/providers.csv?raw'
import roiAuthorizationsCsv from '../../data/structured/roi_authorizations.csv?raw'
import { CURRENT_DATE, type AppointmentSlot, type AttentionItem, type CampaignDisposition, type CareGap, type Claim, type ClaimContext, type ClaimStatusGroup, type ComplianceFlag, type CoverageRule, type DashboardSummary, type HistoricalIntervention, type Member, type PrototypeData, type Provider, type ROIAuthorization } from '@/types'

type CsvRecord = Record<string, string>

let cachedData: PrototypeData | null = null

function parseCsv(raw: string): CsvRecord[] {
  return Papa.parse<CsvRecord>(raw.trim(), {
    header: true,
    skipEmptyLines: true,
  }).data
}

function parseBoolean(value?: string): boolean {
  return value?.trim().toLowerCase() === 'true'
}

function parseNumber(value?: string): number {
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseOptionalNumber(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function toInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function plainLanguageReason(record: CsvRecord): string {
  const denialReason = record.denial_reason?.trim()
  if (record.claim_status === 'Denied' && !denialReason) {
    return 'This claim was denied and may need a manual review.'
  }
  if (!denialReason) {
    return record.claim_status === 'Paid'
      ? 'This claim has finished processing.'
      : 'This claim is still moving through the plan review process.'
  }
  const reasonMap: Record<string, string> = {
    'Diagnosis not covered': 'The diagnosis attached to this service does not match the plan coverage rule on file.',
    'Claim not covered by this payer — coordination of benefits': 'The plan needs coordination-of-benefits details before it can finish the claim.',
    'Benefit included in payment for another service': 'This service may already be included in another payment and could need provider follow-up.',
    'Time limit for filing has expired': 'The provider submitted the claim after the filing deadline, so the plan treated it as final.',
    'Deductible amount': 'The plan applied the charge to your deductible rather than paying it now.',
    'Coinsurance amount': 'The plan processed the claim, but a coinsurance amount remains your responsibility.',
  }
  return reasonMap[denialReason] ?? denialReason
}

function statusGroupForClaim(record: CsvRecord): ClaimStatusGroup {
  const rawStatus = record.claim_status?.trim().toLowerCase()
  const missingReferral = !parseBoolean(record.referral_on_file)
  const missingPriorAuth = parseBoolean(record.prior_auth_required) && !parseBoolean(record.prior_auth_obtained)
  const modifierMismatch = parseBoolean(record.modifier_mismatch)
  const denialFixable = parseBoolean(record.denial_fixable)
  const waitingForAction = rawStatus === 'denied' && (denialFixable || missingReferral || missingPriorAuth || modifierMismatch)
  if (waitingForAction || missingReferral || missingPriorAuth || modifierMismatch) {
    return 'needs-action'
  }
  if (rawStatus === 'in review' || rawStatus === 'pending') {
    return 'in-progress'
  }
  if (rawStatus === 'denied') {
    return 'completed'
  }
  return rawStatus === 'paid' ? 'completed' : 'in-progress'
}

function labelForClaimStatus(record: CsvRecord, group: ClaimStatusGroup): string {
  if (group === 'needs-action' && !parseBoolean(record.referral_on_file)) {
    return 'Waiting for referral'
  }
  if (group === 'needs-action' && parseBoolean(record.prior_auth_required) && !parseBoolean(record.prior_auth_obtained)) {
    return 'Prior authorization needed'
  }
  if (group === 'needs-action' && parseBoolean(record.modifier_mismatch)) {
    return 'Provider correction needed'
  }
  if (group === 'needs-action' && parseBoolean(record.denial_fixable)) {
    return 'Action needed'
  }
  if (record.claim_status === 'In Review') return 'In review'
  if (record.claim_status === 'Pending') return 'Pending'
  if (record.claim_status === 'Paid') return 'Paid'
  return record.claim_status || 'In progress'
}

function nextStepForClaim(record: CsvRecord, group: ClaimStatusGroup): { nextStep: string; whoNeedsToAct: string } {
  const providerName = record.provider_name || 'Your provider'
  if (!parseBoolean(record.referral_on_file)) {
    return {
      nextStep: 'Ask your primary care manager or provider to submit the required referral before the claim can move forward.',
      whoNeedsToAct: 'Provider or primary care manager',
    }
  }
  if (parseBoolean(record.prior_auth_required) && !parseBoolean(record.prior_auth_obtained)) {
    return {
      nextStep: 'A prior authorization request needs to be submitted and approved before this claim can complete review.',
      whoNeedsToAct: providerName,
    }
  }
  if (parseBoolean(record.modifier_mismatch)) {
    return {
      nextStep: `${providerName} should resubmit the claim with the correct modifier.`,
      whoNeedsToAct: providerName,
    }
  }
  if (group === 'needs-action' && parseBoolean(record.denial_fixable)) {
    return {
      nextStep: 'This denial appears fixable. Review the claim story and contact the provider if more documentation is needed.',
      whoNeedsToAct: 'Member and provider',
    }
  }
  if (record.claim_status === 'In Review' || record.claim_status === 'Pending') {
    return {
      nextStep: 'The claim is still under plan review. No action is required unless the status changes.',
      whoNeedsToAct: 'Plan review team',
    }
  }
  return {
    nextStep: 'This claim has completed its current processing cycle.',
    whoNeedsToAct: 'No immediate action',
  }
}

function buildSearchableText(record: CsvRecord): string {
  return [
    record.claim_id,
    record.provider_name,
    record.cpt_description,
    record.cpt_code,
    record.claim_status,
    record.denial_reason,
  ]
    .join(' ')
    .toLowerCase()
}

function byDateDescending<T extends { serviceDate?: string; slotDate?: string }>(a: T, b: T): number {
  const aDate = a.serviceDate ?? a.slotDate ?? '1900-01-01'
  const bDate = b.serviceDate ?? b.slotDate ?? '1900-01-01'
  return bDate.localeCompare(aDate)
}

function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[item.id] = item
    return accumulator
  }, {})
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    const key = keyGetter(item)
    accumulator[key] ??= []
    accumulator[key].push(item)
    return accumulator
  }, {})
}

function coverageKey(planType: string, cptCode: string): string {
  return `${planType}::${cptCode}`
}

export function loadPrototypeData(): PrototypeData {
  if (cachedData) return cachedData

  const members = parseCsv(membersCsv).map<Member>((record) => ({
    id: record.member_id,
    firstName: record.first_name,
    lastName: record.last_name,
    fullName: `${record.first_name} ${record.last_name}`,
    dob: record.dob,
    age: parseNumber(record.age),
    gender: record.gender,
    planType: record.plan_type,
    planId: record.plan_id,
    pcpId: record.pcp_id,
    address: record.address,
    city: record.city,
    state: record.state,
    zip: record.zip,
    phone: record.phone,
    email: record.email,
    chronicConditions: [
      parseBoolean(record.chronic_diabetes) ? 'Diabetes' : null,
      parseBoolean(record.chronic_hypertension) ? 'Hypertension' : null,
      parseBoolean(record.chronic_cardiovascular) ? 'Cardiovascular disease' : null,
    ].filter(Boolean) as string[],
    enrollmentDate: record.enrollment_date,
    languagePreference: record.language_preference,
    initials: toInitials(record.first_name, record.last_name),
  }))

  const claims = parseCsv(claimsCsv).map<Claim>((record) => {
    const group = statusGroupForClaim(record)
    const label = labelForClaimStatus(record, group)
    const billedAmount = parseNumber(record.billed_amount)
    const paidAmount = parseNumber(record.paid_amount)
    const estimatedMemberCost = Math.max(billedAmount - paidAmount, 0)
    const nextStepInfo = nextStepForClaim(record, group)
    return {
      id: record.claim_id,
      memberId: record.member_id,
      providerId: record.provider_id,
      providerName: record.provider_name,
      serviceDate: record.service_date,
      submittedDate: record.submitted_date || undefined,
      adjudicationDate: record.adjudication_date || undefined,
      cptCode: record.cpt_code,
      serviceName: record.cpt_description,
      diagnosisCode: record.diagnosis_code,
      rawStatus: record.claim_status,
      statusGroup: group,
      statusLabel: label,
      denialCode: record.denial_code || undefined,
      denialReason: record.denial_reason || undefined,
      plainLanguageReason: plainLanguageReason(record),
      denialFixable: parseBoolean(record.denial_fixable),
      billedAmount,
      paidAmount,
      estimatedMemberCost,
      referralOnFile: parseBoolean(record.referral_on_file),
      priorAuthRequired: parseBoolean(record.prior_auth_required),
      priorAuthObtained: parseBoolean(record.prior_auth_obtained),
      denialRiskFlag: parseBoolean(record.denial_risk_flag),
      modifierMismatch: parseBoolean(record.modifier_mismatch),
      reprocessingDaysEstimate: parseOptionalNumber(record.reprocessing_days_est),
      needsAttention: group === 'needs-action',
      nextStep: nextStepInfo.nextStep,
      whoNeedsToAct: nextStepInfo.whoNeedsToAct,
      searchableText: buildSearchableText(record),
    }
  })

  const coverageRules = parseCsv(coverageRulesCsv).map<CoverageRule>((record) => ({
    id: record.rule_id,
    planType: record.plan_type,
    cptCode: record.cpt_code,
    cptDescription: record.cpt_description,
    covered: parseBoolean(record.covered),
    priorAuthRequired: parseBoolean(record.prior_auth_required),
    costSharePercent: parseNumber(record.cost_share_pct),
    copay: parseNumber(record.copay),
    notes: record.notes || undefined,
  }))

  const providers = parseCsv(providersCsv).map<Provider>((record) => ({
    id: record.provider_id,
    name: record.name,
    specialty: record.specialty,
    npi: record.npi,
    address: record.address,
    city: record.city,
    state: record.state,
    zip: record.zip,
    phone: record.phone,
    networkStatus: record.network_status,
    acceptingNewPatients: parseBoolean(record.accepting_new_patients),
    hospitalAffiliation: record.hospital_affiliation,
  }))

  const careGaps = parseCsv(careGapsCsv).map<CareGap>((record) => ({
    id: record.gap_id,
    memberId: record.member_id,
    measureId: record.measure_id,
    measureName: record.measure_name,
    status: record.gap_status,
    dueDate: record.due_date,
    lastServiceDate: record.last_service_date || undefined,
    outreachAttempts: parseNumber(record.outreach_attempts),
    careGapYear: parseNumber(record.care_gap_year),
  }))

  const appointmentSlots = parseCsv(appointmentSlotsCsv).map<AppointmentSlot>((record) => ({
    id: record.slot_id,
    providerId: record.provider_id,
    providerName: record.provider_name,
    specialty: record.specialty,
    networkStatus: record.network_status,
    slotDate: record.slot_date,
    slotTime: record.slot_time,
    visitType: record.visit_type,
    durationMinutes: parseNumber(record.duration_min),
    telehealth: parseBoolean(record.telehealth),
    address: record.address,
    city: record.city,
    state: record.state,
    zip: record.zip,
    phone: record.phone,
    available: parseBoolean(record.available),
  }))

  const roiAuthorizations = parseCsv(roiAuthorizationsCsv).map<ROIAuthorization>((record) => ({
    id: record.auth_id,
    memberId: record.member_id,
    authorizedCallerName: record.authorized_caller_name,
    relationship: record.relationship,
    authOnFile: parseBoolean(record.auth_on_file),
    expirationDate: record.expiration_date,
    authExpired: parseBoolean(record.auth_expired),
    dateAdded: record.date_added,
  }))

  const complianceFlags = parseCsv(complianceFlagsCsv).map<ComplianceFlag>((record) => ({
    id: record.flag_id,
    type: record.flag_type,
    severity: record.severity,
    entityType: record.entity_type,
    entityId: record.entity_id,
    flagDate: record.flag_date,
    metricValue: parseNumber(record.metric_value),
    metricLabel: record.metric_label,
    description: record.description,
    recommendedAction: record.recommended_action,
    resolved: parseBoolean(record.resolved),
  }))

  const historicalInterventions = parseCsv(historicalInterventionsCsv).map<HistoricalIntervention>((record) => ({
    id: record.intervention_id,
    measureId: record.measure_id,
    interventionYear: parseNumber(record.intervention_year),
    interventionType: record.intervention_type,
    primaryChannel: record.primary_channel,
    membersTargeted: parseNumber(record.members_targeted),
    membersClosed: parseNumber(record.members_closed),
    closureRatePercent: parseNumber(record.closure_rate_pct),
    costPerClosureUsd: parseNumber(record.cost_per_closure_usd),
    totalCostEstimateUsd: parseNumber(record.total_cost_est_usd),
    notes: record.notes,
  }))

  const campaignDispositions = parseCsv(campaignDispositionsCsv).map<CampaignDisposition>((record) => ({
    id: record.disposition_id,
    campaignId: record.campaign_id,
    memberId: record.member_id,
    gapId: record.gap_id,
    measureId: record.measure_id,
    measureName: record.measure_name,
    channel: record.channel,
    attemptNumber: parseNumber(record.attempt_number),
    attemptDate: record.attempt_date,
    rawDispositionCode: record.raw_disposition_code,
    csrNotes: record.csr_notes || undefined,
    actionTaken: record.action_taken,
    gapCreditedInSystem: parseBoolean(record.gap_credited_in_system),
    actualCompletionLikely: parseBoolean(record.actual_completion_likely),
  }))

  cachedData = {
    members,
    claims,
    coverageRules,
    providers,
    careGaps,
    appointmentSlots,
    roiAuthorizations,
    complianceFlags,
    historicalInterventions,
    campaignDispositions,
    membersById: indexById(members),
    claimsById: indexById(claims),
    claimsByMemberId: groupBy(claims, (claim) => claim.memberId),
    providersById: indexById(providers),
    careGapsByMemberId: groupBy(careGaps, (careGap) => careGap.memberId),
    appointmentsByProviderId: groupBy(appointmentSlots, (slot) => slot.providerId),
    roiById: indexById(roiAuthorizations),
    roiByMemberId: groupBy(roiAuthorizations, (authorization) => authorization.memberId),
    coverageRulesByPlanAndCode: coverageRules.reduce<Record<string, CoverageRule>>((accumulator, rule) => {
      accumulator[coverageKey(rule.planType, rule.cptCode)] = rule
      return accumulator
    }, {}),
    complianceFlagsByEntityId: groupBy(complianceFlags, (flag) => flag.entityId),
    historicalInterventionsByMeasureId: groupBy(historicalInterventions, (intervention) => intervention.measureId),
    campaignDispositionsByMemberId: groupBy(campaignDispositions, (disposition) => disposition.memberId),
  }

  return cachedData
}

export function matchMember(data: PrototypeData, credentials: {
  memberId: string
  firstName: string
  lastName: string
  dob: string
}): Member | undefined {
  const member = data.membersById[credentials.memberId.trim()]
  if (!member) return undefined
  const firstMatches = member.firstName.toLowerCase() === credentials.firstName.trim().toLowerCase()
  const lastMatches = member.lastName.toLowerCase() === credentials.lastName.trim().toLowerCase()
  const dobMatches = member.dob === credentials.dob
  return firstMatches && lastMatches && dobMatches ? member : undefined
}

export function matchAuthorizedHelper(
  data: PrototypeData,
  credentials: {
    memberId: string
    firstName: string
    lastName: string
    dob: string
    helperName: string
    relationship: string
  },
): { member: Member; authorization: ROIAuthorization } | undefined {
  const member = matchMember(data, credentials)
  if (!member) return undefined
  const authorization = (data.roiByMemberId[member.id] ?? []).find(
    (record) =>
      record.authOnFile &&
      !record.authExpired &&
      normalizeName(record.authorizedCallerName) === normalizeName(credentials.helperName) &&
      normalizeName(record.relationship) === normalizeName(credentials.relationship),
  )
  if (!authorization) return undefined
  return { member, authorization }
}

export function getCoverageRule(data: PrototypeData, member: Member, claim: Claim): CoverageRule | undefined {
  return data.coverageRulesByPlanAndCode[coverageKey(member.planType, claim.cptCode)]
}

export function getClaimContext(data: PrototypeData, claimId: string): ClaimContext | undefined {
  const claim = data.claimsById[claimId]
  if (!claim) return undefined
  const member = data.membersById[claim.memberId]
  if (!member) return undefined
  return {
    claim,
    member,
    provider: data.providersById[claim.providerId],
    coverageRule: getCoverageRule(data, member, claim),
    roiAuthorizations: (data.roiByMemberId[member.id] ?? []).filter((authorization) => authorization.authOnFile && !authorization.authExpired),
    complianceFlags: data.complianceFlagsByEntityId[claim.providerId] ?? [],
    historicalInterventions: data.historicalInterventionsByMeasureId[
      (data.careGapsByMemberId[member.id] ?? [])[0]?.measureId ?? ''
    ] ?? [],
  }
}

export function buildDashboardSummary(data: PrototypeData, memberId: string): DashboardSummary | undefined {
  const member = data.membersById[memberId]
  if (!member) return undefined
  const memberClaims = [...(data.claimsByMemberId[memberId] ?? [])].sort(byDateDescending)
  const recentClaims = memberClaims.slice(0, 3)
  const attentionClaims = memberClaims.filter((claim) => claim.needsAttention).slice(0, 3)
  const openCareGaps = (data.careGapsByMemberId[memberId] ?? [])
    .filter((careGap) => careGap.status === 'Open')
    .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
  const activeAuthorizations = (data.roiByMemberId[memberId] ?? [])
    .filter((authorization) => authorization.authOnFile && !authorization.authExpired)
    .sort((first, second) => first.expirationDate.localeCompare(second.expirationDate))
  const availableSlots = (data.appointmentsByProviderId[member.pcpId] ?? [])
    .filter((slot) => slot.available)
    .sort(byDateDescending)
  const hasFutureSlots = availableSlots.some((slot) => slot.slotDate >= CURRENT_DATE)
  const latestAvailableSlots = availableSlots.slice(0, 3)
  const attentionItems: AttentionItem[] = [
    ...attentionClaims.map<AttentionItem>((claim) => ({
      id: claim.id,
      kind: 'claim',
      title: claim.statusLabel === 'Provider correction needed' ? claim.statusLabel : claim.serviceName,
      detail: claim.nextStep,
      actionLabel: claim.statusGroup === 'needs-action' ? 'Open claim story' : 'Review claim',
      actionHref: `/assistant?claimId=${claim.id}`,
      tone: !claim.referralOnFile ? 'amber' : claim.modifierMismatch || claim.denialFixable ? 'red' : 'teal',
      claimId: claim.id,
    })),
    ...openCareGaps.slice(0, 1).map<AttentionItem>((careGap) => ({
      id: careGap.id,
      kind: 'care-gap',
      title: careGap.measureName,
      detail: `Due by ${careGap.dueDate}. ${careGap.outreachAttempts} outreach attempts already logged.`,
      actionLabel: 'Review care reminder',
      actionHref: '/dashboard#care',
      tone: 'green',
    })),
    ...activeAuthorizations.slice(0, 1).map<AttentionItem>((authorization) => ({
      id: authorization.id,
      kind: 'roi',
      title: `${authorization.authorizedCallerName} can access this account`,
      detail: `${authorization.relationship} authorization expires ${authorization.expirationDate}.`,
      actionLabel: 'Manage authorized access',
      actionHref: '/dashboard#roi',
      tone: 'teal',
    })),
  ].slice(0, 4)

  return {
    member,
    attentionItems,
    recentClaims,
    activeAuthorizations,
    openCareGaps,
    latestAvailableSlots,
    hasFutureSlots,
    schedulingMessage: hasFutureSlots
      ? 'Available appointments were found in the current dataset.'
      : 'No future appointment slots exist in the current dataset. Showing the latest scheduling data instead.',
  }
}

export function filterClaims(
  claims: Claim[],
  options: { tab: 'all' | ClaimStatusGroup; search: string; from?: string; to?: string },
): Claim[] {
  const normalizedSearch = options.search.trim().toLowerCase()
  return claims
    .filter((claim) => (options.tab === 'all' ? true : claim.statusGroup === options.tab))
    .filter((claim) => (normalizedSearch ? claim.searchableText.includes(normalizedSearch) : true))
    .filter((claim) => (options.from ? claim.serviceDate >= options.from : true))
    .filter((claim) => (options.to ? claim.serviceDate <= options.to : true))
    .sort(byDateDescending)
}
