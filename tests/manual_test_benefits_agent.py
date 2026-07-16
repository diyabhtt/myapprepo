"""Manual smoke test for benefits_agent against the real Gemini model.

Run with: ./.venv/bin/python3 tests/manual_test_benefits_agent.py
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

from agents.benefits_agent import benefits_agent

APP_NAME = "benefits_agent_test"
USER_ID = "test_user"

QUESTIONS = [
    "Member MBR00001 wants to know if CPT code 99213 is covered under their plan, and what they'd owe.",
    "Is Dr. Fowler (provider PRV0001) in-network?",
    "What's the coverage for CPT 99397 under an HMO plan?",
    "What is member MBR99999's plan?",  # unknown member_id, should surface the error gracefully
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
    runner = Runner(app_name=APP_NAME, agent=benefits_agent, session_service=session_service)

    for i, question in enumerate(QUESTIONS):
        session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID)
        print(f"\n=== Q{i + 1}: {question}")
        answer = await ask(runner, session.id, question)
        print(f"--- A{i + 1}: {answer}")


if __name__ == "__main__":
    asyncio.run(main())
