import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from tutor.models import Question, LearningEvent
from tutor.services.adaptive_service import adaptive_service

User = get_user_model()

@pytest.mark.django_db
class TestAdaptiveTrigger:
    def setup_method(self):
        self.client = APIClient()
        self.user_data = {
            'email': 'struggling_student@neurotutor.ai',
            'name': 'Struggling Student',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!'
        }
        
        #Create Question
        self.concept = "Recursion"
        self.question = Question.objects.create(
            text="What is a base case?",
            concept=self.concept,
            difficulty=1,
            bloom_level="remember",
            correct_answer="Stop condition"
        )

    def test_adaptive_trigger_flow(self):
        print("\n=== TESTING ADAPTIVE TRIGGER FLOW ===")
        
        # 1. Register
        response = self.client.post('/api/auth/register/', self.user_data)
        assert response.status_code == status.HTTP_201_CREATED
        tokens = response.data['tokens']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        user = User.objects.get(email=self.user_data['email'])
        print("   [OK] User registered")

        # 2. Fail 3 Times
        for i in range(1, 4):
            print(f"   [...] Submitting incorrect answer {i}/3...")
            payload = {
                'question_id': self.question.id,
                'submitted_answer': 'I do not know'
            }
            response = self.client.post('/api/submit-answer/', payload)
            assert response.status_code == status.HTTP_200_OK
            assert response.data['is_correct'] is False
        
        print("   [OK] Submitted 3 failures")

        # 3. Verify Adaptive Event Logged
        # The view calls adaptive_service.track_failure -> checks gap -> might trigger content
        # We need to see if 'adaptive_content_generated' event exists in DB
        
        # Note: Content generation is async and might be mocked or take time.
        # But LearningEvent should be created if triggered.
        
        events = LearningEvent.objects.filter(
            user=user, 
            event_type='adaptive_content_generated'
        )
        
        # In a real heavy test we'd wait, but here let's see if the logic at least TRIED
        # Alternatively, check 'concept_gap_detected' which happens before generation
        
        gap_events = LearningEvent.objects.filter(
            user=user,
            event_type='concept_gap_detected'
        )
        
        if gap_events.exists():
            print(f"   [OK] Gap Detected Event found: {gap_events.first().payload}")
        else:
            print("   [FAIL] No 'concept_gap_detected' event found!")
            
        # Check if we can find the generated content (if synchronous or mocked)
        # For now, finding the gap event is enough to prove the "Trigger" worked.
        
        assert gap_events.exists(), "Adaptive trigger did not fire after 3 failures"
        
        print("=== ADAPTIVE TRIGGER VERIFIED ===")
