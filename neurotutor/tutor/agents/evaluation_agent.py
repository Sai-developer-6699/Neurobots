"""
tutor/agents/evaluation_agent.py

Semantically grades a student answer using an LLM.
Falls back to string matching if the LLM call fails.

Returns:
    {
        "is_correct": bool,
        "confidence": float,   # 0.0 – 1.0
        "verdict":    str,     # "correct" | "partial" | "incorrect"
        "reasoning":  str,
    }
"""
from __future__ import annotations

import logging

from .base import AgentContext, AgentResult, BaseAgent, get_groq_client, parse_json_response

logger = logging.getLogger(__name__)

EVAL_MODEL    = "llama-3.3-70b-versatile"
EVAL_TIMEOUT  = 5.0   # seconds
EVAL_TEMP     = 0.1   # low temperature for consistent grading


class EvaluationAgent(BaseAgent):
    timeout_seconds = EVAL_TIMEOUT
    max_retries = 2

    async def _execute(self, ctx: AgentContext) -> dict:
        prompt = f"""You are an expert tutor grading a student's answer.

Question: {ctx.question_text}
Correct Answer: {ctx.correct_answer}
Student's Answer: {ctx.user_answer}
Concept: {ctx.concept}
Bloom's Taxonomy Level: {ctx.bloom_level}

Instructions:
- Award credit if the student's answer conveys the correct meaning, even with different wording.
- Use the Bloom's level to calibrate depth expectations.
- Be generous with partial understanding at lower levels (remember, understand).
- Require precision at higher levels (apply, analyze, evaluate, create).

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "is_correct": true or false,
  "confidence": 0.0 to 1.0,
  "verdict": "correct" or "partial" or "incorrect",
  "reasoning": "one sentence explanation"
}}"""

        client = get_groq_client()
        response = await client.chat.completions.create(
            model=EVAL_MODEL,
            messages=[
                {"role": "system", "content": "You are a precise, fair academic grader."},
                {"role": "user",   "content": prompt}
            ],
            temperature=EVAL_TEMP,
            max_tokens=200,
        )

        raw = response.choices[0].message.content.strip()
        result = parse_json_response(raw)

        if not result or 'is_correct' not in result:
            raise ValueError(f"Unparseable LLM response: {raw[:200]}")

        is_correct = bool(result.get('is_correct', False))
        confidence = float(result.get('confidence', 1.0 if is_correct else 0.0))
        confidence = max(0.0, min(1.0, confidence))

        return {
            'is_correct': is_correct,
            'confidence': confidence,
            'verdict':    result.get('verdict', 'correct' if is_correct else 'incorrect'),
            'reasoning':  result.get('reasoning', ''),
        }

    # ── Fallback ──────────────────────────────────────────────────────────────
    @staticmethod
    def string_match_fallback(ctx: AgentContext) -> dict:
        """Used when LLM is completely unavailable."""
        ua = ctx.user_answer.strip().lower()
        ca = ctx.correct_answer.strip().lower()
        is_correct = ua == ca 
        return {
            'is_correct': is_correct,
            'confidence': 1.0 if is_correct else 0.0,
            'verdict':    'correct' if is_correct else 'incorrect',
            'reasoning':  'Exact match fallback (LLM unavailable)',
            'fallback_used': True,
        }

    async def run(self, ctx: AgentContext) -> AgentResult:
        result = await super().run(ctx)
        if not result.success:
            logger.warning("EvaluationAgent LLM failed — using string-match fallback")
            fallback_data = self.string_match_fallback(ctx)
            return AgentResult(
                agent='EvaluationAgent(fallback)',
                success=True,
                data=fallback_data,
                latency_ms=result.latency_ms
            )
        return result


evaluation_agent = EvaluationAgent()
