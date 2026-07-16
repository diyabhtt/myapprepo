from google.adk import Agent, AgentTool
# These will work once your teammates create the files in the /agents folder
from agents.claims_agent import claim_story_agent
from agents.benefits_agent import benefits_agent
from agents.roi_agent import roi_agent
from agents.compliance_agent import compliance_agent

# The Root Agent delegates using its own reasoning
root_agent = Agent(
    name="ClaimStoryCoordinator",
    model="gemini-1.5-pro", 
    instruction="""
    You are the proactive 'Claim Story AI'. 
    Your goal is to reduce call volume by explaining complex claims and benefits.
    Route the user to:
    - ClaimStoryAgent for status/denial explanations.
    - BenefitsAgent for coverage/CPT questions.
    - ROIAgent if a caller is asking about someone else.
    - ComplianceAgent for risk monitoring.
    """,
    tools=[
        AgentTool(claim_story_agent),
        AgentTool(benefits_agent),
        AgentTool(roi_agent),
        AgentTool(compliance_agent)
    ]
)

if __name__ == "__main__":
    # Test call
    user_query = "Why was my claim denied?"
    print(root_agent.chat(user_query).text)
