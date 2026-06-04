# Critics Verification Report

This document verifies the implementation of the four groups of fixes and notes any additional issues.

---

## Group 1 — Critical Fixes (Demo-Blockers)

### Backend

| Item | Status | Notes |
|------|--------|--------|
| **views.py: HintThrottle (10/h), ExplanationThrottle (5/h), SubmitThrottle (120/h)** | ✅ Done | Classes defined; `_check_throttle()` used in get_hint, get_explanation. **SubmitThrottle was missing on submit_answer — FIXED.** |
| **Apply throttles to get_hint, get_explanation, submit_answer** | ✅ Done | All three now use their throttle classes. |
| **get_explanation: server-side attempt count** | ✅ Done | Queries `QuizResponse` for `user`, `question`, `is_correct=False`; returns 403 if `attempt_count < 2`. |
| **get_leaderboard: user.name instead of user.username** | ✅ Done | Uses `getattr(profile.user, 'name', None) or profile.user.email.split('@')[0]` and returns as `username` for API compatibility. |
| **.env.example** | ✅ Done | Documents GROQ_API_KEY, SECRET_KEY, DEBUG, ALLOWED_HOSTS, DATABASE_URL, CORS_ALLOWED_ORIGINS. |

### Frontend

| Item | Status | Notes |
|------|--------|--------|
| **Dashboard: getAdaptiveQuestion + fallback to random** | ✅ Done | **Was using getRandomQuestion only.** Now calls `getAdaptiveQuestion(conceptFilter)`; if `res.data.question` use it; if `res.data.should_advance` or error, fallback to `getRandomQuestion(conceptFilter)`. |
| **api.js: getAdaptiveQuestion → GET /api/mastery/next-question/?concept=** | ✅ Done | **Was pointing to /question/random/.** Now correctly calls `/mastery/next-question/` with optional `concept` param. |
| **ErrorBoundary.jsx** | ✅ Done | Class component with `getDerivedStateFromError`, `componentDidCatch`, friendly fallback UI. |
| **App.jsx: wrap &lt;App&gt; in ErrorBoundary** | ✅ Done | `<ErrorBoundary>` wraps `AuthProvider` and router. |

---

## Group 2 — Important Fixes (High UX Impact)

### Backend

| Item | Status | Notes |
|------|--------|--------|
| **gamification_service: daily goal reset unconditional** | ✅ Done | Step 3 resets `daily_goal_progress` and `last_daily_goal_date` when `last_daily_goal_date != today`, regardless of `xp_gain`. |

### Frontend

| Item | Status | Notes |
|------|--------|--------|
| **StudentHome: skeleton loaders** | ✅ Done | Skeleton for stat cards, XP bar, daily goal bar, concept grid during initial load. |
| **ReviewMode: questionAPI.getReviewQueue()** | ✅ Done | Already uses `questionAPI.getReviewQueue(20)` and `questionAPI.getReviewStats()` — no raw `api.getReviewQueue()` found. |
| **ProgressHeatmap: refreshKey prop** | ✅ Done | **Was missing.** Component now accepts `refreshKey`; `useEffect` depends on `[refreshKey]`, so refetch only when it changes. |
| **Dashboard: pass refreshKey, increment every 5 submissions** | ✅ Done | **Was missing.** `heatmapRefreshKey` state + `submissionsSinceHeatmapRef`; increment key every 5 submissions and pass to `<ProgressHeatmap refreshKey={heatmapRefreshKey} />`. |

---

## Group 3 — Nice-to-Have

| Item | Status | Notes |
|------|--------|--------|
| **get_mastery_summary: ?limit= & ?offset=** | ✅ Done | View reads `limit` and `offset` from query params; returns sliced `concepts` and preserves `total_concepts` for client pagination. |
| **StudentHome: "Show more" on concept grid** | ✅ Done | **Was missing.** Shows 6 concepts by default; "Show more (N more)" / "Show less" toggle to expand/collapse. |

---

## Group 4 — Deferred

| Issue | Reason (as specified) |
|-------|-------------------------|
| httpOnly cookies for JWT | CORS + cookie config; localStorage acceptable for competition. |
| PWA / offline | Out of scope. |
| Timezone-aware streaks | Low risk for IST/local. |

---

## Additional Fixes Applied (Critical Agent)

1. **SubmitThrottle on submit_answer** — It was not applied; added at the start of `submit_answer`.
2. **api.js getAdaptiveQuestion** — Was calling `/question/random/`; updated to `/mastery/next-question/` with `params: { concept }`.
3. **Dashboard fetchQuestion** — Was only using getRandomQuestion; now uses getAdaptiveQuestion first and falls back to getRandomQuestion when no question or `should_advance`.
4. **UserProfile.__str__ (models.py)** — Still used `self.user.username`; custom User has no `username`. Changed to `self.user.email`.
5. **ProgressHeatmap refreshKey** — Implemented prop and Dashboard wiring with increment every 5 submissions.
6. **api.js 401 interceptor** — Guarded with `error.response?.status` to avoid throwing on network errors.

---

## Other Potential Critics (Not in Original List)

| Issue | Severity | Suggestion |
|-------|----------|------------|
| **get_random_question is sync** | Low | Backend has both sync `get_random_question` (question/random/) and async `get_next_question` (mastery/next-question/). Frontend now uses adaptive endpoint first; random is fallback. No change required unless you want full async. |
| **groq not in requirements.txt** | Medium | `ai_service.py` imports `groq`; add `groq` to `requirements.txt` so `pip install -r requirements.txt` is sufficient. |
| **Rate limit scopes and DRF throttle cache** | Low | Custom throttle classes use `scope`; ensure `DEFAULT_THROTTLE_RATES` in settings includes `hint`, `explanation`, `submit` if you ever switch to DRF’s built-in throttle application. Manual `_check_throttle` uses in-memory throttle; for multi-worker deployment you’d want a shared cache (e.g. Redis). |
| **Review queue response shape** | — | Backend returns `{ questions, count }`; ReviewMode uses `queueRes.data.questions` — correct. |
| **Mastery summary pagination default** | Low | When `limit=0` and `offset=0`, full list is returned; no breaking change. |

---

## Summary

- **Group 1:** All items verified; SubmitThrottle on submit_answer, getAdaptiveQuestion URL and Dashboard flow were fixed.
- **Group 2:** All items verified; ProgressHeatmap refreshKey and Dashboard wiring were added.
- **Group 3:** Pagination and "Show more" were implemented.
- **Additional:** UserProfile `__str__` and 401 interceptor safety were fixed.

Recommendation: Add `groq` to `requirements.txt` for a complete install.
