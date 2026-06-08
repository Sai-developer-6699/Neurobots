<div align="center">

# 🧠 NeuroTutor

### AI-Powered Adaptive Learning Platform

*Semantic answer evaluation · Bloom's Taxonomy mastery · SM-2 spaced repetition · Multi-agent LLM orchestration*

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Groq](https://img.shields.io/badge/LLM-Groq%20%7C%20Llama--3.3--70B-F55036?style=flat-square)](https://console.groq.com/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

</div>

---

## What is NeuroTutor?

NeuroTutor is a **production-ready, full-stack SaaS learning platform** that replaces rote flashcard drilling with an intelligent tutoring loop. Instead of checking whether your answer matches a string exactly, NeuroTutor uses a **Groq-hosted Llama 3.3 70B model** to evaluate the *meaning* of your answer, generates Socratic hints without giving away the answer, and continuously adapts question difficulty using a multi-agent pipeline.

It is architected for real-world scale: async Django views (ADRF), JWT authentication, PostgreSQL, DRF throttling, a ChromaDB vector store for RAG, and a React 19 frontend with Framer Motion animations.

> Built as a competition entry for the **AI Championship Cup** — demonstrating production SaaS engineering discipline, not just a demo.

---

## ✨ Key Features

| # | Feature | What it does |
|---|---------|-------------|
| 1 | **Semantic Answer Grading** | LLM returns a `verdict` (`correct` / `partial` / `incorrect`), a `confidence` score (0–1), and a natural-language explanation. Falls back to string-match if Groq is unavailable. |
| 2 | **Bloom's Taxonomy Mastery Engine** | Tracks 6 cognitive levels (Remember → Create) per concept. 80 %+ accuracy over 5 attempts promotes the user; <40 % regresses them. Questions are served at the user's Zone of Proximal Development. |
| 3 | **SM-2 Spaced Repetition** | Full SuperMemo-2 implementation: ease factor, interval, repetition count. Review queue surfaces cards exactly when memory decay predicts forgetting. |
| 4 | **Multi-Agent LLM Orchestrator** | A parallel `asyncio.gather` pipeline runs four specialised agents per answer submission — Evaluation, Hint, Difficulty Recommender, and Concept Mapper — cutting total latency by ~60 % versus sequential calls. |
| 5 | **Retrieval-Augmented Generation (RAG)** | A ChromaDB vector store indexed with `sentence-transformers` + BM25 hybrid search powers the explanation and hint agents with course-material context. |
| 6 | **Gamification Engine** | XP, levels (log-scale curve), day streaks, daily goal (configurable, default 5 Qs/day), +50 XP bonus on goal completion, global leaderboard. |
| 7 | **Activity Heatmap** | GitHub-style 52-week calendar showing daily learning cadence. |
| 8 | **Rate Limiting & Abuse Protection** | DRF throttle classes: `HintThrottle` (10/h), `ExplanationThrottle` (5/h), `SubmitThrottle` (120/h). Redis-backed in production for multi-worker consistency. |
| 9 | **JWT Auth** | `djangorestframework-simplejwt` — access + refresh tokens, token blacklist on logout. |
| 10 | **Concept Map API** | Returns prerequisite, successor, and related concepts for any topic — ready for a D3.js graph visualisation. |

---

## 🏗️ Architecture

```
AI_Championship_Cup/
│
├── neurotutor/                    ← Django REST API (backend)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── neurotutor/                ← Django project settings
│   │   └── settings.py / urls.py / asgi.py
│   └── tutor/                     ← Core Django app
│       ├── models.py              ← User, Question, Response, Mastery,
│       │                             SpacedRepetitionQueue, LearningEvent,
│       │                             UserProfile, SkippedQuestion,
│       │                             ManualReviewQueue, UserQuestionInteraction
│       ├── views.py               ← Async API views (ADRF + sync_to_async)
│       ├── urls.py                ← All 20+ API routes
│       ├── serializers.py
│       ├── ai_service.py          ← Groq LLM client (evaluate, hint, explain)
│       ├── prompts.py             ← All LLM prompt templates
│       ├── middleware.py
│       ├── agents/                ← Multi-agent orchestration
│       │   ├── orchestrator.py    ← asyncio.gather pipeline coordinator
│       │   ├── evaluation_agent.py
│       │   ├── hint_agent.py
│       │   ├── difficulty_agent.py
│       │   └── concept_mapper_agent.py
│       └── services/
│           ├── mastery_service.py          ← Bloom's progression logic
│           ├── spaced_repetition_service.py ← SM-2 algorithm
│           ├── gamification_service.py     ← XP, streaks, leaderboard
│           ├── adaptive_service.py         ← Failure tracking & concept recs
│           └── rag_service.py             ← ChromaDB + BM25 hybrid search
│
└── neurotutor-ui/                 ← React 19 + Vite frontend
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── pages/
        │   ├── Landing.jsx        ← Public marketing page
        │   ├── Login.jsx / Register.jsx
        │   ├── Dashboard.jsx      ← Quiz interface + live metrics sidebar
        │   ├── ReviewMode.jsx     ← Spaced-repetition review session
        │   └── dashboard/
        │       └── StudentHome.jsx
        ├── components/
        │   ├── QuizSidebar.jsx        ← Live XP / mastery / streak sidebar
        │   ├── MasteryChart.jsx       ← Bloom level bars per concept
        │   ├── ProgressHeatmap.jsx    ← 52-week activity calendar
        │   ├── GamificationPanel.jsx  ← XP bar, leaderboard
        │   ├── CelebrationDialog.jsx  ← Confetti on goal / level-up
        │   └── SessionModal.jsx       ← End-of-session stats
        ├── context/                   ← React context (Auth, Session)
        └── services/
            └── api.js             ← Axios wrapper for all API calls
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend framework** | Django 5 + Django REST Framework | Mature ORM, migrations, admin; DRF throttling & serialisers |
| **Async views** | ADRF (`adrf`) | First-class `async def` API views that stay in Django's request lifecycle |
| **LLM** | Groq API — `llama-3.3-70b-versatile` | Sub-second inference; generous free tier for demos |
| **Vector DB / RAG** | ChromaDB + `sentence-transformers` + BM25 | Hybrid semantic + keyword retrieval for course material |
| **Auth** | SimpleJWT | Stateless JWT with refresh rotation + token blacklist |
| **Database** | SQLite (dev) → PostgreSQL (prod) | `psycopg2-binary` driver; `DATABASE_URL`-driven config |
| **Frontend** | React 19, Vite 6, React Router 7 | Latest concurrent React; lightning-fast HMR |
| **Styling** | Tailwind CSS v4 + Framer Motion | Utility-first dark design system + GPU-accelerated animations |
| **UI primitives** | Radix UI | Accessible headless components (Dialog, Progress, Slider) |
| **HTTP client** | Axios | Interceptor-based JWT injection & refresh |
| **Testing** | pytest + pytest-django | 37-test suite covering DB storage, API flow, mastery logic |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `POST` | `/api/auth/register/` | ❌ | Create account → returns JWT pair |
| `POST` | `/api/auth/login/` | ❌ | Login → returns JWT pair |
| `POST` | `/api/auth/logout/` | ✅ | Blacklist refresh token |
| `GET`  | `/api/auth/me/` | ✅ | Current user profile |

### Quiz & Learning
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET`  | `/api/question/random/` | ✅ | Adaptive question (`?concept=` optional) — enriched with `prerequisite_hint` |
| `GET`  | `/api/question/<id>/` | ✅ | Fetch specific question by ID |
| `POST` | `/api/submit-answer/` | ✅ | Semantic grading + XP + mastery update + all agent outputs |
| `GET`  | `/api/question/hint/` | ✅ | Socratic hint — rate-limited 10/h (`?question_id=`) |
| `GET`  | `/api/question/explanation/` | ✅ | Full explanation — rate-limited 5/h (`?question_id=`) |
| `POST` | `/api/question/skip/` | ✅ | Mark question as skipped |

### Mastery
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET`  | `/api/mastery/summary/` | ✅ | All concepts + Bloom levels + accuracy (`?limit=&offset=`) |
| `GET`  | `/api/mastery/next-question/` | ✅ | Adaptive next question for concept |
| `GET`  | `/api/mastery/recommended/` | ✅ | Top N weakest concepts (`?limit=3`) |

### Spaced Repetition
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET`  | `/api/review/queue/` | ✅ | Questions due for SM-2 review (`?limit=20`) |
| `GET`  | `/api/review/stats/` | ✅ | Due today, total scheduled, overdue count |
| `POST` | `/api/review/rate/` | ✅ | Submit quality rating (0–5) after review |

### Gamification
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET`  | `/api/gamification/me/` | ✅ | XP, level, streak, daily goal progress |
| `GET`  | `/api/gamification/heatmap/` | ✅ | 365-day activity data for heatmap |
| `GET`  | `/api/gamification/leaderboard/` | ✅ | Top 5 users by XP |

### Concept Intelligence
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET`  | `/api/concept/map/` | ✅ | Prerequisite graph for a concept (`?concept=`) |
| `GET`  | `/api/concept/material/` | ❌ | Raw course material markdown for a concept |

### Health
| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| `GET`  | `/api/health/` | ❌ | Liveness probe (`?db=1` to include DB ping) |

---

## 📦 Example: `POST /api/submit-answer/` Response

```json
{
  "response_id": 42,
  "is_correct": true,
  "verdict": "correct",
  "confidence": 0.94,
  "verdict_message": "✅ Correct — Your answer accurately describes O(log n) search via pointer chasing.",
  "feedback": null,
  "concept": "binary_search_trees",
  "bloom_level": "apply",
  "correct_answer": null,
  "next_action": "continue",
  "needs_quality_rating": true,
  "current_mastery": "analyze",
  "mastery_progress": "4/6",
  "xp_gained": 10,
  "new_level": 3,
  "streak_days": 7,
  "daily_goal_progress": 5,
  "goal_completed": true,
  "difficulty_recommendation": {
    "action": "increase",
    "suggested_bloom_level": "evaluate",
    "show_badge": true
  },
  "concept_map": {
    "prerequisites": ["arrays", "recursion"],
    "successors": ["heaps", "tries"],
    "related": ["hash_tables", "graphs"]
  },
  "prerequisite_hint": "Make sure you're comfortable with recursion before tackling BST traversal.",
  "agent_latencies": {
    "evaluation": 0.41,
    "hint": 0.0,
    "difficulty": 0.38,
    "concept_map": 0.52
  }
}
```

---

## 🚀 Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+ / npm 9+
- A [Groq API key](https://console.groq.com/) (free tier works)

### 1 — Backend

```bash
cd neurotutor

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# Install Python dependencies
pip install -r requirements.txt

# Configure secrets
cp .env.example .env
# Open .env and set:
#   GROQ_API_KEY=gsk_...
#   SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">

# Apply database migrations
python manage.py migrate

# Seed course questions (recommended)
python manage.py seed_questions
# or: python ingest_content.py   (for RAG content ingestion)

# Run development server
python manage.py runserver
```

API available at **`http://127.0.0.1:8000`**

### 2 — Frontend

```bash
cd neurotutor-ui
npm install
npm run dev
```

UI available at **`http://localhost:5173`**

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ | — | Groq API key for LLM inference |
| `SECRET_KEY` | ✅ | — | Django secret key |
| `DEBUG` | ❌ | `True` | Set `False` in production |
| `DJANGO_ENV` | ❌ | `development` | Set `production` to enable prod settings |
| `ALLOWED_HOSTS` | ❌ | `localhost,127.0.0.1` | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | ❌ | `http://localhost:5173` | Frontend origin(s) |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | ❌ | SQLite fallback | PostgreSQL credentials |
| `REDIS_URL` | ❌ | — | Redis for shared DRF throttle state across workers |
| `LOG_FILE` | ❌ | console | Path for file-based logging |

See [`neurotutor/.env.example`](./neurotutor/.env.example) for the full template.

---

## 🔐 Production Deployment Checklist

- [ ] Set `DEBUG=False` and `DJANGO_ENV=production`
- [ ] Generate a strong `SECRET_KEY` and rotate it from `.env.example`
- [ ] Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to your domain
- [ ] Switch to PostgreSQL via `DB_*` variables
- [ ] Provision Redis and set `REDIS_URL` for distributed throttling
- [ ] Run `python manage.py collectstatic` and serve via Nginx / S3 + CloudFront
- [ ] Add `GET /api/health/?db=1` as a liveness probe in your container orchestrator
- [ ] Set up log rotation and point `LOG_FILE` to a persistent volume
- [ ] Enable HTTPS / TLS termination at the reverse proxy

See [`PRODUCTION_CHECKLIST.md`](./neurotutor/PRODUCTION_CHECKLIST.md) for the full hardening guide.

---

## 🧪 Tests

```bash
cd neurotutor

# Full test suite (37 tests — DB storage, API flow, mastery logic)
pytest

# Specific suites
python test_daily_goal.py           # Gamification & daily goal trigger
python test_db_storage.py           # DB model storage verification
python test_flow_register_to_mastery.py  # End-to-end auth → quiz → mastery
```

---

## 🗺️ Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 — Core Quiz | ✅ Done | Question model, submit answer, JWT auth |
| 2 — Semantic Grading | ✅ Done | Groq LLM evaluation with fallback |
| 3 — Mastery Engine | ✅ Done | Bloom's taxonomy progression |
| 4 — Hints & Explanations | ✅ Done | Socratic hints, full explanations |
| 5 — Spaced Repetition | ✅ Done | SM-2 review queue |
| 6 — Gamification | ✅ Done | XP, levels, streaks, leaderboard |
| 7 — RAG | ✅ Done | ChromaDB + BM25 hybrid retrieval |
| 8 — Multi-Agent Pipeline | ✅ Done | Parallel agent orchestrator |
| 9 — Concept Map | ✅ Done | Prerequisite / successor graph API |
| 10 — D3 Graph Visualisation | 🔜 Planned | Interactive concept dependency graph |
| 11 — Voice Input | 🔜 Planned | Browser speech-to-text for answers |
| 12 — Study Groups | 🔜 Planned | Multiplayer competitive quiz rooms |

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">

Built with ⚡ for the **AI Championship Cup**

*Django · React · Groq · ChromaDB · Framer Motion*

</div>
