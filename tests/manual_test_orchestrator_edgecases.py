"""Edge-case tests for the root_agent orchestrator: routing overlap between
claim_story_agent and roi_agent's denial logic, and the ROI/caller-identity
flow requiring the orchestrator to extract caller_name from natural language.

Run with: ./.venv/bin/python3 -m tests.manual_test_orchestrator_edgecases
Makes real, billed model calls.
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from main import root_agent

APP_NAME = "orchestrator_edgecase_test"
USER_ID = "test_user"

QUESTIONS = [
    ("Overlap: denial + next step", "Why was claim CLM000005 denied, and what should I do about it?"),
    ("ROI: authorized caller", "Hi, this is Daniel Barrett calling about MBR00001's claim CLM000003. Can you help?"),
    ("ROI: unauthorized caller", "Hi, my name is John Smith and I'm calling about member MBR00001's claim."),
    ("Bad ID via orchestrator", "What's the status of claim CLM999999?"),
]


async def ask(runner: Runner, session_id: str, query: str) -> str:
    final_text = ""
    for event in runner.run(
        user_id=USER_ID,
        session_id=session_id,
        new_message=types.Content(role="user", parts=[types.Part(text=query)]),
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = event.content.parts[0].text
    return final_text


async def main() -> None:
    session_service = InMemorySessionService()
    runner = Runner(app_name=APP_NAME, agent=root_agent, session_service=session_service)

    for label, question in QUESTIONS:
        session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID)
        print(f"\n=== [{label}] {question}")
        answer = await ask(runner, session.id, question)
        print(f"--- {answer}")


if __name__ == "__main__":
    asyncio.run(main())
