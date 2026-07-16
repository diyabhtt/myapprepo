import os
import pandas as pd
from typing import Dict, Any, Optional
from google import genai

class ResolutionAgent:
    def __init__(self, data_dir: Optional[str] = None):
        """
        Initializes the agent and automatically detects if the CSV files
        are in 'data/structured/', 'data/', or the current directory '.'.
        """
        if data_dir is None:
            # Check folders in order from most specific to least specific
            paths_to_check = ["data/structured", "data", "."]
            detected_dir = None
            for path in paths_to_check:
                if os.path.exists(os.path.join(path, "claims.csv")):
                    detected_dir = path
                    break
            
            if detected_dir is None:
                raise FileNotFoundError(
                    "Could not locate 'claims.csv' in 'data/structured/', 'data/', or '.' directories. "
                    "Please verify your file structure."
                )
            self.data_dir = detected_dir
        else:
            self.data_dir = data_dir
        
        print(f"✓ Loading database from: {self.data_dir}")
        
        # Load the CSV files safely using the detected directory
        try:
            self.claims = pd.read_csv(os.path.join(self.data_dir, "claims.csv"))
            self.compliance = pd.read_csv(os.path.join(self.data_dir, "compliance_flags.csv"))
            self.members = pd.read_csv(os.path.join(self.data_dir, "members.csv"))
            self.providers = pd.read_csv(os.path.join(self.data_dir, "providers.csv"))
            
            # Check for either filename spelling
            roi_path = os.path.join(self.data_dir, "roi_authorizations.csv")
            if not os.path.exists(roi_path):
                roi_path = os.path.join(self.data_dir, "roi_authroizations.csv")
            self.roi = pd.read_csv(roi_path)
            
        except FileNotFoundError as e:
            raise FileNotFoundError(f"Failed to load a required CSV file: {e}")

        # AI SDK Authentication
        api_key = os.environ.get("GEMINI_API_KEY")
        has_vertex = "GOOGLE_GENAI_USE_VERTEXAI" in os.environ
        
        if not api_key and not has_vertex:
            print("[Warning] No AI credentials found. Deterministic rules will work, but AI drafts will be skipped.")
            self.ai_client = None
        else:
            self.ai_client = genai.Client()

    def resolve(self, claim_id: Optional[str] = None, member_id: Optional[str] = None, caller_name: Optional[str] = None) -> Dict[str, Any]:
        """
        DETERMINISTIC LAYER: Runs static database rules to output one of the 
        seven required resolutions.
        """
        # Cross-reference IDs
        if claim_id and not member_id:
            claim_row = self.claims[self.claims['claim_id'] == claim_id]
            if not claim_row.empty:
                member_id = claim_row.iloc[0]['member_id']
                
        if member_id and not claim_id:
            member_claims = self.claims[self.claims['member_id'] == member_id]
            if not member_claims.empty:
                claim_id = member_claims.iloc[0]['claim_id']

        # Get Member Name
        member_row = self.members[self.members['member_id'] == member_id] if member_id else pd.DataFrame()
        member_name = f"{member_row.iloc[0]['first_name']} {member_row.iloc[0]['last_name']}" if not member_row.empty else "Unknown"

        # Get Claim metadata if applicable
        claim_row = self.claims[self.claims['claim_id'] == claim_id] if claim_id else pd.DataFrame()

        # ----------------------------------------------------------------------
        # RULE 1: ROI COMPLIANCE
        # ----------------------------------------------------------------------
        if caller_name and member_id:
            if caller_name.lower() != member_name.lower():
                roi_match = self.roi[(self.roi['member_id'] == member_id) & 
                                     (self.roi['authorized_caller_name'].str.lower() == caller_name.lower())]
                
                roi_flag = self.compliance[(self.compliance['entity_id'] == member_id) & 
                                           (self.compliance['flag_type'] == 'ROI_AUTHORIZATION_GAP')]

                if roi_match.empty or roi_match.iloc[0]['auth_on_file'] == False or roi_match.iloc[0]['auth_expired'] == True or not roi_flag.empty:
                    template_action = roi_flag.iloc[0]['recommended_action'] if not roi_flag.empty else "Flag account for ROI collection. Do not disclose PHI to third-party callers."
                    return {
                        "resolution": "Submit missing documents",
                        "reason": f"No valid Release of Information (ROI) found on file for third-party caller: '{caller_name}'.",
                        "recommended_action": template_action,
                        "metadata": {"caller_name": caller_name, "member_name": member_name, "member_id": member_id}
                    }

        # ----------------------------------------------------------------------
        # RULE 2: PRIOR AUTHORIZATION BYPASS
        # ----------------------------------------------------------------------
        if claim_id and not claim_row.empty:
            pa_flag = self.compliance[(self.compliance['entity_id'] == claim_id) & 
                                      (self.compliance['flag_type'] == 'PRIOR_AUTH_BYPASS')]
            
            pa_required = claim_row.iloc[0]['prior_auth_required'] == True
            pa_obtained = claim_row.iloc[0]['prior_auth_obtained'] == True
            
            if not pa_flag.empty or (pa_required and not pa_obtained):
                template_action = pa_flag.iloc[0]['recommended_action'] if not pa_flag.empty else "Alert provider to obtain retroactive PA or submit appeal."
                return {
                    "resolution": "Request prior authorization",
                    "reason": f"CPT Code {claim_row.iloc[0]['cpt_code']} ({claim_row.iloc[0]['cpt_description']}) requires Prior Authorization, which was missing.",
                    "recommended_action": template_action,
                    "metadata": {"claim_id": claim_id, "provider_name": claim_row.iloc[0]['provider_name'], "cpt_code": claim_row.iloc[0]['cpt_code']}
                }

        # ----------------------------------------------------------------------
        # RULE 3: STALLED CLAIMS Review
        # ----------------------------------------------------------------------
        if claim_id:
            stall_flag = self.compliance[(self.compliance['entity_id'] == claim_id) & 
                                         (self.compliance['flag_type'] == 'CLAIM_REVIEW_STALLED')]
            if not stall_flag.empty:
                return {
                    "resolution": "Escalate to a representative",
                    "reason": f"Claim processing has stalled. {stall_flag.iloc[0]['description']}",
                    "recommended_action": stall_flag.iloc[0]['recommended_action'],
                    "metadata": {"claim_id": claim_id, "days_stalled": stall_flag.iloc[0]['metric_value']}
                }

        # ----------------------------------------------------------------------
        # RULE 4: PROVIDER CREDENTIALING
        # ----------------------------------------------------------------------
        if claim_id and not claim_row.empty:
            provider_id = claim_row.iloc[0]['provider_id']
            cred_flag = self.compliance[(self.compliance['entity_id'] == provider_id) & 
                                        (self.compliance['flag_type'] == 'PROVIDER_CREDENTIALING_ISSUE')]
            if not cred_flag.empty:
                return {
                    "resolution": "Contact the provider",
                    "reason": f"The billing provider has a known credentialing mismatch. {cred_flag.iloc[0]['description']}",
                    "recommended_action": cred_flag.iloc[0]['recommended_action'],
                    "metadata": {"provider_id": provider_id, "provider_name": claim_row.iloc[0]['provider_name']}
                }

        # ----------------------------------------------------------------------
        # RULE 5: CLAIMS ADJUDICATION & DENIAL LOGIC
        # ----------------------------------------------------------------------
        if claim_id and not claim_row.empty:
            status = claim_row.iloc[0]['claim_status']
            
            if status in ['In Review', 'Pending']:
                return {
                    "resolution": "Wait for processing",
                    "reason": f"The claim is currently '{status}' and is awaiting adjudication. Expected processing timeframe applies.",
                    "recommended_action": "No immediate actions required. Continue monitoring claim status.",
                    "metadata": {"claim_id": claim_id}
                }
                
            elif status == 'Denied':
                denial_code = claim_row.iloc[0]['denial_code']
                denial_reason = claim_row.iloc[0]['denial_reason']
                is_fixable = claim_row.iloc[0]['denial_fixable']
                
                # Correct & Resubmit
                if str(is_fixable).lower() == 'true':
                    if denial_code == 'CO-4':
                        action = "Re-code modifier mismatch on preventive visits and resubmit claim."
                    elif denial_code == 'CO-16':
                        action = "Append missing medical documentation or diagnosis descriptors and resubmit."
                    else:
                        action = "Correct clerical billing details on the claim form and resubmit."
                        
                    return {
                        "resolution": "Correct and resubmit the claim",
                        "reason": f"Denied with fixable code '{denial_code}': {denial_reason}.",
                        "recommended_action": action,
                        "metadata": {"claim_id": claim_id, "denial_code": denial_code, "provider_name": claim_row.iloc[0]['provider_name']}
                    }
                    
                # Unfixable appeal
                else:
                    return {
                        "resolution": "File an appeal",
                        "reason": f"Denied with unfixable code '{denial_code}': {denial_reason}.",
                        "recommended_action": "Submit a formal appeals packet with medical necessity arguments to override the denial.",
                        "metadata": {"claim_id": claim_id, "denial_code": denial_code, "provider_name": claim_row.iloc[0]['provider_name']}
                    }

        # Catch-all fallback
        return {
            "resolution": "Wait for processing",
            "reason": "Claim and billing structures conform to baseline specifications.",
            "recommended_action": "Monitor user profile for incoming inquiries.",
            "metadata": {}
        }

    def generate_ai_draft(self, resolution_data: Dict[str, Any]) -> str:
        """
        AI GENERATION LAYER: Consumes deterministic outputs and uses Gemini 3.5 Flash 
        to output structured communications custom-tailored to the patient and doctor.
        """
        if not self.ai_client:
            return "[AI Error] Gemini SDK is unauthenticated. Please set the GEMINI_API_KEY."

        metadata = resolution_data.get("metadata", {})
        
        prompt = f"""
        You are a highly professional medical billing and care gap specialist at a health insurance plan.
        Your job is to draft the communication file based on the Deterministic Next Action Resolution.

        ### DETERMINISTIC ANALYSIS DETAILS:
        - Target Resolution Action: {resolution_data['resolution']}
        - Specific System Reason: {resolution_data['reason']}
        - Recommended Action Path: {resolution_data['recommended_action']}
        
        ### CASE METADATA:
        {metadata}

        ### WRITING DIRECTIVE:
        Generate a professional draft message addressing the appropriate party (either the Provider/Doctor, or the Member/Patient, or an internal claims auditor).
        Use a warm, clear, professional tone. Highlight precisely what went wrong and state the direct steps needed.
        Keep the output concise. Do not hallucinate any medical codes or names not provided above.
        """

        try:
            response = self.ai_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"[AI Generation Failed] Error contacting Gemini: {e}"
