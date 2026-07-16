from agents.PreventionRiskAgent import PreventionRiskAgent

_risk_agent = PreventionRiskAgent()


def analyze_member_risk(member_id: str) -> dict:
    """Proactively scan a member's claims and provider history for risk.

    Detects patterns the member hasn't necessarily asked about yet, such
    as missing prior authorization, missing referrals, modifier
    mismatches, repeated denials, potential duplicate claims, expired
    filing deadlines, and providers with a high denial rate.

    Args:
        member_id: The member's ID, e.g. "MBR00001".

    Returns:
        A dict with risk_level (LOW/MEDIUM/HIGH), risk_score, a list of
        findings (each with risk_type, severity, explanation, and
        recommended_action), and a ready-to-read member_message summary.
        Returns an error message if the member_id is not found.
    """
    return _risk_agent.analyze_member(member_id)
