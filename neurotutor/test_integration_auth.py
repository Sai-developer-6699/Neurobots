import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_auth_flow():
    # 1. Register
    email = "integration_test_user@example.com"
    password = "testpassword123"
    name = "Integration Tester"
    
    print(f"Testing Auth Flow against {BASE_URL}...")

    # Register
    reg_payload = {
        "email": email,
        "password": password,
        "password_confirm": password,
        "name": name
    }
    
    # Try registration
    try:
        resp = requests.post(f"{BASE_URL}/auth/register/", json=reg_payload)
        if resp.status_code == 201:
            print("Registration: SUCCESS")
        elif resp.status_code == 400 and "already exists" in resp.text:
             print("Registration: User already exists (Skipping)")
        else:
            print(f"Registration: FAILED ({resp.status_code}) - {resp.text}")
            return False
    except Exception as e:
        print(f"Registration: EXCEPTION - {e}")
        return False

    # 2. Login
    login_payload = {
        "email": email,
        "password": password
    }
    
    token = None
    try:
        resp = requests.post(f"{BASE_URL}/auth/login/", json=login_payload)
        if resp.status_code == 200:
            print("Login: SUCCESS")
            token = resp.json().get("tokens", {}).get("access")
        else:
            print(f"Login: FAILED ({resp.status_code}) - {resp.text}")
            return False
    except Exception as e:
        print(f"Login: EXCEPTION - {e}")
        return False
        
    # 3. Access Protected Route
    if not token:
        print("Login: No token received.")
        return False
        
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
        if resp.status_code == 200:
             print("Profile Access: SUCCESS")
             print(f"User Profile: {resp.json()}")
             return True
        else:
             print(f"Profile Access: FAILED ({resp.status_code}) - {resp.text}")
             return False
    except Exception as e:
        print(f"Profile Access: EXCEPTION - {e}")
        return False

if __name__ == "__main__":
    success = test_auth_flow()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
