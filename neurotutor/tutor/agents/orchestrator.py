"""
tutor/agents/orchestrator.py

Central router for all AI calls. Views talk to the orchestrator; the
orchestrator builds AgentContext, runs agents in two stages, composes
results, and logs metrics.

Two-stage execution:
  Stage 1 (required):  EvaluationAgent
  Stage 2 (parallel):  HintAgent | DifficultyAgent | ConceptMapperAgent
  Explanation:          Only via explicit get_explanation() call
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional

from asgiref.sync import sync_to_async
from django.utils import timezone

from .base import AgentContext, AgentResult
from .evaluation_agent import evaluation_agent
from .hint_agent import hint_agent
from .explanation_agent import explanation_agent
from .difficulty_agent import difficulty_agent
from .concept_mapper import concept_mapper_agent
from .metrics import log_agent_call

logger = logging.getLogger(__name__)


# ── Context builder ────────────────────────────────────────────────────────────

async def _build_context(
    user,
    question,
    user_answer: str = '',
    extra: Optional[Dict[str, Any]] = None,
) -> AgentContext:
    """
    Build a lightweight AgentContext from ORM objects.
    All DB lookups happen here so agents never touch the ORM.
    """
    from tutor.models import Response as QuizResponse, Mastery

    # Attempt count (wrong answers only)
    attempt_count = await sync_to_async(
        QuizResponse.objects.filter(
            user=user, question=question, is_correct=False
        ).count
    )()

    # Recent performance (last 5 answers, any question in same concept)
    recent_qs = await sync_to_async(
        lambda: list(
            QuizResponse.objects.filter(user=user, question__concept=question.concept)
            .order_by('-timestamp')
            .values_list('is_correct', flat=True)[:5]
        )
    )()
    recent_performance = list(recent_qs)
    recent_accuracy = (sum(recent_performance) / len(recent_performance)) if recent_performance else 0.0

    # Current mastery level
    try:
        mastery = await sync_to_async(Mastery.objects.get)(
            user=user, concept=question.concept
        )
        mastery_level = mastery.current_level or 'remember'
    except Mastery.DoesNotExist:
        mastery_level = 'remember'

    return AgentContext(
        user_id=user.pk,
        question_id=question.pk,
        question_text=question.text,
        correct_answer=question.correct_answer,
        concept=question.concept,
        bloom_level=question.bloom_level or mastery_level,
        user_answer=user_answer,
        attempt_count=attempt_count,
        mastery_level=mastery_level,
        recent_accuracy=round(recent_accuracy, 2),
        recent_performance=recent_performance,
        **(extra or {}),
    )


# ── Result logger ─────────────────────────────────────────────────────────────

async def _log(user_id: int, result: AgentResult, ctx: AgentContext = None) -> None:
    """Fire-and-forget metric logging — never blocks main flow."""
    context_data = {}
    if ctx:
        context_data = {
            'concept': ctx.concept,
            'bloom_level': ctx.bloom_level,
            'question_id': ctx.question_id,
        }
    asyncio.ensure_future(log_agent_call(user_id, result, context_metadata=context_data))


# ── Orchestrator ───────────────────────────────────────────────────────────────

class AgentOrchestrator:
    """
    Single entry point for all agent calls from views.
    Maintains backward compatibility with ai_service.py.
    """

    # ── Evaluation (submit_answer) ────────────────────────────────────────────

    async def evaluate_answer(
        self,
        user,
        question,
        user_answer: str,
    ) -> Dict[str, Any]:
        """
        Full two-stage orchestration for answer submission.

        Returns a flat dict merged from all successful agents:
          is_correct, confidence, verdict, reasoning,
          hint (if wrong), difficulty_recommendation (if pattern clear),
          concept_map (always), latencies
        """
        ctx = await _build_context(user, question, user_answer)

        # ── Stage 1: Evaluation (required) ───────────────────────────────────
        eval_result = await evaluation_agent.run(ctx)
        await _log(user.pk, eval_result, ctx)

        is_correct = eval_result.data.get('is_correct', False)

        # ── Stage 2: Parallel tasks ───────────────────────────────────────────
        tasks = []
        task_labels = []

        if not is_correct:
            tasks.append(hint_agent.run(ctx))
            task_labels.append('hint')
        else:
            if difficulty_agent.should_run(ctx):
                tasks.append(difficulty_agent.run(ctx))
                task_labels.append('difficulty')

        # ConceptMapper always runs (fast, no LLM)
        tasks.append(concept_mapper_agent.run(ctx))
        task_labels.append('concept_map')

        stage2_results: list[AgentResult] = await asyncio.gather(
            *tasks, return_exceptions=True
        )

        # Log and compose stage-2 results
        output = {**eval_result.data, 'latencies': {'evaluation': eval_result.latency_ms}}

        for label, result in zip(task_labels, stage2_results):
            if isinstance(result, Exception):
                logger.warning(f"[orchestrator] {label} raised exception: {result!r}")
                continue
            await _log(user.pk, result, ctx)
            if result.success:
                if label == 'hint':
                    output['hint'] = result.data.get('hint', '')
                    output['hint_level'] = result.data.get('hint_level', 1)
                elif label == 'difficulty':
                    output['difficulty_recommendation'] = {
                        'action':               result.data.get('action'),
                        'current_level':        result.data.get('current_level'),
                        'suggested_bloom_level': result.data.get('suggested_bloom_level'),
                        'reason':               result.data.get('reason'),
                        'accuracy':             result.data.get('accuracy'),
                        'show_badge':           result.data.get('show_badge', False),
                    }
                elif label == 'concept_map':
                    output['concept_map'] = {
                        'prerequisites': result.data.get('prerequisites', []),
                        'successors':    result.data.get('successors', []),
                        'related':       result.data.get('related', []),
                    }
                    output['prerequisite_hint'] = result.data.get('prerequisite_hint', '')
                output['latencies'][result.agent] = result.latency_ms

        return output

    # ── Hint (get_hint endpoint) ──────────────────────────────────────────────

    async def get_hint(self, user, question) -> Dict[str, Any]:
        """Called directly from the get_hint view."""
        ctx = await _build_context(user, question)
        result = await hint_agent.run(ctx)
        await _log(user.pk, result, ctx)
        return result.data if result.success else {'hint': '', 'hint_level': 1}

    # ── Explanation (get_explanation endpoint) ────────────────────────────────

    async def get_explanation(self, user, question) -> Dict[str, Any]:
        """Called directly from the get_explanation view."""
        ctx = await _build_context(user, question)
        # Optionally enrich with RAG
        try:
            from tutor.services.rag_service import rag_service
            rag_results = await sync_to_async(rag_service.search)(question.concept, n_results=2)
            if rag_results:
                ctx.rag_context = ' '.join(r.get('document', '') for r in rag_results[:2])
        except Exception:
            pass  # RAG optional
        result = await explanation_agent.run(ctx)
        await _log(user.pk, result, ctx)
        return result.data if result.success else {}

    # ── Concept map (new /api/concept/map/ endpoint) ──────────────────────────

    async def get_concept_map(self, concept: str, user_id: int = 0) -> Dict[str, Any]:
        """Called from the new concept/map/ view."""
        from .base import AgentContext
        ctx = AgentContext(
            user_id=user_id,
            question_id=0,
            question_text='_',
            correct_answer='_',
            concept=concept,
            bloom_level='remember',
        )
        result = await concept_mapper_agent.run(ctx)
        if user_id:
            await _log(user_id, result, ctx)
        
        if result.success:
            data = result.data.copy()
            data['latencies'] = {result.agent: result.latency_ms}
            return data
        return {}


# Module-level singleton
orchestrator = AgentOrchestrator()
