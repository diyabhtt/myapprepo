from pathlib import Path
from datetime import datetime
from typing import Dict, List

import pandas as pd


class PreventionRiskAgent:

    HIGH_WEIGHT = 25
    MEDIUM_WEIGHT = 10
    LOW_WEIGHT = 5

    SEVERITY_PRIORITY = {
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3
    }

    def __init__(self, data_dir: str = "data/structured"):

        self.data_dir = Path(data_dir)

        self.claims_df = pd.read_csv(
            self.data_dir / "claims.csv"
        )

        self.compliance_flags_df = pd.read_csv(
            self.data_dir / "compliance_flags.csv"
        )

        self.members_df = pd.read_csv(
            self.data_dir / "members.csv"
        )

        self.coverage_rules_df = pd.read_csv(
            self.data_dir / "coverage_rules.csv"
        )

        self._normalize_data()

    # ============================================================
    # PUBLIC
    # ============================================================

    def analyze_member(
        self,
        member_id: str
    ) -> Dict:

        member = self._get_member(member_id)

        if member is None:
            return {
                "error": f"Member {member_id} not found."
            }

        claims = self.claims_df[
            self.claims_df["member_id"] == member_id
        ].copy()

        findings = []

        findings.extend(
            self._detect_missing_prior_auth(claims)
        )

        findings.extend(
            self._detect_missing_referrals(claims)
        )

        findings.extend(
            self._detect_modifier_mismatches(claims)
        )

        findings.extend(
            self._detect_repeated_denials(claims)
        )

        findings.extend(
            self._detect_duplicate_claims(claims)
        )

        findings.extend(
            self._detect_filing_deadline_history(claims)
        )

        findings.extend(
            self._detect_provider_risks(claims)
        )

        findings.extend(
            self._detect_claim_level_compliance_flags(claims)
        )

        findings = self._sort_findings(findings)

        risk_score = self._calculate_risk_score(findings)

        risk_level = self._determine_risk_level(
            risk_score
        )

        return {
            "member_id": member_id,
            "member_name": (
                f"{member['first_name']} "
                f"{member['last_name']}"
            ),
            "risk_level": risk_level,
            "risk_score": risk_score,
            "total_findings": len(findings),
            "member_message": self._build_member_message(
                member,
                findings,
                risk_level
            ),
            "findings": findings,
            "metadata": {
                "claims_evaluated": len(claims),
                "generated_at": datetime.utcnow().isoformat()
            }
        }

    # ============================================================
    # DETECTORS
    # ============================================================

    def _detect_missing_prior_auth(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        matches = claims[
            (claims["prior_auth_required"] == True)
            &
            (claims["prior_auth_obtained"] == False)
        ]

        for _, row in matches.iterrows():

            findings.append({
                "category": "Claims",
                "risk_type": "Missing Prior Authorization",
                "severity": "HIGH",
                "claim_id": row["claim_id"],
                "explanation":
                    (
                        f"Claim {row['claim_id']} "
                        f"required prior authorization "
                        f"but none was obtained."
                    ),
                "recommended_action":
                    (
                        "Contact the provider and obtain "
                        "prior authorization documentation."
                    )
            })

        return findings

    def _detect_missing_referrals(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        matches = claims[
            claims["referral_on_file"] == False
        ]

        for _, row in matches.iterrows():

            findings.append({
                "category": "Claims",
                "risk_type": "Missing Referral",
                "severity": "HIGH",
                "claim_id": row["claim_id"],
                "explanation":
                    (
                        f"Claim {row['claim_id']} "
                        f"does not have a referral on file."
                    ),
                "recommended_action":
                    (
                        "Verify referral requirements "
                        "and obtain referral documentation."
                    )
            })

        return findings

    def _detect_modifier_mismatches(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        matches = claims[
            claims["modifier_mismatch"] == True
        ]

        for _, row in matches.iterrows():

            findings.append({
                "category": "Claims",
                "risk_type": "Modifier Mismatch",
                "severity": "HIGH",
                "claim_id": row["claim_id"],
                "explanation":
                    (
                        f"Claim {row['claim_id']} "
                        f"contains a modifier mismatch."
                    ),
                "recommended_action":
                    (
                        "Review coding and modifier usage "
                        "before resubmission."
                    )
            })

        return findings

    def _detect_repeated_denials(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        denied_claims = claims[
            claims["claim_status"]
            .astype(str)
            .str.upper() == "DENIED"
        ]

        if len(denied_claims) >= 2:

            findings.append({
                "category": "Claims",
                "risk_type": "Repeated Denials",
                "severity": "MEDIUM",
                "denied_claim_count": len(
                    denied_claims
                ),
                "explanation":
                    (
                        f"The member has "
                        f"{len(denied_claims)} denied claims."
                    ),
                "recommended_action":
                    (
                        "Review recurring denial causes "
                        "and address documentation issues."
                    )
            })

        return findings

    def _detect_duplicate_claims(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        duplicates = claims[
            claims.duplicated(
                subset=[
                    "member_id",
                    "provider_id",
                    "cpt_code",
                    "service_date"
                ],
                keep=False
            )
        ]

        if not duplicates.empty:

            findings.append({
                "category": "Claims",
                "risk_type":
                    "Potential Duplicate Claims",
                "severity": "MEDIUM",
                "duplicate_count":
                    len(duplicates),
                "claim_ids":
                    duplicates["claim_id"]
                    .tolist(),
                "explanation":
                    (
                        "Potential duplicate claims "
                        "were detected."
                    ),
                "recommended_action":
                    (
                        "Review potentially duplicated "
                        "submissions."
                    )
            })

        return findings

    def _detect_filing_deadline_history(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        matches = claims[
            claims["denial_code"] == "CO-29"
        ]

        for _, row in matches.iterrows():

            findings.append({
                "category": "Claims",
                "risk_type":
                    "Filing Deadline History",
                "severity": "MEDIUM",
                "claim_id": row["claim_id"],
                "explanation":
                    (
                        f"Claim {row['claim_id']} "
                        f"was denied because filing "
                        f"deadlines expired."
                    ),
                "recommended_action":
                    (
                        "Ensure future claims are "
                        "submitted within required "
                        "filing timeframes."
                    )
            })

        return findings

    def _detect_provider_risks(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        provider_ids = (
            claims["provider_id"]
            .dropna()
            .unique()
        )

        flags = self.compliance_flags_df[
            (
                self.compliance_flags_df[
                    "flag_type"
                ]
                ==
                "HIGH_PROVIDER_DENIAL_RATE"
            )
            &
            (
                self.compliance_flags_df[
                    "entity_id"
                ]
                .isin(provider_ids)
            )
            &
            (
                self.compliance_flags_df[
                    "resolved"
                ]
                == False
            )
        ]

        for _, row in flags.iterrows():

            findings.append({
                "category": "Provider",
                "risk_type":
                    "High Provider Denial Rate",
                "severity":
                    str(
                        row["severity"]
                    ).upper(),
                "provider_id":
                    row["entity_id"],
                "metric_value":
                    row["metric_value"],
                "explanation":
                    row["description"],
                "recommended_action":
                    row[
                        "recommended_action"
                    ]
            })

        return findings

    def _detect_claim_level_compliance_flags(
        self,
        claims: pd.DataFrame
    ) -> List[Dict]:

        findings = []

        claim_ids = claims["claim_id"].tolist()

        flags = self.compliance_flags_df[
            (
                self.compliance_flags_df[
                    "entity_type"
                ]
                .astype(str)
                .str.upper()
                ==
                "CLAIM"
            )
            &
            (
                self.compliance_flags_df[
                    "entity_id"
                ]
                .isin(claim_ids)
            )
            &
            (
                self.compliance_flags_df[
                    "resolved"
                ]
                == False
            )
        ]

        for _, row in flags.iterrows():

            findings.append({
                "category": "Compliance",
                "risk_type":
                    row["flag_type"],
                "severity":
                    str(
                        row["severity"]
                    ).upper(),
                "claim_id":
                    row["entity_id"],
                "explanation":
                    row["description"],
                "recommended_action":
                    row[
                        "recommended_action"
                    ]
            })

        return findings

    # ============================================================
    # SCORING
    # ============================================================

    def _calculate_risk_score(
        self,
        findings: List[Dict]
    ) -> int:

        score = 0

        for finding in findings:

            severity = finding["severity"]

            if severity == "HIGH":
                score += self.HIGH_WEIGHT

            elif severity == "MEDIUM":
                score += self.MEDIUM_WEIGHT

            elif severity == "LOW":
                score += self.LOW_WEIGHT

        return min(score, 100)

    def _determine_risk_level(
        self,
        score: int
    ) -> str:

        if score >= 60:
            return "HIGH"

        if score >= 25:
            return "MEDIUM"

        return "LOW"

    # ============================================================
    # MESSAGE GENERATION
    # ============================================================

    def _build_member_message(
        self,
        member: Dict,
        findings: List[Dict],
        risk_level: str
    ) -> str:

        member_name = (
            f"{member['first_name']} "
            f"{member['last_name']}"
        )

        if not findings:

            return (
                f"We reviewed {member_name}'s "
                f"claims and found no significant "
                f"claim or compliance risks."
            )

        lines = [
            (
                f"We reviewed {member_name}'s "
                f"claims and identified "
                f"{len(findings)} potential "
                f"risk finding(s)."
            ),
            (
                f"Overall risk level: "
                f"{risk_level}."
            ),
            "",
            "Top Findings:"
        ]

        for idx, finding in enumerate(
            findings[:5],
            start=1
        ):

            lines.append(
                f"{idx}. "
                f"{finding['risk_type']} "
                f"({finding['severity']})"
            )

            lines.append(
                f"   {finding['explanation']}"
            )

            lines.append(
                f"   Recommended Action: "
                f"{finding['recommended_action']}"
            )

        if len(findings) > 5:

            lines.append(
                f"...and {len(findings) - 5} "
                f"additional finding(s)."
            )

        return "\n".join(lines)

    # ============================================================
    # HELPERS
    # ============================================================

    def _get_member(
        self,
        member_id: str
    ):

        result = self.members_df[
            self.members_df["member_id"]
            == member_id
        ]

        if result.empty:
            return None

        return result.iloc[0].to_dict()

    def _sort_findings(
        self,
        findings: List[Dict]
    ) -> List[Dict]:

        return sorted(
            findings,
            key=lambda f:
            self.SEVERITY_PRIORITY.get(
                f["severity"],
                999
            )
        )

    def _normalize_data(self):

        bool_columns = [
            "referral_on_file",
            "prior_auth_required",
            "prior_auth_obtained",
            "modifier_mismatch"
        ]

        for col in bool_columns:

            if col in self.claims_df.columns:

                self.claims_df[col] = (
                    self.claims_df[col]
                    .astype(str)
                    .str.lower()
                    .map({
                        "true": True,
                        "false": False
                    })
                )

        if "resolved" in self.compliance_flags_df:

            self.compliance_flags_df[
                "resolved"
            ] = (
                self.compliance_flags_df[
                    "resolved"
                ]
                .astype(str)
                .str.lower()
                .map({
                    "true": True,
                    "false": False
                })
                .fillna(False)
            )