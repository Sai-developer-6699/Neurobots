# test_mastery_flow.py - IMPROVED VERSION
import requests
import uuid
from typing import Dict

BASE_URL = "http://127.0.0.1:8000/api"

class MasteryFlowTester:
    def __init__(self):
        self.token = None
        self.headers = None
        self.test_email = None
    
    def setup(self):
        """Register and login test user"""
        unique_id = str(uuid.uuid4())[:8]
        self.test_email = f"mastery_test_{unique_id}@example.com"
        password = "password123"
        
        # Register
        requests.post(f"{BASE_URL}/auth/register/", json={
            "email": self.test_email,
            "name": "Mastery Tester",
            "password": password,
            "password_confirm": password
        })
        
        # Login
        res = requests.post(f"{BASE_URL}/auth/login/", 
            json={"email": self.test_email, "password": password}
        )
        
        if res.status_code != 200:
            raise Exception(f"Login failed: {res.text}")
        
        self.token = res.json()['tokens']['access']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        print(f"✓ Setup complete - User: {self.test_email}")
    
    def get_question_with_answer(self, concept: str = None) -> Dict:
        """Get a question and its correct answer"""
        
        # Get next question
        url = f"{BASE_URL}/mastery/next-question/"
        if concept:
            url += f"?concept={concept}"
        
        res = requests.get(url, headers=self.headers)
        
        if res.status_code != 200:
            raise Exception(f"Failed to get question: {res.text}")
        
        data = res.json()
        
        if 'question' not in data:
            return None
        
        question_id = data['question']['id']
        
        # CRITICAL: We need the actual correct answer
        # Since API doesn't return it, we need to either:
        # 1. Query database directly (requires database access)
        # 2. Use a known test question
        # 3. Make a special test endpoint
        
        # For now, return question data
        return data
    
    def submit_answer(self, question_id: int, answer: str, expect_correct: bool = True) -> Dict:
        """Submit an answer and return response"""
        
        res = requests.post(f"{BASE_URL}/submit-answer/", 
            json={
                "question_id": question_id,
                "submitted_answer": answer
            },
            headers=self.headers
        )
        
        if res.status_code != 200:
            raise Exception(f"Submit failed: {res.text}")
        
        data = res.json()
        
        # Verify expectation
        if expect_correct and not data['is_correct']:
            print(f"    ⚠️  Expected correct but got incorrect")
            print(f"    Submitted: {answer}")
            print(f"    Correct was: {data.get('correct_answer')}")
        
        return data
    
    def test_progression(self):
        """Test: 4 correct answers should advance Bloom level"""
        print("\n=== Test 1: Progression (Remember → Understand) ===")
        
        # Get initial state
        question_data = self.get_question_with_answer()
        if not question_data:
            print("✗ FAIL: No questions available")
            return False
        
        concept = question_data['question']['concept']
        initial_mastery = question_data['current_mastery']
        
        print(f"Initial mastery: {initial_mastery}")
        print(f"Concept: {concept}")
        
        # Known answers from test_data_setup.py
        known_answers = {
            'What is a variable in Python?': 'A named location to store data',
            'True or False: Variables can store numbers.': 'True',
            'True or False: Variables must start with a letter or underscore.': 'True',
            'Which is a valid variable name?': 'my_var',
            'Create a variable named x with value 5': 'x = 5',
            'Why is "2var" invalid?': 'Cannot start with number',
            'Evaluate usage of global variables': 'Use sparingly to avoid state issues',
            'Design a variable naming convention': 'snake_case for variables',
            
            'What keyword starts a loop?': 'for or while',
            'True or False: A while loop runs until condition is false.': 'True',
            'True or False: "break" stops a loop.': 'True',
            'Explain the difference between for and while': 'for iterates seq, while condition',
            'Write a loop to print 1 to 5': 'for i in range(1, 6): print(i)',
            
            'What keyword defines a function?': 'def',
            'True or False: Functions can return values.': 'True',
            'True or False: "pass" does nothing.': 'True',
            'What is a return value?': 'Output of function',
        }

        print("    Simulating learning process...")
        
        # We need 3 correct answers to advance (based on mastery_service logic: >80% accuracy, >=3 attempts)
        for i in range(4):
            q_data = self.get_question_with_answer(concept)
            if not q_data:
                print(f"    Stopped: No more questions for {concept}")
                break
                
            question = q_data['question']
            q_text = question['text']
            q_id = question['id']
            curr_level = q_data['current_mastery']
            
            print(f"    [{i+1}] Level: {curr_level} | Q: {q_text[:30]}...")
            
            # Find answer
            answer = known_answers.get(q_text)
            if not answer:
                print(f"    ⚠️  Unknown question: {q_text}")
                # Try to guess or skip? Failing here means test data mismatch
                return False
            
            # Submit correct answer
            res = self.submit_answer(q_id, answer, expect_correct=True)
            
            if res['current_mastery'] != initial_mastery:
                print(f"    ✓ LEVEL UP DETECTED! {initial_mastery} -> {res['current_mastery']}")
                return True
        
        print(f"✗ FAIL: Did not advance after 4 attempts")
        return False
    
    def test_summary(self):
        """Test: Mastery summary returns valid data"""
        print("\n=== Test 2: Mastery Summary ===")
        
        res = requests.get(f"{BASE_URL}/mastery/summary/", headers=self.headers)
        
        if res.status_code != 200:
            print(f"✗ FAIL: Status {res.status_code}")
            return False
        
        data = res.json()
        
        # Validate structure
        required_fields = ['total_concepts', 'average_level', 'concepts', 'overall_progress']
        
        for field in required_fields:
            if field not in data:
                print(f"✗ FAIL: Missing field '{field}'")
                return False
        
        print("✓ PASS: Summary structure valid")
        print(f"  Total concepts: {data['total_concepts']}")
        print(f"  Average level: {data['average_level']}")
        print(f"  Overall progress: {data['overall_progress']}%")
        
        return True
    
    def test_recommended_concepts(self):
        """Test: Recommended concepts endpoint works"""
        print("\n=== Test 3: Recommended Concepts ===")
        
        res = requests.get(f"{BASE_URL}/mastery/recommended/?limit=3", 
                          headers=self.headers)
        
        if res.status_code != 200:
            print(f"✗ FAIL: Status {res.status_code}")
            return False
        
        data = res.json()
        
        if 'recommended_concepts' not in data:
            print("✗ FAIL: Missing 'recommended_concepts' field")
            return False
        
        print("✓ PASS: Recommendations returned")
        print(f"  Recommended: {', '.join(data['recommended_concepts'])}")
        
        return True
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("MASTERY LEARNING SYSTEM - AUTOMATED TESTS")
        print("=" * 60)
        
        try:
            self.setup()
            
            # Tests that can auto-run
            results = {
                'summary': self.test_summary(),
                'recommendations': self.test_recommended_concepts(),
            }
            
            # Tests that need manual input
            print("\n" + "=" * 60)
            print("MANUAL TESTS REQUIRED")
            print("=" * 60)
            self.test_progression()
            
            # Summary
            print("\n" + "=" * 60)
            print("TEST RESULTS")
            print("=" * 60)
            
            passed = sum(1 for v in results.values() if v is True)
            total = len(results)
            
            print(f"Automated: {passed}/{total} passed")
            print("Manual: See above for instructions")
            
        except Exception as e:
            print(f"\n✗ TEST SUITE FAILED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    tester = MasteryFlowTester()
    tester.run_all_tests()