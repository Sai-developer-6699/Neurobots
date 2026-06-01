"""
tutor/agents/difficulty_agent.py

Pure-logic agent (NO LLM) that analyses recent performance and recommends
a Bloom's taxonomy level adjustment.

Smart trigger: only returns a recommendation when the pattern is clear:
  - accuracy >= 0.8  →  advance
  - accuracy <= 0.4  →  remediate
  - otherwise        →  stay (no badge shown to user)

Returns:
    {
        "action":               "advance" | "remediate" | "stay" | "mastered",
        "current_level":        str,   # current bloom level
        "suggested_bloom_level": str,
        "reason":               str,
        "accuracy":             float,
        "show_badge":           bool,  # frontend should only render badge if True
    }
"""
from __future__ import annotations

import logging
from typing import List, Optional

from .base import AgentContext, BaseAgent

logger = logging.getLogger(__name__)

# Bloom's taxonomy ordered list
BLOOM_ORDER = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

ADVANCE_THRESHOLD  = 0.80   # ≥ 80% accuracy → advance
REMEDIATE_THRESHOLD = 0.40  # ≤ 40% accuracy → remediate
MIN_SAMPLES = 5              # need at least 5 results for a recommendation


def _next_bloom(current: str) -> Optional[str]:
    """Return the next Bloom level, or None if already at max."""
    try:
        idx = BLOOM_ORDER.index(current.lower())
        return BLOOM_ORDER[idx + 1] if idx + 1 < len(BLOOM_ORDER) else None
    except ValueError:
        return None


def _prev_bloom(current: str) -> Optional[str]:
    """Return the previous Bloom level, or None if already at min."""
    try:
        idx = BLOOM_ORDER.index(current.lower())
        return BLOOM_ORDER[idx - 1] if idx > 0 else None
    except ValueError:
        return None


class DifficultyAgent(BaseAgent):
    """
    No LLM — pure rule-based difficulty assessment.
    Overrides timeout to be very tight (0.5s) since this is just arithmetic.
    """
    timeout_seconds = 0.5
    max_retries = 0      # no point retrying pure logic

    def should_run(self, ctx: AgentContext) -> bool:
        """
        Only fire when we have enough data AND the pattern is clear.
        Prevents noisy recommendations on low sample sizes.
        """
        if not ctx.recent_performance or len(ctx.recent_performance) < MIN_SAMPLES:
            return False
        accuracy = sum(ctx.recent_performance) / len(ctx.recent_performance)
        return accuracy >= ADVANCE_THRESHOLD or accuracy <= REMEDIATE_THRESHOLD

    async def _execute(self, ctx: AgentContext) -> dict:
        perf = ctx.recent_performance or []
        accuracy = sum(perf) / len(perf) if perf else ctx.recent_accuracy
        current = ctx.bloom_level.lower() if ctx.bloom_level else 'remember'

        if accuracy >= ADVANCE_THRESHOLD:
            next_level = _next_bloom(current)
            if next_level:
                return {
                    'action':               'advance',
                    'current_level':        current,
                    'suggested_bloom_level': next_level,
                    'reason':               f"Strong performance — {accuracy*100:.0f}% accuracy on last {len(perf)} questions.",
                    'accuracy':             round(accuracy, 2),
                    'show_badge':           True,
                }
            else:
                return {
                    'action':               'mastered',
                    'current_level':        current,
                    'suggested_bloom_level': current,
                    'reason':               f"You've mastered all Bloom levels for this concept!",
                    'accuracy':             round(accuracy, 2),
                    'show_badge':           True,
                }

        elif accuracy <= REMEDIATE_THRESHOLD:
            prev_level = _prev_bloom(current)
            if prev_level:
                return {
                    'action':               'remediate',
                    'current_level':        current,
                    'suggested_bloom_level': prev_level,
                    'reason':               f"Let's consolidate the basics — {accuracy*100:.0f}% accuracy on last {len(perf)} questions.",
                    'accuracy':             round(accuracy, 2),
                    'show_badge':           True,
                }
            else:
                return {
                    'action':               'stay',
                    'current_level':        current,
                    'suggested_bloom_level': current,
                    'reason':               f"Keep practising — you're at the foundation level.",
                    'accuracy':             round(accuracy, 2),
                    'show_badge':           False,
                }

        # Pattern not strong enough → stay quietly
        return {
            'action':               'stay',
            'current_level':        current,
            'suggested_bloom_level': current,
            'reason':               'Performance is stable.',
            'accuracy':             round(accuracy, 2),
            'show_badge':           False,
        }


difficulty_agent = DifficultyAgent()
