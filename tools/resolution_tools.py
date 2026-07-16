from typing import Optional

from src.resolutions import ResolutionAgent

_resolution_agent = ResolutionAgent()


def resolve_next_step(
    claim_id: Optional[str] = None,
    member_id: Optional[str] = None,
    caller_name: Optional[str] = None,
) -> dict:
    """Determine the single next step to resolve a claim or caller inquiry.

    Runs a deterministic rules engine (not the LLM) over ROI/caller
    authorization, prior authorization gaps, stalled claim reviews,
    provider credentialing issues, and denial codes, to return exactly
    one recommended resolution: wait for processing, contact the
    provider, submit missing documents, correct and resubmit the claim,
    request prior authorization, file an appeal, or escalate to a
    representative.

    Args:
        claim_id: The claim's ID, e.g. "CLM000001", if known.
        member_id: The member's ID, e.g. "MBR00001", if known. If only
            claim_id is given, the member is looked up automatically.
        caller_name: The name of the person calling, if it may differ
            from the member on file (used to check ROI/authorization).

    Returns:
        A dict with resolution (one of the seven actions above), reason,
        recommended_action, and metadata about the claim/member/provider
        involved.
    """
    return _resolution_agent.resolve(
        claim_id=claim_id, member_id=member_id, caller_name=caller_name
    )
