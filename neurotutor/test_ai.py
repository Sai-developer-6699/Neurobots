import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def login():
    url = f"{BASE_URL}/auth/login/"
    data = {"email": "testuser@example.com", "password": "testpassword123"}
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json()['tokens']['access']
        else:
            print(f"Login Failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login Error: {e}")
        return None

def test_hint(token, question_id):
    print(f"\n--- Testing Hint (QID: {question_id}) ---")
    url = f"{BASE_URL}/question/hint/?question_id={question_id}"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

def test_ai_feedback(token, question_id):
    print(f"\n--- Testing AI Feedback (QID: {question_id}) ---")
    url = f"{BASE_URL}/submit-answer/"
    headers = {"Authorization": f"Bearer {token}"}
    # Sending an incorrect answer to provoke feedback
    data = {
        "question_id": question_id,
        "submitted_answer": "I don't know, maybe blue?"
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Status: {response.status_code}")
    try:
        res_json = response.json()
        print(f"Is Correct: {res_json.get('is_correct')}")
        print(f"Feedback: {res_json.get('feedback')}")
    except:
        print(f"Response: {response.text}")

if __name__ == "__main__":
    token = login()
    if token:
        # Assuming QID 1 exists from seeding
        test_hint(token, 1)
        test_ai_feedback(token, 1)
