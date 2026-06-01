"""
tutor/agents/concept_mapper.py

Pure-logic agent (NO LLM) that reads the static concept_graph to return
prerequisite, successor, and related concepts for a given topic.

Also generates a human-readable prerequisite_hint string for display
below the question card.

Returns:
    {
        "prerequisites":     List[str],
        "successors":        List[str],
        "related":           List[str],
        "prerequisite_hint": str,   # "" if no prerequisites
    }
"""
from __future__ import annotations

import logging

from .base import AgentContext, BaseAgent

logger = logging.getLogger(__name__)


class ConceptMapperAgent(BaseAgent):
    timeout_seconds = 0.1   # pure dict lookup — should be <5ms
    max_retries = 0

    async def _execute(self, ctx: AgentContext) -> dict:
        from tutor.data.concept_graph import get_concept_info

        info = get_concept_info(ctx.concept)
        prerequisites = info.get('prerequisites', [])
        successors    = info.get('successors', [])
        related       = info.get('related', [])

        # Build a friendly hint string
        if prerequisites:
            formatted = ', '.join(p.replace('_', ' ').title() for p in prerequisites[:3])
            hint = f"💡 Tip: Make sure you're comfortable with {formatted} before diving into this topic."
        else:
            hint = ''

        return {
            'prerequisites':     prerequisites,
            'successors':        successors,
            'related':           related,
            'prerequisite_hint': hint,
        }


concept_mapper_agent = ConceptMapperAgent()
