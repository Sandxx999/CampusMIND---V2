# 🎓 CampusMIND 2.0 — Enterprise Campus Intelligence Platform

CampusMIND 2.0 is an enterprise-grade, AI-powered Retrieval-Augmented Generation (RAG) assistant and portal designed specifically for higher education institutions. It provides role-scoped access control (RBAC), intelligent student analytics, an interactive knowledge graph, hybrid vector/lexical retrieval, and an ultra-modern glassmorphic user interface.

Whether tracking attendance, analyzing grades, visualizing institutional relationships, or querying the CampusMIND AI Copilot for exam schedules, CampusMIND delivers lightning-fast, verified insights.

---

## ✨ Key Features

- 🤖 **CampusMIND AI Copilot**: A highly-optimized AI assistant (powered by Google Gemini) capable of answering both institutional queries (using RAG against student handbooks and policy documents) and personal student queries (attendance, grades). Features sub-3-second latency and intelligent bypass of complex graph queries for personal lookups.
- 🌐 **Interactive Knowledge Graph Explorer**: A visual nodes-and-edges graph explorer built with CytoscapeJS to map relationships between courses, faculty, students, and departments.
- ✨ **Ultra-Modern UI/UX**: An immersive frontend featuring frosted glassmorphism aesthetics, Framer Motion 3D tilt effects, ambient mesh lighting, dynamic charting, and seamless micro-interactions.
- 🎓 **Role-Based Access Dashboards**: Dedicated workspaces for Students (tracking grades, radar charts of performance, attendance, upcoming tasks) and Faculty (managing tasks and student performance).
- 🔒 **Enterprise Security**: End-to-End JWT authentication, Role-Based Access Control (RBAC), Object Knowledge Foundation (OKF) protection, and prompt injection defense.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS, Glassmorphism, CSS Modules
- **Animations & Physics**: Framer Motion, Canvas Confetti
- **Data Visualization**: Recharts (Radar, Pie, Bar charts)
- **Graph Explorer**: React-CytoscapeJS
- **Icons**: Lucide-React

### **Backend**
- **API Framework**: FastAPI (Python)
- **AI & LLMs**: Google `genai` SDK (Gemini Flash Lite models)
- **Database & ORM**: SQLAlchemy 2.x, Alembic, SQLite/PostgreSQL
- **Vector Database**: ChromaDB
- **RAG Engine**: Hybrid campus retriever, document ingestors, and deterministic hybrid rerankers.

---

## 🏗️ Architecture Overview

CampusMIND 2.0 uses a **Modular Monolith** architecture:

- `frontend/`: The React + Vite SPA containing `components/` (ChatAssistant, Dashboards), `pages/` (Glassmorphic Login, App Hub), and API lib helpers.
- `backend/`: 
  - `main.py`: FastAPI entrypoint.
  - `api/` & `services/`: Endpoints and domain logic (ChatService, Analytics, Auth).
  - `rag/`: Advanced RAG Engine encapsulating document ingestion, ChromaDB vector store, semantic chunking, and deterministic hybrid reranking.
  - `scripts/`: Standalone utilities (e.g., `benchmark_chat_speed.py` to assert AI sub-5s latencies).
  - `db/` & `models/`: Relational schema and ORM definitions.

---

## 🚀 Quick Start Guide

### 1. Configure Environment
Create your `.env` file in the root and `backend` directories and ensure you have your Gemini API key ready:
```bash
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_api_key_here
```

### 2. Backend Setup
Run the FastAPI backend on `http://localhost:8000`:
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
*(Optional) Ingest knowledge documents into ChromaDB:*
```bash
cd backend
python -m rag.ingest
```

### 3. Frontend Setup
Run the Vite development server on `http://localhost:5173`:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demo Credentials

The Login portal features an ultra-modern 3D glassmorphic card with **1-Click Demo Quick-Fill** buttons. You can click `🎓 Student Demo` or `👨‍🏫 Faculty Demo` on the login screen to automatically inject these credentials:

| Role | Username | Password |
|---|---|---|
| **Student** | `STU_2024_015` | `password123` |
| **Faculty** | `FAC_DEMO_01` | `password123` |

*(Note: Data provided in the demo is synthesized for development purposes.)*

---

## 🧪 Testing & Benchmarks

Ensure your AI assistant meets the strict sub-5-second SLA constraint:
```bash
cd backend
python scripts/benchmark_chat_speed.py
```

Run the standard backend Python test suite:
```bash
python -m pytest tests
```

Build the frontend to verify zero compilation errors:
```bash
cd frontend
npm run build
```

---

## 📚 Documentation

For deeper dives into the implementation details, view the `docs/` folder:
- [System Architecture](docs/architecture.md)
- [Advanced RAG Architecture](docs/RAG_ARCHITECTURE.md)
- [Production Data & Identity Architecture](docs/DATABASE_ARCHITECTURE.md)
- [Local Development Guide](docs/DEVELOPMENT.md)
- [Database & Infrastructure Migration Strategy](docs/MIGRATION_STRATEGY.md)
