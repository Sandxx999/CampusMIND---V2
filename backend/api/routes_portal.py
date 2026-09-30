from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.session import get_db_session
from db.models import (
    UserAccount,
    StudentAcademicProfile,
    ExamResult,
    ScheduleSlot,
    SubjectResource,
    NoticeBoardItem,
    StudentSkill,
    StudentProject,
    StudentCertification,
    StudentExperience,
    StudentAchievement,
    StudentActivity,
    StudentCareerProfile,
    UpcomingTask
)
from pydantic import BaseModel
import bcrypt
from api.deps import require_role
from api.deps import get_current_user
import json

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

router = APIRouter(prefix="/api/portal", tags=["Portal"])

class ChangePasswordRequest(BaseModel):
    user_id: str
    old_password: str
    new_password: str

@router.get("/student/{student_id}/profile", dependencies=[Depends(require_role(["student"]))])
def get_student_profile(student_id: str):
    with get_db_session() as db:
        user = db.query(UserAccount).filter(UserAccount.id == student_id, UserAccount.role == "student").first()
        if not user:
            raise HTTPException(status_code=404, detail="Student not found")
            
        profile = db.query(StudentAcademicProfile).filter(StudentAcademicProfile.student_id == student_id).first()
        
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": user.department,
            "profile_photo_url": user.profile_photo_url,
            "roll_number": profile.roll_number if profile else None,
            "program": profile.program if profile else None,
            "batch_year": profile.batch_year if profile else None,
            "current_semester": profile.current_semester if profile else None,
            "overall_attendance_pct": profile.overall_attendance_pct if profile else None,
        }

@router.get("/student/{student_id}/marks", dependencies=[Depends(require_role(["student"]))])
def get_student_marks(student_id: str, exam_type: str = "Mid Term 1"):
    with get_db_session() as db:
        results = db.query(ExamResult).filter(
            ExamResult.student_id == student_id,
            ExamResult.exam_type == exam_type
        ).all()
        
        return [
            {
                "course_code": r.course_code,
                "course_name": r.course_name,
                "marks_obtained": r.marks_obtained,
                "max_marks": r.max_marks,
                "grade": r.grade,
                "status": r.status
            } for r in results
        ]

