import asyncio

from dotenv import load_dotenv

load_dotenv()

from google.adk import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import AgentTool
from google.genai import types

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

    IMPORTANT -- caller verification comes first: if the caller gives
    their own name while asking about a member's claim (e.g. "this is
    <name> calling about <member>'s claim"), you do not yet know if
    they're authorized to discuss that member's information. Before
    answering anything substantive, call ROIAgent with the caller's
    name and the member/claim ID to verify authorization. Only proceed
    to explain claims/benefits/resolution once ROIAgent confirms the
    caller is authorized (or is the member themselves); if not
    authorized, relay ROIAgent's guidance instead of the underlying
    claim/benefit details.

    Otherwise, route the user to:
    - ClaimStoryAgent for status/denial explanations.
    - BenefitsAgent for coverage/CPT questions.
    - ROIAgent for "what do I need to do next" resolution questions,
      including prior authorization gaps, stalled claims, provider
      credentialing issues, and denial follow-up actions.
    - ComplianceAgent for proactive risk monitoring across a member's
      claims and provider history.
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
