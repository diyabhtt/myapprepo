import { buildDashboardSummary, filterClaims, getClaimContext, loadPrototypeData, matchAuthorizedHelper, matchMember } from '@/services/prototypeData'

describe('prototypeData', () => {
  const data = loadPrototypeData()

  it('matches the demo member from the dataset', () => {
    const member = matchMember(data, {
      memberId: 'MBR00036',
      firstName: 'Joshua',
      lastName: 'Davis',
      dob: '1970-07-02',
    })
    expect(member?.fullName).toBe('Joshua Davis')
  })

  it('normalizes claim status groups and claim context', () => {
    const claimContext = getClaimContext(data, 'CLM000155')
    expect(claimContext?.claim.statusGroup).toBe('needs-action')
    expect(claimContext?.coverageRule?.priorAuthRequired).toBe(true)
  })

  it('matches helper access from ROI records', () => {
    const helperAccess = matchAuthorizedHelper(data, {
      memberId: 'MBR00036',
      firstName: 'Joshua',
      lastName: 'Davis',
      dob: '1970-07-02',
      helperName: 'Isabel Brown',
      relationship: 'Child',
    })
    expect(helperAccess?.authorization.relationship).toBe('Child')
  })

  it('builds a date-safe dashboard summary', () => {
    const summary = buildDashboardSummary(data, 'MBR00036')
    expect(summary?.hasFutureSlots).toBe(false)
    expect(summary?.schedulingMessage).toContain('No future appointment slots')
  })

  it('filters claims by status and search text', () => {
    const memberClaims = data.claimsByMemberId.MBR00036
    const results = filterClaims(memberClaims, { tab: 'needs-action', search: 'mri', from: undefined, to: undefined })
    expect(results.map((claim) => claim.id)).toContain('CLM000151')
  })
})
