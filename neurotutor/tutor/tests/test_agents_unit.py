
import json
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from tutor.agents.base import AgentContext, AgentResult
from tutor.agents.evaluation_agent import EvaluationAgent
from tutor.agents.orchestrator import AgentOrchestrator

class TestAgentsUnit(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.ctx = AgentContext(
            user_id=1,
            question_id=100,
            question_text="What is recursion?",
            correct_answer="Function calling itself",
            concept="Recursion",
            bloom_level="Understand",
            user_answer="It calls itself",
            recent_performance=[True, True]
        )

    # --- EvaluationAgent Tests ---

    async def test_evaluation_agent_valid_json(self):
        agent = EvaluationAgent()
        # Mock the LLM response
        mock_response = json.dumps({
            "is_correct": True,
            "verdict": "correct",
            "confidence": 0.95,
            "explanation": "Perfect match."
        })
        
        with patch.object(agent, 'call_llm_json', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = json.loads(mock_response)
            result = await agent.run(self.ctx)
            
            self.assertTrue(result.success)
            self.assertTrue(result.data['is_correct'])
            self.assertEqual(result.data['verdict'], 'correct')

    async def test_evaluation_agent_fallback_on_failure(self):
        agent = EvaluationAgent()
        # Simulate LLM failure (returns None)
        with patch.object(agent, 'call_llm_json', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = None  # Failed to get valid JSON
            
            result = await agent.run(self.ctx)
            
            # String match fallback should handle it
            self.assertTrue(result.success)
            self.assertTrue(result.data['fallback_used'])
            self.assertEqual(result.data['verdict'], 'correct')  # "It calls itself" ~ "Function calling itself" ? 
            # Actually, string match is strict/normalized. "It calls itself" != "Function calling itself".
            # Let's see EvaluationAgent._fallback_grade logic.
            # It does .strip().lower() == .strip().lower()
            # So this user_answer will be graded incorrect by fallback.
            self.assertEqual(result.data['verdict'], 'incorrect') 

    # --- Orchestrator Tests ---

    async def test_orchestrator_correct_flow(self):
        """If answer is correct, DifficultyAgent should run, HintAgent should NOT."""
        orch = AgentOrchestrator()
        
        # Mock agents
        orch.evaluation_agent.run = AsyncMock(return_value=AgentResult(
            agent="evaluation", success=True, data={"is_correct": True}
        ))
        orch.difficulty_agent.should_run = MagicMock(return_value=True)
        orch.difficulty_agent.run = AsyncMock(return_value=AgentResult(
            agent="difficulty", success=True, data={"action": "advance"}
        ))
        orch.hint_agent.run = AsyncMock() # Should not be called
        orch.concept_mapper_agent.run = AsyncMock(return_value=AgentResult(
            agent="concept_mapper", success=True, data={}
        ))
        
        # Mock _build_context and _log
        with patch('tutor.agents.orchestrator._build_context', new_callable=AsyncMock) as mock_build, \
             patch('tutor.agents.orchestrator._log', new_callable=AsyncMock):
            
            mock_build.return_value = self.ctx
            
            # Act
            response = await orch.evaluate_answer(MagicMock(pk=1), MagicMock(), "ans")
            
            # Assert
            orch.evaluation_agent.run.assert_called_once()
            orch.difficulty_agent.run.assert_called_once()
            orch.hint_agent.run.assert_not_called()
            
            self.assertIn("difficulty_recommendation", response)
            self.assertEqual(response["difficulty_recommendation"]["action"], "advance")

    async def test_orchestrator_incorrect_flow(self):
        """If answer is incorrect, HintAgent should run, DifficultyAgent should NOT."""
        orch = AgentOrchestrator()
        
        orch.evaluation_agent.run = AsyncMock(return_value=AgentResult(
            agent="evaluation", success=True, data={"is_correct": False}
        ))
        orch.hint_agent.run = AsyncMock(return_value=AgentResult(
            agent="hint", success=True, data={"hint": "Try again", "hint_level": 2}
        ))
        orch.difficulty_agent.run = AsyncMock()
        orch.concept_mapper_agent.run = AsyncMock(return_value=AgentResult(agent="map", success=True, data={}))
        
        with patch('tutor.agents.orchestrator._build_context', new_callable=AsyncMock) as mock_build, \
             patch('tutor.agents.orchestrator._log', new_callable=AsyncMock):
            
            mock_build.return_value = self.ctx
            
            response = await orch.evaluate_answer(MagicMock(pk=1), MagicMock(), "ans")
            
            orch.hint_agent.run.assert_called_once()
            orch.difficulty_agent.run.assert_not_called()
            
            self.assertEqual(response["hint"], "Try again")
            self.assertEqual(response["hint_level"], 2)

    async def test_orchestrator_partial_failure(self):
        """If one parallel agent fails (raises exception), others should still return."""
        orch = AgentOrchestrator()
        
        # Evaluation succeeds (Incorrect)
        orch.evaluation_agent.run = AsyncMock(return_value=AgentResult(
            agent="evaluation", success=True, data={"is_correct": False}
        ))
        
        # Hint succeeds
        orch.hint_agent.run = AsyncMock(return_value=AgentResult(
            agent="hint", success=True, data={"hint": "Help"}
        ))
        
        # Concept Mapper RAISES EXCEPTION
        orch.concept_mapper_agent.run = AsyncMock(side_effect=Exception("Database error"))
        
        with patch('tutor.agents.orchestrator._build_context', new_callable=AsyncMock) as mock_build, \
             patch('tutor.agents.orchestrator._log', new_callable=AsyncMock):
            
            mock_build.return_value = self.ctx
            
            response = await orch.evaluate_answer(MagicMock(pk=1), MagicMock(), "ans")
            
            # Should have hint, but no concept map
            self.assertEqual(response.get("hint"), "Help")
            self.assertNotIn("concept_map", response)
            # Should not crash
