"""
tutor/agents/base.py

Shared protocol for all Phase 8 agents:
  - AgentContext  : lightweight input (no ORM objects)
  - AgentResult   : standard output
  - BaseAgent     : abstract base with retry + timeout + exponential backoff
  - Groq client accessor
  - JSON parse helper
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional

import groq
from django.conf import settings

logger = logging.getLogger(__name__)


# ── Shared data classes ───────────────────────────────────────────────────────

@dataclass
class AgentContext:
    """
    Lightweight input for every agent. Never holds full ORM objects —
    only primitive types so agents are easy to test and serialisable.
    """
    # Identifiers
    user_id: int
    question_id: int

    # Question data
    question_text: str
    correct_answer: str
    concept: str
    bloom_level: str

    # User input
    user_answer: str = ''

    # Pre-computed metrics (populated by orchestrator, not agents)
    attempt_count: int = 0
    mastery_level: str = 'remember'
    recent_accuracy: float = 0.0          # mean of last 5 bool results
    recent_performance: Optional[List[bool]] = None  # populated only when needed

    # Optional RAG context (populated by orchestrator when available)
    rag_context: Optional[str] = None

    def __post_init__(self):
        if not self.question_text:
            raise ValueError("AgentContext.question_text is required")


@dataclass
class AgentResult:
    """Standard output from every agent."""
    agent: str          # class name of the producing agent
    success: bool
    data: dict
    error: str = ''
    latency_ms: int = 0

    def __repr__(self):
        status = '✅' if self.success else '❌'
        return f"AgentResult({status} {self.agent}, {self.latency_ms}ms)"


# ── Groq client singleton ─────────────────────────────────────────────────────

_groq_client: Optional[groq.AsyncGroq] = None


def get_groq_client() -> groq.AsyncGroq:
    global _groq_client
    if _groq_client is None:
        api_key = getattr(settings, 'GROQ_API_KEY', None) or __import__('os').getenv('GROQ_API_KEY')
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set in settings or environment")
        _groq_client = groq.AsyncGroq(api_key=api_key)
    return _groq_client


# ── JSON parse helper ─────────────────────────────────────────────────────────

def parse_json_response(text: str) -> dict:
    """
    Extract the first JSON object from an LLM response.
    Handles markdown code fences and stray text around the JSON.
    """
    # Strip ```json ... ``` fences
    text = re.sub(r'```(?:json)?\s*', '', text).strip().rstrip('`').strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract first {...} block
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return {}


# ── Base agent ────────────────────────────────────────────────────────────────

class BaseAgent(ABC):
    """
    Abstract base for all agents.

    Subclasses implement _execute(ctx) with their business logic.
    run() provides:
      - AsyncIO timeout
      - Retry with exponential backoff (1 s, 2 s)
      - Structured AgentResult on success or failure
    """
    max_retries: int = 2
    timeout_seconds: float = 30.0

    @abstractmethod
    async def _execute(self, ctx: AgentContext) -> dict:
        """Override with agent logic. Return a plain dict on success."""
        ...

    async def run(self, ctx: AgentContext) -> AgentResult:
        start = time.monotonic()

        for attempt in range(self.max_retries + 1):
            try:
                data = await asyncio.wait_for(
                    self._execute(ctx),
                    timeout=self.timeout_seconds
                )
                latency = int((time.monotonic() - start) * 1000)
                logger.debug(f"{self.__class__.__name__} succeeded in {latency}ms")
                return AgentResult(
                    agent=self.__class__.__name__,
                    success=True,
                    data=data,
                    latency_ms=latency
                )

            except asyncio.TimeoutError:
                if attempt == self.max_retries:
                    latency = int((time.monotonic() - start) * 1000)
                    logger.warning(f"{self.__class__.__name__} timed out after {self.timeout_seconds}s")
                    return AgentResult(
                        agent=self.__class__.__name__,
                        success=False,
                        data={},
                        error=f"Timeout after {self.timeout_seconds}s",
                        latency_ms=latency
                    )
                # Will retry

            except Exception as exc:
                if attempt < self.max_retries:
                    backoff = 2 ** attempt  # 1s, 2s
                    logger.warning(
                        f"{self.__class__.__name__} attempt {attempt+1} failed "
                        f"({exc!r}), retrying in {backoff}s"
                    )
                    await asyncio.sleep(backoff)
                else:
                    latency = int((time.monotonic() - start) * 1000)
                    logger.error(f"{self.__class__.__name__} failed after {self.max_retries+1} attempts: {exc!r}")
                    return AgentResult(
                        agent=self.__class__.__name__,
                        success=False,
                        data={},
                        error=str(exc),
                        latency_ms=latency
                    )

        # Should not reach here, but safety net
        return AgentResult(agent=self.__class__.__name__, success=False, data={}, error="Unknown error")
