import os
import asyncio
from groq import AsyncGroq
from asgiref.sync import sync_to_async  # ← ADD THIS LINE
from typing import Optional, Dict
from django.conf import settings
from .models import LearningEvent, Question
import json
import warnings
from functools import wraps

def deprecated(func):
    """Marks a function as deprecated."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        warnings.warn(f"{func.__name__} is deprecated. Use AgentOrchestrator instead.", DeprecationWarning, stacklevel=2)
        return await func(*args, **kwargs)
    return wrapper
from .prompts import (
    get_feedback_system_prompt, 
    get_feedback_user_prompt, 
    get_hint_system_prompt, 
    get_hint_user_prompt,
    get_explanation_system_prompt,
    get_explanation_user_prompt,
    get_evaluation_system_prompt,
    get_evaluation_user_prompt,
)
from .services.rag_service import rag_service
from .agents.orchestrator import orchestrator


class AIService:
    """
    Legacy AI façade.

    Phase 8 introduced a multi-agent architecture coordinated by AgentOrchestrator.
    New code should call the orchestrator (or specific agents) directly.
    These methods remain for backward compatibility and delegate to the new
    flows where possible, falling back to the original Groq-based logic otherwise.
    """
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            print("WARNING: GROQ_API_KEY not found in environment variables.")
            self.client = None
        else:
            self.client = AsyncGroq(api_key=self.api_key)
        
        self.max_retries = 3
        self.retry_delay = 1  # seconds

    async def _call_llm(
        self, 
        prompt: str, 
        system_prompt: str,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.7,
        max_tokens: int = 250
    ) -> Optional[str]:
        """
        Call Groq API asynchronously with retry logic.
        """
        if not self.client:
            return None

        for attempt in range(self.max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=30
                )
                return response.choices[0].message.content
                
            except Exception as e:
                print(f"Groq API error (Attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                    continue
                else:
                    return None

    @deprecated
    async def generate_feedback(
        self,
        question_text: str,
        user_answer: str,
        correct_answer: str,
        concept: str,
        bloom_level: str,
        user
    ) -> Dict[str, str]:
        """
        Generate constructive feedback asynchronously.
        """
        system_prompt = get_feedback_system_prompt(bloom_level)
        
        # RAG Search
        try:
            context_chunks = await sync_to_async(rag_service.search)(
                query=f"{concept}: {question_text}",
                n_results=2
            )
            context = rag_service.format_context(context_chunks)
        except Exception as e:
            print(f"RAG Error in feedback: {e}")
            context = None

        user_prompt = get_feedback_user_prompt(question_text, user_answer, correct_answer, concept, bloom_level, context=context)

        feedback = await self._call_llm(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )
        
        # Log AI interaction (Sync DB call needs wrapping or use acreate in views if possible, 
        # but here we are in async context. Django 4.2+ supports acreate on models)
        if feedback:
            await LearningEvent.objects.acreate(
                user=user,
                event_type='ai_feedback_generated',
                payload={
                    'question_text': question_text,
                    'user_answer': user_answer,
                    'concept': concept,
                    'bloom_level': bloom_level,
                    'feedback': feedback,
                    'model': 'llama-3.1-8b-instant'
                }
            )
        
        return {
            'feedback': feedback or "I'm having trouble generating feedback right now. Please try again.",
            'fallback_used': feedback is None
        }

    @deprecated
    async def generate_socratic_hint(
        self,
        question_text: str,
        concept: str,
        bloom_level: str,
        attempt_count: int,
        user
    ) -> Dict[str, str]:
        """
        Generate Socratic hint asynchronously.

        Phase 8: Hint generation is handled by HintAgent via AgentOrchestrator.
        This method is kept for compatibility and will favour the orchestrator
        when a matching Question row can be resolved; otherwise it falls back
        to the original direct-LLM implementation.
        """
        # Try to route through orchestrator when we can resolve a Question.
        try:
            question = await sync_to_async(Question.objects.filter(
                text=question_text,
                concept__iexact=concept
            ).order_by('-id').first)()
        except Exception:
            question = None

        if question is not None:
            data = await orchestrator.get_hint(user=user, question=question)
            return {
                'hint': data.get('hint') or "Try breaking down the problem into smaller parts. What do you know about the concept?",
                'fallback_used': False,
            }

        # Fallback: original monolithic implementation
        if attempt_count == 0:
            hint_style = "Ask a very broad guiding question"
        elif attempt_count == 1:
            hint_style = "Narrow the focus to the key concept"
        elif attempt_count >= 2:
            hint_style = "Give a more direct hint, but still don't reveal the answer"
        else:
            hint_style = "Ask a guiding question"
        
        system_prompt = get_hint_system_prompt(hint_style)
        user_prompt = get_hint_user_prompt(question_text, concept, bloom_level, attempt_count)

        hint = await self._call_llm(
            prompt=user_prompt,
            system_prompt=system_prompt,
            model="llama-3.1-8b-instant",
            temperature=0.8,
            max_tokens=150
        )
        
        if hint:
            await LearningEvent.objects.acreate(
                user=user,
                event_type='hint_requested',
                payload={
                    'question_text': question_text,
                    'concept': concept,
                    'bloom_level': bloom_level,
                    'attempt_count': attempt_count,
                    'hint': hint
                }
            )
        
        return {
            'hint': hint or "Try breaking down the problem into smaller parts. What do you know about the concept?",
            'fallback_used': hint is None
        }

    @deprecated
    async def generate_explanation(
        self,
        question_text: str,
        correct_answer: str,
        concept: str,
        user,
        question_id: int,
        attempt_count: int
    ) -> str:
        """
        Generate explanation asynchronously.

        Phase 8: Explanation is handled by ExplanationAgent via AgentOrchestrator.
        This method is kept for compatibility and will favour the orchestrator
        when a matching Question row can be resolved; otherwise it falls back
        to the original direct-LLM implementation.
        """
        # Try to route through orchestrator when we can resolve a Question.
        try:
            question = await sync_to_async(Question.objects.get)(id=question_id)
        except Exception:
            question = None

        if question is not None:
            data = await orchestrator.get_explanation(user=user, question=question)
            explanation_text = data.get('explanation')
            if explanation_text:
                await sync_to_async(LearningEvent.objects.create)(
                    user=user,
                    event_type='explanation_requested',
                    payload={
                        'question_id': question_id,
                        'attempt_count': attempt_count,
                        'explanation': explanation_text,
                        'agent_payload': data,
                    }
                )
            return explanation_text

        # Fallback: original monolithic implementation with RAG.
        system_prompt = get_explanation_system_prompt()
        
        try:
            context_chunks = await sync_to_async(rag_service.search)(
                query=f"{concept}: {question_text} explanation",
                n_results=3
            )
            context = rag_service.format_context(context_chunks)
        except Exception as e:
            print(f"RAG Error in explanation: {e}")
            context = None

        user_prompt = get_explanation_user_prompt(question_text, correct_answer, concept, context=context)

        explanation = await self._call_llm(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.5
        )

        if explanation:
            await sync_to_async(LearningEvent.objects.create)(
                user=user,
                event_type='explanation_requested',
                payload={
                    'question_id': question_id,
                    'attempt_count': attempt_count,
                    'explanation': explanation
                }
            )

        return explanation

    @deprecated
    async def evaluate_answer(
        self,
        question_text: str,
        user_answer: str,
        correct_answer: str,
        concept: str,
        bloom_level: str,
        user
    ) -> Dict:
        """
        Semantically evaluate a student's answer using LLM.
        Returns a dict with: is_correct, verdict, confidence, explanation, fallback_used.
        Falls back to string matching if LLM is unavailable or returns invalid JSON.
        """
        # --- Fast path: exact match (saves an LLM call) ---
        if user_answer.strip().lower() == correct_answer.strip().lower():
            return {
                'is_correct': True,
                'verdict': 'correct',
                'confidence': 1.0,
                'explanation': 'Your answer matches exactly.',
                'fallback_used': False,
            }

        # --- LLM semantic evaluation ---
        system_prompt = get_evaluation_system_prompt()
        user_prompt = get_evaluation_user_prompt(
            question_text, user_answer, correct_answer, concept, bloom_level
        )

        raw_response = await self._call_llm(
            prompt=user_prompt,
            system_prompt=system_prompt,
            model="llama-3.1-8b-instant",
            temperature=0.1,   # Low temp for deterministic grading
            max_tokens=150,
        )

        # --- Parse LLM JSON response ---
        verdict = None
        confidence = 0.0
        explanation = ""
        fallback_used = False

        if raw_response:
            try:
                # Strip markdown code fences if model wraps in ```json ... ```
                clean = raw_response.strip().strip('`')
                if clean.startswith('json'):
                    clean = clean[4:].strip()
                parsed = json.loads(clean)
                verdict = parsed.get('verdict', '').lower()
                confidence = float(parsed.get('confidence', 0.0))
                explanation = parsed.get('explanation', '')
            except (json.JSONDecodeError, ValueError, KeyError):
                fallback_used = True

        # --- Fallback: string match if LLM failed ---
        if fallback_used or verdict not in ('correct', 'partial', 'incorrect'):
            fallback_used = True
            is_correct_str = user_answer.strip().lower() == correct_answer.strip().lower()
            verdict = 'correct' if is_correct_str else 'incorrect'
            confidence = 1.0 if is_correct_str else 0.0
            explanation = 'Evaluated by exact match (LLM unavailable).'

        # --- Determine final correctness ---
        # Treat "partial" with confidence >= 0.6 as accepted
        is_correct = (verdict == 'correct') or (verdict == 'partial' and confidence >= 0.6)

        # --- Log the evaluation event ---
        try:
            await LearningEvent.objects.acreate(
                user=user,
                event_type='answer_evaluated',
                payload={
                    'question_text': question_text,
                    'user_answer': user_answer,
                    'concept': concept,
                    'bloom_level': bloom_level,
                    'verdict': verdict,
                    'confidence': confidence,
                    'explanation': explanation,
                    'is_correct': is_correct,
                    'fallback_used': fallback_used,
                    'raw_llm_response': raw_response,
                }
            )
        except Exception as e:
            print(f"Error logging evaluation event: {e}")

        return {
            'is_correct': is_correct,
            'verdict': verdict,
            'confidence': confidence,
            'explanation': explanation,
            'fallback_used': fallback_used,
        }

# Singleton instance
ai_service = AIService()
