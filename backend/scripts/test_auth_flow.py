import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_auth_flow():
    print("--- Starting Auth Flow Test ---")
    
    # a. Login with student credentials succeeds and returns JWT
    print("a. Testing Student Login")
    login_req = {
        "username": "STU_2024_015",
        "password": "password123"
    }
    # Test form data login for token since OAuth2PasswordBearer uses form data
    res_token = client.post("/api/auth/token", data=login_req)
    assert res_token.status_code == 200, f"Expected 200, got {res_token.status_code}: {res_token.text}"
    token_data = res_token.json()
    assert "access_token" in token_data
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    print("   [OK] Student Login successful")
    
    # b. Student accessing /api/portal/faculty/... receives HTTP 403 Forbidden
    print("b. Testing Student accessing Faculty route")
    res_forbidden = client.get("/api/portal/faculty/FAC_CSE_101/dashboard", headers=headers)
    assert res_forbidden.status_code == 403, f"Expected 403, got {res_forbidden.status_code}"
    print("   [OK] 403 Forbidden on mismatched role")
    
    # c. Accessing protected endpoints without Bearer token returns HTTP 401 Unauthorized
    print("c. Testing unauthorized access")
    res_unauth = client.get("/api/portal/student/STU_2024_015/profile")
    assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"
    print("   [OK] 401 Unauthorized on missing token")
    
    # d. /api/auth/me decodes the token correctly
    print("d. Testing /api/auth/me")
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200, f"Expected 200, got {res_me.status_code}"
    me_data = res_me.json()
    assert me_data["sub"] == "STU_2024_015"
    assert me_data["role"] == "student"
    print("   [OK] JWT Decoded successfully")
    
    print("\n[PASSED] Auth Flow Integration OK")

if __name__ == "__main__":
    test_auth_flow()
