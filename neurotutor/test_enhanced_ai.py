import requests
import json
import time
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def register_and_login():
    # Create unique user
    unique_id = str(uuid.uuid4())[:8]
    email = f"test_{unique_id}@example.com"
    password = "testpassword123"
    
    print(f"Registering user: {email}")
    register_url = f"{BASE_URL}/auth/register/"
    reg_data = {
        "email": email,
        "name": "Test User",
        "password": password,
        "password_confirm": password
    }
    requests.post(register_url, json=reg_data)
    
    # Login
    login_url = f"{BASE_URL}/auth/login/"
    login_data = {"email": email, "password": password}
    response = requests.post(login_url, json=login_data)
    
    if response.status_code == 200:
        return response.json()['tokens']['access']
    else:
        print(f"Login Failed: {response.text}")
        return None

def test_progressive_hints(token, question_id):
    print(f"\n--- Testing Progressive Hints (QID: {question_id}) ---")
    url = f"{BASE_URL}/question/hint/?question_id={question_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1st Hint (Attempt 0)
    print("Requesting Hint 1...")
    start = time.time()
    response = requests.get(url, headers=headers, timeout=30)
    print(f"Hint 1 (Attempt 0): {response.json().get('hint')[:50]}... (Time: {time.time()-start:.2f}s)")
    
    # Fail 1
    print("Submitting Wrong Answer 1...")
    submit_wrong_answer(token, question_id)
    
    # 2nd Hint (Attempt 1)
    print("Requesting Hint 2...")
    start = time.time()
    response = requests.get(url, headers=headers, timeout=30)
    print(f"Hint 2 (Attempt 1): {response.json().get('hint')[:50]}... (Time: {time.time()-start:.2f}s)")

def submit_wrong_answer(token, question_id):
    url = f"{BASE_URL}/submit-answer/"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "question_id": question_id,
        "submitted_answer": "Wrong Answer Placeholder"
    }
    try:
        start = time.time()
        requests.post(url, json=data, headers=headers, timeout=60)
        print(f"Submitted wrong answer. (Time: {time.time()-start:.2f}s)")
    except Exception as e:
        print(f"Submit error: {e}")

def test_explanation(token, question_id):
    print(f"\n--- Testing Explanation (QID: {question_id}) ---")
    url = f"{BASE_URL}/question/explanation/?question_id={question_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    # We already have 1 failure from hint test.
    # Fail 2
    print("Submitting Wrong Answer 2...")
    submit_wrong_answer(token, question_id)
    
    # Request Explanation
    print("Requesting Explanation...")
    start = time.time()
    response = requests.get(url, headers=headers, timeout=60)
    if response.status_code == 200:
        print(f"Explanation: {response.json().get('explanation')[:100]}... (Time: {time.time()-start:.2f}s)")
    else:
        print(f"Failed to get explanation: {response.text}")

if __name__ == "__main__":
    token = register_and_login()
    if token:
        # Assuming QID 1 exists
        try:
            test_progressive_hints(token, 1)
            test_explanation(token, 1)
        except Exception as e:
            print(f"Test failed with error: {e}")
