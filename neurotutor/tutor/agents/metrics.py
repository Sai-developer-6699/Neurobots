"""
tutor/agents/metrics.py

Agent observability: logs every agent call as a LearningEvent.
Used by AgentOrchestrator after every agent run.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.utils import timezone
from asgiref.sync import sync_to_async

if TYPE_CHECKING:
    from .base import AgentResult

logger = logging.getLogger(__name__)


async def log_agent_call(user_id: int, result: 'AgentResult', context_metadata: dict = None) -> None:
    """
    Persist an agent execution record as a LearningEvent.
    Swallowed silently on failure so metrics never block the main flow.
    """
    try:
        from tutor.models import LearningEvent
        from django.contrib.auth import get_user_model
        User = get_user_model()

        user = await sync_to_async(User.objects.get)(pk=user_id)
        
        payload = {
            'agent':      result.agent,
            'success':    result.success,
            'latency_ms': result.latency_ms,
            'error':      result.error,
            'ts':         timezone.now().isoformat(),
        }
        if context_metadata:
            payload.update(context_metadata)

        await sync_to_async(LearningEvent.objects.create)(
            user=user,
            event_type='agent_execution',
            payload=payload
        )
    except Exception as exc:
        logger.warning(f"[metrics] Failed to log agent call for {result.agent}: {exc!r}")
