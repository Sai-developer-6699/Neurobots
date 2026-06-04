# test_full_hint_flow.py - Improved version
import requests
import json
import time
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(method, url, **kwargs):
    """Helper with error handling"""
    try:
        if method == 'GET':
            res = requests.get(url, **kwargs)
        else:
            res = requests.post(url, **kwargs)
        
        print(f"    Status: {res.status_code}")
        
        if res.status_code >= 400:
            print(f"    Error Response: {res.text[:300]}")
            return None
        
        if 'application/json' in res.headers.get('content-type', ''):
            return res.json()
        else:
            print(f"    Non-JSON response: {res.text[:300]}")
            return None
            
    except Exception as e:
        print(f"    Request failed: {e}")
        return None

def register_and_login():
    unique_id = str(uuid.uuid4())[:8]
    email = f"student_{unique_id}@example.com"
    password = "password123"
    
    # Register
    requests.post(f"{BASE_URL}/auth/register/", json={
        "email": email, "name": "Curious Student", 
        "password": password, "password_confirm": password
    })
    
    # Login
    response = requests.post(f"{BASE_URL}/auth/login/", 
        json={"email": email, "password": password}
    )
    return response.json()['tokens']['access']

def run_full_flow():
    token = register_and_login()
    headers = {"Authorization": f"Bearer {token}"}
    question_id = 1
    
    # Hint 1
    print("\n[1] Requesting Hint 1...")
    data = make_request('GET', 
        f"{BASE_URL}/question/hint/?question_id={question_id}", 
        headers=headers
    )
    if data:
        print(f"    Hint: {data.get('hint')}")
    
    # Submit wrong answer 1
    print("\n[2] Submitting Wrong Answer 1...")
    data = make_request('POST', 
        f"{BASE_URL}/submit-answer/", 
        json={"question_id": question_id, "submitted_answer": "I don't know"},
        headers=headers
    )
    if data:
        print(f"    Feedback: {data.get('feedback')}")
    
    # Hint 2
    print("\n[3] Requesting Hint 2...")
    data = make_request('GET', 
        f"{BASE_URL}/question/hint/?question_id={question_id}", 
        headers=headers
    )
    if data:
        print(f"    Hint: {data.get('hint')}")
    
    # Submit wrong answer 2
    print("\n[4] Submitting Wrong Answer 2...")
    data = make_request('POST', 
        f"{BASE_URL}/submit-answer/", 
        json={"question_id": question_id, "submitted_answer": "Still unsure"},
        headers=headers
    )
    if data:
        print(f"    Feedback: {data.get('feedback')}")
    
    # Explanation
    print("\n[5] Requesting Explanation...")
    data = make_request('GET', 
        f"{BASE_URL}/question/explanation/?question_id={question_id}", 
        headers=headers
    )
    if data:
        print(f"    Explanation: {data.get('explanation')}")
        print(f"    Correct Answer: {data.get('correct_answer')}")
    else:
        print("    Failed to get explanation!")

if __name__ == "__main__":
    try:
        run_full_flow()
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()