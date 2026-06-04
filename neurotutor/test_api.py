#!/usr/bin/env python3
"""
Test script to debug the 500 error
"""
import requests
import json

# Base URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_login():
    """Test login and get token"""
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        print(f"Login Status: {response.status_code}")
        print(f"Login Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            return data.get('tokens', {}).get('access')
        else:
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_submit_answer(token):
    """Test submit answer endpoint"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    submit_data = {
        "question_id": 163,  # Use valid question ID
        "submitted_answer": "test answer"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/submit-answer/", json=submit_data, headers=headers)
        print(f"Submit Status: {response.status_code}")
        print(f"Submit Response: {response.text}")
        
        if response.status_code == 500:
            print("500 ERROR - Server error occurred")
            return False
        else:
            return True
    except Exception as e:
        print(f"Submit error: {e}")
        return False

def main():
    print("🔍 Testing API endpoints...")
    
    # Test login
    print("\n1. Testing login...")
    token = test_login()
    
    if not token:
        print("❌ Login failed")
        return
    
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Test submit answer
    print("\n2. Testing submit answer...")
    success = test_submit_answer(token)
    
    if success:
        print("✅ Submit answer successful")
    else:
        print("❌ Submit answer failed")

if __name__ == "__main__":
    main()
