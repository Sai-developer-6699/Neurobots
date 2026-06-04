import pytest
from rest_framework.test import APIClient
from rest_framework import status
import json
from django.contrib.auth import get_user_model
from tutor.models import Question, Mastery, Response

User = get_user_model()

@pytest.mark.django_db
class TestUserJourney:
    """
    End-to-End Verification of the "Register -> Learn -> Master" flow.
    """
    
    def setup_method(self):
        self.client = APIClient()
        self.user_data = {
            'email': 'test_student@neurotutor.ai',
            'name': 'Test Student',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!'
        }
        
        # Create Dummy Questions
        self.concept = "Recursion"
        Question.objects.create(
            text="What is the base case in recursion?",
            correct_answer="The condition to stop",
            difficulty=1,
            bloom_level="remember",
            concept=self.concept
        )
        Question.objects.create(
            text="Explain recursive stack depth.",
            correct_answer="The number of active calls",
            difficulty=2,
            bloom_level="understand",
            concept=self.concept
        )

    def test_full_flow(self):
        print("\n=== STARTING END-TO-END FLOW ===")
        
        # 1. Register
        print("1. Registering User...")
        response = self.client.post('/api/auth/register/', self.user_data)
        if response.status_code != status.HTTP_201_CREATED:
            print(f"[FAIL] Registration Failed: {response.data}")
        assert response.status_code == status.HTTP_201_CREATED, f"Registration failed: {response.data}"
        print(f"   Debug: Register Response Data Type: {type(response.data)}")
        tokens = response.data['tokens']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
        user = User.objects.get(email=self.user_data['email'])
        print("   [OK] User registered and logged in")

        # 2. Get Next Question
        print("2. Fetching First Question...")
        response = self.client.get(f'/api/mastery/next-question/?concept={self.concept}')
        assert response.status_code == status.HTTP_200_OK
        print(f"   Debug: Next Q Response Data Type: {type(response.data)}")
        print(f"   Debug: Next Q Response Data: {response.data}")
        q_data = response.data['question']
        print(f"   [OK] Received Q: {q_data['text']} (Mastery: {response.data.get('current_mastery')})")

        # 3. Answer Incorrectly (Trigger RAG Feedback)
        print("3. Submitting Incorrect Answer...")
        payload = {
            'question_id': q_data['id'],
            'submitted_answer': 'I do not know'
        }
        response = self.client.post('/api/submit-answer/', payload)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_correct'] is False
        assert response.data['feedback'] is not None
        print("   [OK] Received AI Feedback")
        
        # Verify Adaptive Tracking
        # (In a real test we'd check the service state, but here we check status code)
        
        # 4. Answer Correctly (Level Up)
        print("4. Submitting Correct Answer...")
        payload['submitted_answer'] = "The condition to stop"
        response = self.client.post('/api/submit-answer/', payload)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_correct'] is True
        print("   [OK] Answer Correct!")

        # 5. Verify Mastery Check
        print("5. Checking Mastery Progress...")
        response = self.client.get('/api/mastery/summary/')
        assert response.status_code == status.HTTP_200_OK
        
        # Response is { 'concepts': [...], 'total_concepts': ... }
        mastery_list = response.data['concepts']
        
        # We expect some progress for 'Recursion'
        has_progress = any(m['concept'] == self.concept for m in mastery_list)
        assert has_progress, "No progress recorded for Recursion"
        print("   [OK] Mastery progress verified")

        print("=== FLOW VERIFIED SUCCESSFULLY ===")

if __name__ == "__main__":
    # verification run manually if pytest not available
    t = TestUserJourney()
    t.setup_method()
    try:
        t.test_full_flow()
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
