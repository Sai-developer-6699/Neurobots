"""
Quick smoke test of the two pure-logic Phase 8 agents (no LLM calls needed).
"""
import sys, os
sys.path.insert(0, '.')
os.environ['DJANGO_SETTINGS_MODULE'] = 'neurotutor.settings'

import django
django.setup()

from tutor.agents.base import AgentContext, AgentResult, BaseAgent
from tutor.agents.evaluation_agent import EvaluationAgent
from tutor.agents.hint_agent import HintAgent
from tutor.agents.explanation_agent import ExplanationAgent
from tutor.agents.difficulty_agent import DifficultyAgent, BLOOM_ORDER
from tutor.agents.concept_mapper import ConceptMapperAgent
from tutor.agents.orchestrator import orchestrator

import asyncio

# ── DifficultyAgent smoke test ────────────────────────────────────────────────
ctx = AgentContext(
    user_id=1, question_id=1,
    question_text='What is recursion?',
    correct_answer='A function calling itself',
    concept='recursion', bloom_level='understand',
    user_answer='wrong',
    recent_performance=[False, False, False, False, False]
)
d_agent = DifficultyAgent()
print(f"DifficultyAgent.should_run: {d_agent.should_run(ctx)}")
result = asyncio.run(d_agent.run(ctx))
action = result.data['action']
latency = result.latency_ms
print(f"DifficultyAgent action={action} latency={latency}ms")
assert result.success, "DifficultyAgent failed"
assert action in ('remediate', 'stay'), f"unexpected action: {action}"
print("  -> PASS (struggling student gets remediate or stay)")

# ── ConceptMapperAgent smoke test ─────────────────────────────────────────────
c_agent = ConceptMapperAgent()
ctx2 = AgentContext(
    user_id=1, question_id=1,
    question_text='_', correct_answer='_',
    concept='recursion', bloom_level='remember'
)
result2 = asyncio.run(c_agent.run(ctx2))
prereqs = result2.data['prerequisites']
hint = result2.data['prerequisite_hint']
print(f"ConceptMapper prereqs: {prereqs}")
print(f"ConceptMapper hint: {hint[:50]}...")
assert result2.success, "ConceptMapperAgent failed"
assert 'functions' in prereqs, f"Expected 'functions' in prereqs, got {prereqs}"
print("  -> PASS")

# ── High performer test ───────────────────────────────────────────────────────
ctx3 = AgentContext(
    user_id=1, question_id=1,
    question_text='_', correct_answer='_',
    concept='recursion', bloom_level='understand',
    user_answer='_',
    recent_performance=[True, True, True, True, True]
)
result3 = asyncio.run(d_agent.run(ctx3))
print(f"Expert student: action={result3.data['action']} show_badge={result3.data['show_badge']}")
assert result3.data['action'] == 'advance', "Expert should advance"
assert result3.data['show_badge'] == True
print("  -> PASS (expert student gets advance badge)")

print("\n All Phase 8 agent smoke tests PASSED.")
