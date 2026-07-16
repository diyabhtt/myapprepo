import asyncio

from dotenv import load_dotenv

load_dotenv()

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import AgentTool
from google.genai import types

# These will work once your teammates create the files in the /agents folder
from agents.claims_agent import claim_story_agent
from agents.benefits_agent import benefits_agent
from agents.roi_agent import roi_agent
from agents.compliance_agent import compliance_agent

# The Root Agent delegates using its own reasoning
root_agent = Agent(
    name="ClaimStoryCoordinator",
    model="gemini-2.5-flash",
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

APP_NAME = "claim_story"
USER_ID = "test_user"


async def _ask(query: str) -> str:
    session_service = InMemorySessionService()
    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID)
    runner = Runner(app_name=APP_NAME, agent=root_agent, session_service=session_service)

    final_text = ""
    for event in runner.run(
        user_id=USER_ID,
        session_id=session.id,
        new_message=types.Content(role="user", parts=[types.Part(text=query)]),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text

    return final_text


if __name__ == "__main__":
    # Test call
    user_query = "Why was my claim denied?"
    print(asyncio.run(_ask(user_query)))
