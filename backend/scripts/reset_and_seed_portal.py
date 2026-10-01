import os
import json
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base, UserAccount, StudentAcademicProfile, ExamResult, ScheduleSlot, SubjectResource, NoticeBoardItem, StudentSkill, StudentProject, StudentCertification, StudentExperience, StudentAchievement, StudentActivity, StudentCareerProfile, UpcomingTask
from okf.graph_store import GraphStore

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def reset_and_seed():
    print("Connecting to Neon PostgreSQL...")
    
    session = SessionLocal()
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        if inspector.has_table("portal_user_accounts"):
            if session.query(UserAccount).first():
                print("Database already seeded. Skipping seed.")
                return
    except Exception as e:
        print(f"Error checking if seeded: {e}")
    finally:
        session.close()

    # Drop all portal tables (since they are new, this acts as a reset)
    # Be careful not to drop the whole Base because we might drop auth tables.
    # We will just drop and recreate our specific portal tables.
    print("Dropping existing portal tables...")
    NoticeBoardItem.__table__.drop(engine, checkfirst=True)
    SubjectResource.__table__.drop(engine, checkfirst=True)
    ScheduleSlot.__table__.drop(engine, checkfirst=True)
    ExamResult.__table__.drop(engine, checkfirst=True)
    StudentSkill.__table__.drop(engine, checkfirst=True)
    StudentProject.__table__.drop(engine, checkfirst=True)
    StudentCertification.__table__.drop(engine, checkfirst=True)
    StudentExperience.__table__.drop(engine, checkfirst=True)
    StudentAchievement.__table__.drop(engine, checkfirst=True)
    StudentActivity.__table__.drop(engine, checkfirst=True)
    StudentCareerProfile.__table__.drop(engine, checkfirst=True)
    UpcomingTask.__table__.drop(engine, checkfirst=True)
    StudentAcademicProfile.__table__.drop(engine, checkfirst=True)
    UserAccount.__table__.drop(engine, checkfirst=True)
    
    print("Creating portal tables...")
    UserAccount.__table__.create(engine, checkfirst=True)
    StudentAcademicProfile.__table__.create(engine, checkfirst=True)
    ExamResult.__table__.create(engine, checkfirst=True)
    ScheduleSlot.__table__.create(engine, checkfirst=True)
    SubjectResource.__table__.create(engine, checkfirst=True)
    NoticeBoardItem.__table__.create(engine, checkfirst=True)
    StudentSkill.__table__.create(engine, checkfirst=True)
    StudentProject.__table__.create(engine, checkfirst=True)
    StudentCertification.__table__.create(engine, checkfirst=True)
    StudentExperience.__table__.create(engine, checkfirst=True)
    StudentAchievement.__table__.create(engine, checkfirst=True)
    StudentActivity.__table__.create(engine, checkfirst=True)
    StudentCareerProfile.__table__.create(engine, checkfirst=True)
    UpcomingTask.__table__.create(engine, checkfirst=True)
    
    seed_file = os.path.join(os.path.dirname(__file__), "../data/seed_data.json")
    with open(seed_file, "r") as f:
        data = json.load(f)
        
    session = SessionLocal()
    total_inserted = 0
    
    try:
        # Users
        for u in data.get("users", []):
            session.add(UserAccount(**u))
            total_inserted += 1
        session.flush()
            
        # Student Profiles
        for p in data.get("student_profiles", []):
            session.add(StudentAcademicProfile(**p))
            total_inserted += 1
        session.flush()
            
        # Exam Results
        for e in data.get("exam_results", []):
            session.add(ExamResult(**e))
            total_inserted += 1
        session.flush()
            
        # Schedule Slots
        for s in data.get("schedule_slots", []):
            session.add(ScheduleSlot(**s))
            total_inserted += 1
        session.flush()
            
        # Subject Resources
        for r in data.get("subject_resources", []):
            session.add(SubjectResource(**r))
            total_inserted += 1
        session.flush()
            
        # Notice Board
        for n in data.get("notice_board", []):
            session.add(NoticeBoardItem(**n))
            total_inserted += 1
        session.flush()

        for s in data.get("skills", []):
            session.add(StudentSkill(**s))
            total_inserted += 1
        session.flush()

        for p in data.get("projects", []):
            session.add(StudentProject(**p))
            total_inserted += 1
        session.flush()

        for c in data.get("certifications", []):
            session.add(StudentCertification(**c))
            total_inserted += 1
        session.flush()

        for e in data.get("experiences", []):
            session.add(StudentExperience(**e))
            total_inserted += 1
        session.flush()

        for a in data.get("achievements", []):
            session.add(StudentAchievement(**a))
            total_inserted += 1
        session.flush()

        for a in data.get("activities", []):
            session.add(StudentActivity(**a))
            total_inserted += 1
        session.flush()

        for c in data.get("career_profiles", []):
            session.add(StudentCareerProfile(**c))
            total_inserted += 1
        session.flush()

        for t in data.get("upcoming_tasks", []):
            session.add(UpcomingTask(**t))
            total_inserted += 1
            
        session.commit()
        print(f"Successfully seeded {total_inserted} relational records.")
        
    except Exception as e:
        session.rollback()
        print(f"Failed to seed data: {e}")
        return
    finally:
        session.close()
        
    # Now Sync with OKF Graph
    print("Syncing with OKF Graph Store...")
    graph = GraphStore()
    
    nodes = []
    edges = []
    
    nodes.append({
        "node_id": "course:ai301",
        "label": "AI301",
        "entity_type": "COURSE",
        "properties": {"name": "Deep Learning"}
    })
    nodes.append({
        "node_id": "course:cs201",
        "label": "CS201",
        "entity_type": "COURSE",
        "properties": {"name": "Data Structures"}
    })
    nodes.append({
        "node_id": "course:math202",
        "label": "MATH202",
        "entity_type": "COURSE",
        "properties": {"name": "Discrete Math"}
    })
    nodes.append({
        "node_id": "course:ai302",
        "label": "AI302",
        "entity_type": "COURSE",
        "properties": {"name": "Knowledge Representation"}
    })
    nodes.append({
        "node_id": "course:ai303",
        "label": "AI303",
        "entity_type": "COURSE",
        "properties": {"name": "Applied Statistics & Machine Learning"}
    })
    
    nodes.append({
        "node_id": "faculty:fac_cse_101",
        "label": "Dr. Alan Turing",
        "entity_type": "FACULTY",
        "properties": {"department": "Artificial Intelligence & CSE"}
    })
    nodes.append({
        "node_id": "faculty:fac_stats_101",
        "label": "Dr. Leslie Alexander",
        "entity_type": "FACULTY",
        "properties": {"department": "Statistics"}
    })
    
    nodes.append({
        "node_id": "student:stu_2024_015",
        "label": "Gadde Sandeep",
        "entity_type": "STUDENT",
        "properties": {"program": "B.Tech Artificial Intelligence"}
    })
    
    edges.append({
        "source_id": "faculty:fac_cse_101",
        "relation": "TEACHES",
        "target_id": "course:ai301",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    edges.append({
        "source_id": "faculty:fac_cse_101",
        "relation": "TEACHES",
        "target_id": "course:cs201",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    edges.append({
        "source_id": "faculty:fac_stats_101",
        "relation": "TEACHES",
        "target_id": "course:ai303",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    
    edges.append({
        "source_id": "student:stu_2024_015",
        "relation": "ENROLLED_IN",
        "target_id": "course:ai301",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    edges.append({
        "source_id": "student:stu_2024_015",
        "relation": "ENROLLED_IN",
        "target_id": "course:cs201",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    edges.append({
        "source_id": "student:stu_2024_015",
        "relation": "ENROLLED_IN",
        "target_id": "course:math202",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    edges.append({
        "source_id": "student:stu_2024_015",
        "relation": "ENROLLED_IN",
        "target_id": "course:ai303",
        "metadata": {"confidence": 1.0, "source_doc_id": "seed"}
    })
    
    for n in nodes:
        graph.upsert_node(id=n["node_id"], label=n["entity_type"], name=n["label"], properties=n["properties"])
        
    for e in edges:
        graph.upsert_edge(source_id=e["source_id"], relation=e["relation"], target_id=e["target_id"], properties=e["metadata"])
    print(f"Successfully synced {len(nodes)} nodes and {len(edges)} edges to OKF.")
    
if __name__ == "__main__":
    reset_and_seed()
