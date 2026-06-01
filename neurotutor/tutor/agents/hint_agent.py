"""
tutor/agents/hint_agent.py

Generates a Socratic hint calibrated to the student's attempt count.
Uses a smaller, faster model (8b) to keep latency low.

Hint levels (driven by attempt_count):
  1 — Gentle nudge        (attempt 0)
  2 — Directional hint    (attempt 1)
  3 — Near-answer hint    (attempt 2+)

Returns:
    {
        "hint":       str,
        "hint_level": int (1-3),
    }
"""
from __future__ import annotations

import logging

from .base import AgentContext, BaseAgent, get_groq_client

logger = logging.getLogger(__name__)

HINT_MODEL   = "llama-3.1-8b-instant"   # fast + cheap
HINT_TIMEOUT = 3.0
HINT_TEMP    = 0.4


class HintAgent(BaseAgent):
    timeout_seconds = HINT_TIMEOUT
    max_retries = 2

    async def _execute(self, ctx: AgentContext) -> dict:
        hint_level = min(ctx.attempt_count + 1, 3)

        level_instructions = {
            1: (
                "Give a very gentle nudge. Ask a Socratic question that points the student "
                "in the right direction WITHOUT revealing the answer. Be encouraging."
            ),
            2: (
                "Give a directional hint that narrows the problem space. You may reveal "
                "the approach or framework needed, but not the final answer."
            ),
            3: (
                "Give a near-answer hint. The student has struggled — help them get most of "
                "the way there. You may reveal key vocabulary and the structure of the answer."
            ),
        }

        instruction = level_instructions[hint_level]

        prompt = f"""You are a patient, encouraging tutor helping a student.

Question: {ctx.question_text}
Concept: {ctx.concept}
Student has attempted this question {ctx.attempt_count} time(s).

Your task: {instruction}

Reply with ONLY the hint text (1-3 sentences). No preamble, no "Sure!", no explanation of what you are doing."""

        client = get_groq_client()
        response = await client.chat.completions.create(
            model=HINT_MODEL,
            messages=[
                {"role": "system", "content": "You are a Socratic tutor who never gives away answers directly."},
                {"role": "user",   "content": prompt}
            ],
            temperature=HINT_TEMP,
            max_tokens=150,
        )

        hint = response.choices[0].message.content.strip()
        return {
            'hint':       hint,
            'hint_level': hint_level,
        }


hint_agent = HintAgent()