@router.get("/student/{student_id}/timetable", dependencies=[Depends(require_role(["student"]))])
def get_student_timetable(student_id: str):
    with get_db_session() as db:
        profile = db.query(StudentAcademicProfile).filter(StudentAcademicProfile.student_id == student_id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Student profile not found to determine program timetable")
            
        slots = db.query(ScheduleSlot).filter(ScheduleSlot.target_program == profile.program).all()
        
        return [
            {
                "day_of_week": s.day_of_week,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "course_code": s.course_code,
                "course_name": s.course_name,
                "venue": s.venue,
                "faculty_id": s.faculty_id
            } for s in slots
        ]

@router.get("/faculty/{faculty_id}/dashboard", dependencies=[Depends(require_role(["faculty"]))])
def get_faculty_dashboard(faculty_id: str):
    with get_db_session() as db:
        user = db.query(UserAccount).filter(UserAccount.id == faculty_id, UserAccount.role == "faculty").first()
        if not user:
            raise HTTPException(status_code=404, detail="Faculty not found")
            
        slots = db.query(ScheduleSlot).filter(ScheduleSlot.faculty_id == faculty_id).all()
        resources = db.query(SubjectResource).filter(SubjectResource.faculty_id == faculty_id).all()
        
        return {
            "faculty_info": {
                "id": "FAC_DEMO_01",
                "name": "Dr. Demo Faculty",
                "email": "faculty@college.edu",
                "department": "Computer Science and Engineering",
                "designation": "Assistant Professor",
                "office": "Block B — Room 204",
                "office_hours": "Mon–Wed 3:00 PM – 4:00 PM",
                "specializations": ["Artificial Intelligence", "Machine Learning"]
            },
            "teaching_overview": {
                "courses_count": 4,
                "sections_count": 6,
                "total_students": 182,
                "weekly_hours": 16,
                "avg_attendance_pct": 86.7,
                "pending_tasks_count": 12,
                "urgent_tasks_count": 4
            },
            "today_schedule": [
                {
                    "time": "09:00 AM - 10:15 AM",
                    "course": "Artificial Intelligence (AI301)",
                    "room": "Room C-204",
                    "section": "CSE-B",
                    "enrolled": 42,
                    "status": "ongoing"
                },
                {
                    "time": "11:00 AM - 12:15 PM",
                    "course": "Machine Learning (AI303)",
                    "room": "AI Lab 2",
                    "section": "CSE-A",
                    "enrolled": 38,
                    "status": "upcoming"
                },
                {
                    "time": "02:00 PM - 03:15 PM",
                    "course": "Data Structures & Algorithms (CS201)",
                    "room": "Room B-302",
                    "section": "CSE-C",
                    "enrolled": 45,
                    "status": "upcoming"
                }
            ],
            "attendance_analytics": [
                { "course": "Artificial Intelligence", "section": "CSE-A", "pct": 91, "status": "healthy" },
                { "course": "Machine Learning", "section": "CSE-B", "pct": 84, "status": "monitor" },
                { "course": "Data Structures", "section": "CSE-A", "pct": 89, "status": "healthy" },
                { "course": "Database Management Systems", "section": "CSE-C", "pct": 73, "status": "attention" }
            ],
            "class_performance": [
                { "course": "Artificial Intelligence", "avg_score": 82 },
                { "course": "Machine Learning", "avg_score": 76 },
                { "course": "Data Structures", "avg_score": 85 },
                { "course": "DBMS", "avg_score": 68 }
            ],
            "assessment_status": {
                "completed": ["AI301 Midterm I", "CS201 Midterm I"],
                "pending": [
                    { "task": "ML Midterm Papers", "count": 12 },
                    { "task": "DBMS Lab Records", "count": 8 },
                    { "task": "AI Assignment 3", "count": 28 }
                ]
            },
            "student_alerts": [
                { "type": "attendance", "severity": "warning", "message": "8 students below 75% attendance" },
                { "type": "performance", "severity": "danger", "message": "5 students scored below 40% in Midterm 1" },
                { "type": "absence", "severity": "danger", "message": "3 students missed 3 consecutive lectures" },
                { "type": "submission", "severity": "info", "message": "12 students pending Assignment 3 submission" }
            ],
            "pending_actions": [
                { "id": 1, "title": "Grade 28 AI Assignments", "due": "Today", "priority": "urgent" },
                { "id": 2, "title": "Enter ML Midterm marks (12 students)", "due": "Tomorrow", "priority": "urgent" },
                { "id": 3, "title": "Submit AI Attendance log", "due": "Today", "priority": "normal" },
                { "id": 4, "title": "Upload DBMS Unit 4 Slides", "due": "Oct 02", "priority": "due_soon" }
            ],
            "courses": [
                { "code": "AI301", "name": "Artificial Intelligence", "section": "CSE-A", "students": 42, "attendance": 91, "avg_marks": 82 },
                { "code": "AI303", "name": "Machine Learning", "section": "CSE-B", "students": 38, "attendance": 84, "avg_marks": 76 },
                { "code": "CS201", "name": "Data Structures", "section": "CSE-C", "students": 45, "attendance": 89, "avg_marks": 85 },
                { "code": "CS304", "name": "Database Management Systems", "section": "CSE-C", "students": 57, "attendance": 73, "avg_marks": 68 }
            ]
        }

@router.get("/notices", dependencies=[Depends(require_role(["student", "faculty"]))])
def get_notices(audience: str = "ALL"):
    with get_db_session() as db:
        query = db.query(NoticeBoardItem)
        if audience.upper() != "ALL":
            query = query.filter(NoticeBoardItem.target_audience.in_(["ALL", audience.upper()]))
            
        notices = query.order_by(NoticeBoardItem.posted_at.desc()).all()
        
        return [
            {
                "id": n.id,
                "title": n.title,
                "description": n.description,
                "target_audience": n.target_audience,
                "posted_by": n.posted_by,
                "posted_at": n.posted_at
            } for n in notices
        ]

@router.post("/auth/change-password", dependencies=[Depends(require_role(["student", "faculty"]))])
def change_password(req: ChangePasswordRequest):
    with get_db_session() as db:
        user = db.query(UserAccount).filter(UserAccount.id == req.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if not verify_password(req.old_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid old password")
            
        user.password_hash = hash_password(req.new_password)
        db.commit()
        
        return {"status": "SUCCESS", "message": "Password updated successfully"}


@router.get("/student/{student_id}/performance", dependencies=[Depends(require_role(["student"]))])
def get_student_performance(student_id: str):
    # Fixed static return for testing
    return {
        "cgpa": "3.82 / 4.0",
        "class_rank": "Top 5% (Rank 3 of 65)",
        "credits_completed": "48 / 160",
        "subject_radar": [
            {"subject": "Deep Learning", "score": 95, "class_avg": 78},
            {"subject": "Data Structures", "score": 87, "class_avg": 72},
            {"subject": "Discrete Math", "score": 80, "class_avg": 68},
            {"subject": "Knowledge Graphs", "score": 97, "class_avg": 74},
            {"subject": "Applied Stats", "score": 88, "class_avg": 70}
        ]
    }

from services.portal_chat_service import process_portal_chat, ChatRequest
from api.deps import get_current_user

@router.post("/chat")
def portal_chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    with get_db_session() as db:
        return process_portal_chat(req, current_user, db)


@router.get("/student/me/dashboard", dependencies=[Depends(require_role(["student"]))])
def get_student_dashboard(current_user: dict = Depends(get_current_user)):
    student_id = current_user["id"]
    with get_db_session() as db:
        user = db.query(UserAccount).filter(UserAccount.id == student_id).first()
        profile = db.query(StudentAcademicProfile).filter(StudentAcademicProfile.student_id == student_id).first()
        
        skills = db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()
        projects = db.query(StudentProject).filter(StudentProject.student_id == student_id).all()
        certifications = db.query(StudentCertification).filter(StudentCertification.student_id == student_id).all()
        experiences = db.query(StudentExperience).filter(StudentExperience.student_id == student_id).all()
        achievements = db.query(StudentAchievement).filter(StudentAchievement.student_id == student_id).all()
        activities = db.query(StudentActivity).filter(StudentActivity.student_id == student_id).all()
        career = db.query(StudentCareerProfile).filter(StudentCareerProfile.student_id == student_id).first()
        tasks = db.query(UpcomingTask).filter(UpcomingTask.student_id == student_id).all()

        return {
            "profile": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "department": user.department,
                "profile_photo_url": user.profile_photo_url,
                "roll_number": profile.roll_number if profile else None,
                "program": profile.program if profile else None,
                "batch_year": profile.batch_year if profile else None,
                "current_semester": profile.current_semester if profile else None,
                "overall_attendance_pct": profile.overall_attendance_pct if profile else None,
                "bio": profile.bio if profile else None,
                "location": profile.location if profile else None,
                "academic_status": profile.academic_status if profile else None,
                "links": json.loads(profile.links) if profile and profile.links else None
            },
            "academic_metrics": {
                "cgpa": "3.85 / 4.0",
                "class_rank": "Top 5% (Rank 3 of 68)",
                "credits_completed": "52 / 160",
                "subject_radar": [
                    {"subject": "Deep Learning", "score": 95, "class_avg": 78},
                    {"subject": "Data Structures", "score": 87, "class_avg": 72},
                    {"subject": "Discrete Math", "score": 80, "class_avg": 68},
                    {"subject": "Knowledge Graphs", "score": 97, "class_avg": 74},
                    {"subject": "Applied Stats", "score": 88, "class_avg": 70}
                ],
                "attendance": {
                    "overall": 88.5,
                    "present": 160,
                    "absent": 20,
                    "status": "Exam Eligible",
                    "course_breakdown": [
                        {"course": "AI301", "pct": 92},
                        {"course": "CS201", "pct": 91},
                        {"course": "AI303", "pct": 87},
                        {"course": "CS304", "pct": 78}
                    ]
                }
            },
            "skills": [
                {
                    "name": s.name,
                    "category": s.category,
                    "proficiency_pct": s.proficiency_pct,
                    "verified": s.verified
                } for s in skills
            ],
            "projects": [
                {
                    "title": p.title,
                    "category": p.category,
                    "description": p.description,
                    "role": p.role,
                    "technologies": json.loads(p.technologies) if p.technologies else [],
                    "status": p.status,
                    "github_url": p.github_url,
                    "live_demo_url": p.live_demo_url
                } for p in projects
            ],
            "certifications": [
                {
                    "name": c.name,
                    "issuer": c.issuer,
                    "issue_date": c.issue_date,
                    "credential_id": c.credential_id,
                    "credential_url": c.credential_url,
                    "skills": json.loads(c.skills) if c.skills else []
                } for c in certifications
            ],
            "experiences": [
                {
                    "organization": e.organization,
                    "role": e.role,
                    "experience_type": e.experience_type,
                    "start_date": e.start_date,
                    "end_date": e.end_date,
                    "responsibilities": e.responsibilities,
                    "technologies": json.loads(e.technologies) if e.technologies else []
                } for e in experiences
            ],
            "achievements": [
                {
                    "title": a.title,
                    "category": a.category,
                    "date": a.date,
                    "organization": a.organization
                } for a in achievements
            ],
            "activities": [
                {
                    "organization": a.organization,
                    "role": a.role,
                    "description": a.description
                } for a in activities
            ],
            "career_profile": {
                "target_role": career.target_role,
                "target_industry": career.target_industry,
                "career_interests": json.loads(career.career_interests) if career.career_interests else [],
                "career_readiness_pct": career.career_readiness_pct
            } if career else None,
            "upcoming_tasks": [
                {
                    "title": t.title,
                    "course": t.course,
                    "due_date": t.due_date,
                    "priority": t.priority
                } for t in tasks
            ]
        }
