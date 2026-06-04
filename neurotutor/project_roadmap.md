# NeuroTutor Project Roadmap

## Phase 1: Foundation ✅ COMPLETE
**Goal:** Basic auth and CRUD working
- [x] Django models (User, Question, Response, Mastery, SpacedRepetitionQueue, LearningEvent, UserProfile)
- [x] JWT authentication (login, register, logout, token refresh)
- [x] RESTful API endpoints
- [x] Seed database with 50+ questions across Bloom levels
- [x] React auth flow (login/register with back-to-home navigation)
- [x] Question display and answer submission UI

## Phase 2: LLM Integration ✅ COMPLETE
**Goal:** AI-powered feedback
- [x] Groq API integration (`llama-3.3-70b-versatile`)
- [x] Semantic answer evaluation (verdict: correct/partial/incorrect + confidence score)
- [x] Socratic hint generation (up to 3 progressive hints)
- [x] Explanation generation service
- [x] Feedback UI with verdict message + confidence bar
- [x] All AI interactions logged as LearningEvents

## Phase 3: RAG System ⏸️ DEFERRED
**Goal:** Context-aware assistance
- [ ] ChromaDB vector database setup
- [ ] Embeddings for course content
- [ ] Hybrid search (vector + BM25)
- [ ] RAG-enhanced LLM prompts
- [ ] Admin content upload UI
> *Note: Deferred in favour of completing gamification and UI polish. Groq LLM provides sufficient quality without RAG for current question set.*

## Phase 4: Adaptive Learning ✅ COMPLETE
**Goal:** Personalized progression
- [x] Mastery tracking algorithm (Bloom's 6-level taxonomy)
- [x] ZPD-based question selection (questions matched to current mastery)
- [x] Difficulty assessment per concept
- [x] Mastery visualization dashboard (concept bars + heatmap)
- [x] Concept filter (click concept → quiz filters to that concept)

## Phase 5: Spaced Repetition ✅ COMPLETE
**Goal:** Long-term retention
- [x] SM-2 algorithm implementation
- [x] Review queue system (due_today count)
- [x] Review session UI (`/review` route)
- [x] Review badge in navbar (pulsing when reviews due)
- [x] Retention score metric (based on review load)

## Phase 6: Gamification ✅ COMPLETE
**Goal:** Engagement and motivation
- [x] XP system (10 XP per correct answer)
- [x] Level progression (formula: `floor(0.1 * sqrt(XP)) + 1`)
- [x] Day streak tracking (resets if day missed)
- [x] Daily goal (5 questions/day, +50 bonus XP on completion)
- [x] Leaderboard (top 5 by XP)
- [x] Activity heatmap (52-week GitHub-style calendar)
- [x] Celebration dialog (confetti on goal/streak/level-up)
- [x] Live metrics sidebar (updates after every answer)

## Phase 7: UI/UX Polish ✅ COMPLETE
**Goal:** Premium, production-quality interface
- [x] Dark neuro-futuristic design system (glassmorphism, cyan glow)
- [x] Landing page (hero, stats bar, features grid, CTA)
- [x] Post-login home dashboard (StudentHome) with XP bar, daily goal bar, concept grid
- [x] Quiz dashboard with two-column layout (quiz + live sidebar)
- [x] Session modal (streak, XP, daily goal, review queue)
- [x] Animated transitions (Framer Motion throughout)
- [x] Mobile-responsive layouts

## Phase 8: Multi-Agent System ✅ COMPLETE
**Goal:** Specialized AI agents
- [x] Agent orchestration architecture
- [x] Dedicated hint generator agent
- [x] Explanation agent with RAG context
- [x] Difficulty assessor agent
- [x] Concept mapper agent

## Phase 9: Production Deployment 🔲 PLANNED
**Goal:** Live, scalable deployment
- [ ] PostgreSQL migration
- [ ] Environment variable hardening
- [ ] Rate limiting on LLM endpoints
- [ ] Railway deployment (backend)
- [ ] Vercel deployment (frontend)
- [ ] Custom domain + SSL
- [ ] Error monitoring (Sentry)
- [ ] CI/CD pipeline

---

## Known Issues / Tech Debt

| Issue | Priority | Notes |
|---|---|---|
| No `.env.example` file | Medium | Developers must manually configure GROQ_API_KEY |
| SQLite in dev | Low | Fine for prototype; PostgreSQL needed for production |
| No rate limiting on LLM calls | High | A user could spam hints/explanations and exhaust API quota |
| `user.username` references in old code | Fixed | Was causing AttributeError — now uses `user.email` |
| No question admin UI | Medium | Questions must be seeded via script |
| No test coverage for views | Medium | Only service-level tests exist |
| RAG system deferred | Low | Current LLM quality is sufficient for competition |
| `get_random_question` is sync | Medium | Should be async to avoid `async_to_sync` wrapper overhead |
