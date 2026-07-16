from pathlib import Path

import pandas as pd

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "structured"

_claims = pd.read_csv(_DATA_DIR / "claims.csv", dtype=str)
_claims["claim_id"] = _claims["claim_id"].str.strip()
_claims["member_id"] = _claims["member_id"].str.strip()

_CLAIM_FIELDS = [
    "claim_id",
    "member_id",
    "provider_id",
    "provider_name",
    "service_date",
    "submitted_date",
    "adjudication_date",
    "cpt_code",
    "cpt_description",
    "diagnosis_code",
    "claim_status",
    "denial_code",
    "denial_reason",
    "denial_fixable",
    "billed_amount",
    "paid_amount",
    "referral_on_file",
    "prior_auth_required",
    "prior_auth_obtained",
    "reprocessing_days_est",
]


def _row_to_claim(record: pd.Series) -> dict:
    claim = {field: record[field] for field in _CLAIM_FIELDS}
    for field, value in claim.items():
        if pd.isna(value) or value == "":
            claim[field] = None
    return claim


def get_claim(claim_id: str) -> dict:
    """Look up the full details of a single claim.

    Args:
        claim_id: The claim's ID, e.g. "CLM000001".

    Returns:
        A dict with the claim's status, CPT/diagnosis codes, denial_code
        and denial_reason (None if not denied), whether the denial is
        denial_fixable (True/False/None if not denied), referral_on_file,
        prior_auth_required/prior_auth_obtained, billed/paid amounts, and
        reprocessing_days_est (estimated days to reprocess if resubmitted).
        Returns an error message if the claim_id is not found.
    """
    row = _claims[_claims["claim_id"] == claim_id.strip()]
    if row.empty:
        return {"error": f"No claim found with claim_id '{claim_id}'."}
    return _row_to_claim(row.iloc[0])


def get_claims_for_member(member_id: str) -> dict:
    """List all claims on file for a member, most recent service first.

    Use this when a caller doesn't have a specific claim_id, or is asking
    about their claims history / repeated denials in general.

    Args:
        member_id: The member's ID, e.g. "MBR00001".

    Returns:
        A dict with member_id and a list of claims (same fields as
        get_claim). Returns an error message if no claims are found for
        that member_id.
    """
    rows = _claims[_claims["member_id"] == member_id.strip()]
    if rows.empty:
        return {"error": f"No claims found for member_id '{member_id}'."}
    rows = rows.sort_values("service_date", ascending=False)
    return {
        "member_id": member_id.strip(),
        "claims": [_row_to_claim(row) for _, row in rows.iterrows()],
    }
