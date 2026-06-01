"""
tutor/agents/explanation_agent.py

Generates a full, structured explanation after the student has failed
enough times. Uses the 70B model for depth and clarity.

Returns:
    {
        "explanation":  str,
        "key_concepts": List[str],
        "analogy":      str,
    }
"""
from __future__ import annotations

import logging

from .base import AgentContext, BaseAgent, get_groq_client, parse_json_response

logger = logging.getLogger(__name__)

EXPLANATION_MODEL   = "llama-3.3-70b-versatile"
EXPLANATION_TIMEOUT = 5.0
EXPLANATION_TEMP    = 0.5


class ExplanationAgent(BaseAgent):
    timeout_seconds = EXPLANATION_TIMEOUT
    max_retries = 2

    async def _execute(self, ctx: AgentContext) -> dict:
        prompt = f"""You are an expert tutor explaining a concept to a student who has answered incorrectly multiple times.

Question: {ctx.question_text}
Correct Answer: {ctx.correct_answer}
Concept: {ctx.concept}
Bloom's Level: {ctx.bloom_level}
{f"Additional context: {ctx.rag_context}" if ctx.rag_context else ""}

Provide a CLEAR, STRUCTURED explanation that:
1. Explains WHY the correct answer is correct
2. Addresses common misconceptions at the {ctx.bloom_level} level
3. Includes an analogy or real-world example
4. Lists the key concepts needed to fully understand this

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "explanation":  "clear, detailed explanation (2-4 sentences)",
  "key_concepts": ["concept1", "concept2", "concept3"],
  "analogy":      "one relatable real-world analogy"
}}"""

        client = get_groq_client()
        response = await client.chat.completions.create(
            model=EXPLANATION_MODEL,
            messages=[
                {"role": "system", "content": "You are a clear, patient educator who excels at breaking down complex topics."},
                {"role": "user",   "content": prompt}
            ],
            temperature=EXPLANATION_TEMP,
            max_tokens=400,
        )

        raw = response.choices[0].message.content.strip()
        result = parse_json_response(raw)

        if not result.get('explanation'):
            # If JSON parse failed, use raw text as explanation
            return {
                'explanation':  raw,
                'key_concepts': [],
                'analogy':      '',
            }

        return {
            'explanation':  result.get('explanation', ''),
            'key_concepts': result.get('key_concepts', []),
            'analogy':      result.get('analogy', ''),
        }


explanation_agent = ExplanationAgent()
