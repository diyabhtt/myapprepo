"""Manual smoke test for the full root_agent orchestrator (all 4 sub-agents).

Run with: ./.venv/bin/python3 -m tests.manual_test_orchestrator
Requires GCP Application Default Credentials since .env is configured for
Vertex AI. This makes real, billed model calls -- it is not a unit test.
"""

import asyncio

from dotenv import load_dotenv

load_dotenv()

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from main import root_agent

APP_NAME = "orchestrator_test"
USER_ID = "test_user"

QUESTIONS = [
    ("Claims", "Why was claim CLM000003 denied?"),
    ("Benefits", "Is CPT code 99213 covered for member MBR00001, and what would they owe?"),
    ("Resolution/ROI", "What should be done next for claim CLM000001?"),
    ("Compliance/Risk", "Can you check member MBR00001 for any compliance or risk issues?"),
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
