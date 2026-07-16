import os
import sys
from src.resolutions import ResolutionAgent

def run_agent_test():
    print("==================================================")
    print("   INITIALIZING RESOLUTION AGENT SELF-TEST        ")
    print("==================================================")

    # Initialize the Agent (empty params lets the auto-detector find 'data/structured')
    try:
        agent = ResolutionAgent()
        print("✓ Successfully loaded all local CSV databases!")
    except Exception as e:
        print(f"✗ Failed to load database: {e}")
        print("\nPlease ensure your CSV files are inside 'data/structured/' in this directory.")
        sys.exit(1)

    # -------------------------------------------------------------
    # TEST CASE 1: HIPAA Compliance Check (Unauthorized Caller)
    # -------------------------------------------------------------
    print("\n--- TEST 1: HIPAA / ROI Security Check ---")
    print("Evaluating Member: MBR00003 (Matthew Avila) with Caller 'Sarah Parker'...")
    
    result_1 = agent.resolve(member_id="MBR00003", caller_name="Sarah Parker")
    
    print(f"Deterministic Resolution: -> '{result_1['resolution']}'")
    print(f"Reasoning: {result_1['reason']}")
    print(f"Recommended Action: {result_1['recommended_action']}")

    # -------------------------------------------------------------
    # TEST CASE 2: Stalled Claim Check
    # -------------------------------------------------------------
    print("\n--- TEST 2: Stalled Claims Check ---")
    print("Evaluating Claim: CLM000001 (In Review for 378 Days)...")
    
    result_2 = agent.resolve(claim_id="CLM000001")
    
    print(f"Deterministic Resolution: -> '{result_2['resolution']}'")
    print(f"Reasoning: {result_2['reason']}")
    print(f"Recommended Action: {result_2['recommended_action']}")

    # -------------------------------------------------------------
    # TEST CASE 3: Fixable Denial (Modifier Mismatch)
    # -------------------------------------------------------------
    print("\n--- TEST 3: Fixable Denial Code (CO-4) Check ---")
    print("Evaluating Claim: CLM000014 (Denied with fixable modifier mismatch)...")
    
    result_3 = agent.resolve(claim_id="CLM000014")
    
    print(f"Deterministic Resolution: -> '{result_3['resolution']}'")
    print(f"Reasoning: {result_3['reason']}")
    print(f"Recommended Action: {result_3['recommended_action']}")

    # -------------------------------------------------------------
    # TEST CASE 4: AI Communication Draft Check
    # -------------------------------------------------------------
    print("\n==================================================")
    print("      TESTING AI GENERATION LAYER (GEMINI)        ")
    print("==================================================")
    
    # Check if key or Vertex is configured
    has_api_key = "GEMINI_API_KEY" in os.environ
    has_vertex = "GOOGLE_GENAI_USE_VERTEXAI" in os.environ
    
    if not (has_api_key or has_vertex):
        print("⚠ Skipping AI Test: No authentication environment variables found.")
        print("To test the AI, run 'export GEMINI_API_KEY=\"your_key\"' in terminal first.")
        return

    print("Sending Test 1 findings to Gemini 3.5 Flash to draft a message...")
    try:
        ai_draft = agent.generate_ai_draft(result_1)
        print("\n=== AI GENERATED DRAFT ===")
        print(ai_draft)
        print("==========================")
        print("✓ AI Draft Generated successfully!")
    except Exception as e:
        print(f"✗ AI Generation failed: {e}")

if __name__ == "__main__":
    run_agent_test()
