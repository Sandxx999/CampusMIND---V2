import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app
from okf.graph_agent import OKFGraphAgent, AgentResponse

client = TestClient(app)

def test_portal_flow():
    print("--- Starting Portal E2E Integration Test ---")
    
    # 1. Student Profile
    print("1. Testing GET /api/portal/student/STU_2024_015/profile")
    res1 = client.get("/api/portal/student/STU_2024_015/profile")
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
    data1 = res1.json()
    assert data1["full_name"] == "Gadde Sandeep"
    assert data1["roll_number"] == "24AI015"
    assert abs(data1["overall_attendance_pct"] - 88.5) < 0.1
    print("   [OK] Student Profile")

    # 2. Mid Term Exam Marks
    print("2. Testing GET /api/portal/student/STU_2024_015/marks?exam_type=Mid Term 1")
    res2 = client.get("/api/portal/student/STU_2024_015/marks?exam_type=Mid Term 1")
    assert res2.status_code == 200, f"Expected 200, got {res2.status_code}"
    data2 = res2.json()
    assert len(data2) >= 4
    course_codes = [r["course_code"] for r in data2]
    assert "AI301" in course_codes
    assert "CS201" in course_codes
    print("   [OK] Mid Term Exam Marks")

    # 3. Student Timetable
    print("3. Testing GET /api/portal/student/STU_2024_015/timetable")
    res3 = client.get("/api/portal/student/STU_2024_015/timetable")
    assert res3.status_code == 200, f"Expected 200, got {res3.status_code}"
    data3 = res3.json()
    assert len(data3) > 0
    assert all(s["target_program"] == "B.Tech Artificial Intelligence" for s in data3 if "target_program" in s)
    print("   [OK] Student Timetable")

    # 4. Faculty Dashboard
    print("4. Testing GET /api/portal/faculty/FAC_CSE_101/dashboard")
    res4 = client.get("/api/portal/faculty/FAC_CSE_101/dashboard")
    assert res4.status_code == 200, f"Expected 200, got {res4.status_code}"
    data4 = res4.json()
    assert data4["profile"]["full_name"] == "Dr. Alan Turing"
    assert len(data4["schedule"]) > 0
    assert len(data4["resources"]) > 0
    print("   [OK] Faculty Dashboard")

    # 5. Notice Board
    print("5. Testing GET /api/portal/notices?audience=ALL")
    res5 = client.get("/api/portal/notices?audience=ALL")
    assert res5.status_code == 200, f"Expected 200, got {res5.status_code}"
    data5 = res5.json()
    assert len(data5) > 0
    print("   [OK] Notice Board")

    # 6. Password Change Workflow
    print("6. Testing POST /api/portal/auth/change-password")
    wrong_req = {
        "user_id": "STU_2024_015",
        "old_password": "wrong_password",
        "new_password": "new_password123"
    }
    res6_wrong = client.post("/api/portal/auth/change-password", json=wrong_req)
    assert res6_wrong.status_code == 400, f"Expected 400 for wrong password, got {res6_wrong.status_code}"
    
    passwords_to_try = ["password123", "password", "123456", "admin", "Student@123", "Faculty@123"]
    correct_old_pass = None
    for p in passwords_to_try:
        correct_req = {
            "user_id": "STU_2024_015",
            "old_password": p,
            "new_password": "new_password123"
        }
        res6_correct = client.post("/api/portal/auth/change-password", json=correct_req)
        if res6_correct.status_code == 200:
            correct_old_pass = p
            break
            
    assert correct_old_pass is not None, "Failed to guess the seed password"
    
    # Revert password
    revert_req = {
        "user_id": "STU_2024_015",
        "old_password": "new_password123",
        "new_password": correct_old_pass
    }
    res6_revert = client.post("/api/portal/auth/change-password", json=revert_req)
    assert res6_revert.status_code == 200
    print("   [OK] Password Change Workflow")

    # 7. OKF Graph Agent Reasoning Check
    print("7. Testing POST /api/v1/chat")
    chat_req = {"message": "Which faculty member teaches Deep Learning and Neural Networks (AI301)?"}
    
    from auth.jwt_handler import create_access_token
    token = create_access_token({"sub": "STU_2024_015", "role": "student"})
    headers = {"Authorization": f"Bearer {token}"}
    
    with patch.object(OKFGraphAgent, 'answer_query', side_effect=lambda q: AgentResponse(
             reasoning="Traversed TEACHES edge to AI301",
             answer="Dr. Alan Turing teaches AI301."
         ) if "AI301" in q else None):
        
        with patch.object(OKFGraphAgent, 'extract_anchors', return_value=["course:ai301"]):
            chat_res = client.post("/api/v1/chat", json=chat_req, headers=headers)
            assert chat_res.status_code == 200, f"Expected 200, got {chat_res.status_code}: {chat_res.text}"
            data7 = chat_res.json()
            assert data7["source"] == "okf_graph"
            assert "Alan Turing" in data7["answer"]
    
    print("   [OK] OKF Graph Agent Chat")
    
    print("\n[PASSED] End-to-End Portal Integration OK")

if __name__ == "__main__":
    test_portal_flow()
