import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_register():
    print("\n--- Testing Registration ---")
    url = f"{BASE_URL}/auth/register/"
    data = {
        "email": "testuser@example.com",
        "name": "Test User",
        "password": "testpassword123",
        "password_confirm": "testpassword123"
    }
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Text: {response.text}")
    return response

def test_login():
    print("\n--- Testing Login ---")
    url = f"{BASE_URL}/auth/login/"
    data = {
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        tokens = response.json()['tokens']
        print("Login successful, tokens received.")
        return tokens
    else:
        print("Login failed.")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response Text: {response.text}")
        return None

def test_logout(token):
    print("\n--- Testing Logout ---")
    url = f"{BASE_URL}/auth/logout/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    # Refresh token is usually needed for logout in simplejwt blacklist, 
    # but let's check what the view expects. 
    # The view views.py line 87: refresh_token = request.data.get('refresh_token')
    # So we need to pass the refresh token. 
    # Let's modify login to return both.
    print("Skipping logout test for now as we need refresh token from login.")
    return

def test_logout_with_refresh(token, refresh_token):
    print("\n--- Testing Logout ---")
    url = f"{BASE_URL}/auth/logout/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    data = {
        "refresh_token": refresh_token
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Logout successful.")
    else:
         print(f"Logout failed: {response.text}")

def test_submit_answer(token, question_id):
    print("\n--- Testing Submit Answer ---")
    url = f"{BASE_URL}/submit-answer/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    data = {
        "question_id": question_id,
        "submitted_answer": "Paris" 
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Text: {response.text}")

def create_dummy_question():
    # Helper to ensure a question exists. 
    # Since we don't have an endpoint to create questions exposed to public, 
    # we might need to rely on existing or use shell. 
    # For this script, I'll assume we might need to manually ensure DB has data or use Django shell.
    # But wait, looking at models, maybe I can just try ID 1.
    print("\n(Note: Ensure Question with ID 1 exists in DB for submit test to work)")
    return 1

def test_profile(token):
    print("\n--- Testing User Profile ---")
    url = f"{BASE_URL}/auth/profile/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Profile: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Failed to get profile: {response.text}")

if __name__ == "__main__":
    # 1. Register
    reg_response = test_register()
    
    # 2. Login
    tokens = test_login() # Modified to return dict or tuple?
    
    if tokens:
        access_token = tokens.get('access')
        refresh_token = tokens.get('refresh')
        
        # 3. Submit Answer
        qid = create_dummy_question()
        test_submit_answer(access_token, qid)

        # 4. Profile
        test_profile(access_token)

        # 5. Logout
        test_logout_with_refresh(access_token, refresh_token)


