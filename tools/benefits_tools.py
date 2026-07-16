from pathlib import Path

import pandas as pd

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "structured"

_coverage_rules = pd.read_csv(_DATA_DIR / "coverage_rules.csv", dtype=str)
_members = pd.read_csv(_DATA_DIR / "members.csv", dtype=str)
_providers = pd.read_csv(_DATA_DIR / "providers.csv", dtype=str)

_coverage_rules["cpt_code"] = _coverage_rules["cpt_code"].str.strip()
_members["member_id"] = _members["member_id"].str.strip()
_providers["provider_id"] = _providers["provider_id"].str.strip()


def get_member_plan(member_id: str) -> dict:
    """Look up a member's plan type and plan id.

    Args:
        member_id: The member's ID, e.g. "MBR00001".

    Returns:
        A dict with plan_type and plan_id, or an error message if the
        member_id is not found.
    """
    row = _members[_members["member_id"] == member_id.strip()]
    if row.empty:
        return {"error": f"No member found with member_id '{member_id}'."}
    record = row.iloc[0]
    return {
        "member_id": record["member_id"],
        "plan_type": record["plan_type"],
        "plan_id": record["plan_id"],
    }


def check_coverage(plan_type: str, cpt_code: str) -> dict:
    """Check whether a procedure is covered under a plan, and the cost share.

    Args:
        plan_type: The member's plan type, e.g. "HMO", "PPO", "MAPD".
        cpt_code: The CPT procedure code being billed, e.g. "99213".

    Returns:
        A dict describing coverage: covered, prior_auth_required,
        cost_share_pct (the member's coinsurance percentage), copay
        (flat dollar copay if one applies), and cpt_description. Returns
        an error message if no coverage rule matches.
    """
    match = _coverage_rules[
        (_coverage_rules["plan_type"].str.upper() == plan_type.strip().upper())
        & (_coverage_rules["cpt_code"] == cpt_code.strip())
    ]
    if match.empty:
        return {
            "error": (
                f"No coverage rule found for plan_type '{plan_type}' and "
                f"cpt_code '{cpt_code}'."
            )
        }
    record = match.iloc[0]
    return {
        "plan_type": record["plan_type"],
        "cpt_code": record["cpt_code"],
        "cpt_description": record["cpt_description"],
        "covered": record["covered"],
        "prior_auth_required": record["prior_auth_required"],
        "cost_share_pct": record["cost_share_pct"],
        "copay": record["copay"],
        "notes": record["notes"] if pd.notna(record["notes"]) else "",
    }


def get_provider_network_status(provider_id: str) -> dict:
    """Look up whether a provider is in-network and their basic details.

    Args:
        provider_id: The provider's ID, e.g. "PRV0001".

    Returns:
        A dict with network_status, specialty, and accepting_new_patients,
        or an error message if the provider_id is not found.
    """
    row = _providers[_providers["provider_id"] == provider_id.strip()]
    if row.empty:
        return {"error": f"No provider found with provider_id '{provider_id}'."}
    record = row.iloc[0]
    return {
        "provider_id": record["provider_id"],
        "name": record["name"],
        "specialty": record["specialty"],
        "network_status": record["network_status"],
        "accepting_new_patients": record["accepting_new_patients"],
    }
