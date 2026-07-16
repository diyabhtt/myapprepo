"""Manual smoke test for claim_story_agent against the real Gemini model.

Run with: ./.venv/bin/python3 -m tests.manual_test_claims_agent
Requires GCP Application Default Credentials (gcloud auth application-default
login) since .env is configured for Vertex AI. This makes real, billed model
calls -- it is not a unit test and is not meant to run in CI.
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agents.claims_agent import claim_story_agent

APP_NAME = "claims_agent_test"
USER_ID = "test_user"

QUESTIONS = [
    "Why was claim CLM000003 denied, and what do I need to do about it?",
    "What's going on with claim CLM000005? Can it be fixed?",
    "What's the status of claim CLM000001?",
    "Can you tell me about all of MBR00001's claims?",
    "What happened with claim CLM999999?",  # unknown claim_id
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
    runner = Runner(app_name=APP_NAME, agent=claim_story_agent, session_service=session_service)

    for i, question in enumerate(QUESTIONS):
        session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID)
        print(f"\n=== Q{i + 1}: {question}")
        answer = await ask(runner, session.id, question)
        print(f"--- A{i + 1}: {answer}")


if __name__ == "__main__":
    asyncio.run(main())
