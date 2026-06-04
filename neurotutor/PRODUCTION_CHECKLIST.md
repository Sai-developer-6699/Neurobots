# NeuroTutor — Production Readiness Checklist

Use this list to deploy for real users. Items marked ✅ are done; ⬜ need your environment or deployment steps.

---

## 1. Security & configuration

| Item | Status | Notes |
|------|--------|--------|
| **SECRET_KEY from env, required in prod** | ✅ | Raise if `DJANGO_ENV=production` and SECRET_KEY missing. |
| **DEBUG default False, from env** | ✅ | Set `DEBUG=False` in production. |
| **ALLOWED_HOSTS from env** | ✅ | Set `ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com`. |
| **CORS from env** | ✅ | Set `CORS_ALLOWED_ORIGINS=https://yourdomain.com`. |
| **CSRF_TRUSTED_ORIGINS for HTTPS** | ✅ | Set when using HTTPS (same as CORS or `CSRF_TRUSTED_ORIGINS`). |
| **Secure cookies when not DEBUG** | ✅ | `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` set when DEBUG=False. |
| **Proxy SSL header** | ✅ | `SECURE_PROXY_SSL_HEADER` set when DEBUG=False (for Railway/Render etc.). |
| **No stack traces in API** | ✅ | Ensure DEBUG=False; DRF returns generic 500 in production. |
| **JWT in cookies vs localStorage** | ⬜ | Currently cookies (js-cookie). For stricter security consider httpOnly + sameSite (requires backend setting cookies). |

---

## 2. Database & cache

| Item | Status | Notes |
|------|--------|--------|
| **PostgreSQL when DB_* set** | ✅ | Set `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`. |
| **SQLite fallback for dev** | ✅ | If DB_NAME not set, uses SQLite. |
| **Redis for rate limiting (multi-worker)** | ✅ | Set `REDIS_URL` so throttles are shared across workers. |
| **Migrations** | ⬜ | Run `python manage.py migrate` on deploy. |
| **Backups** | ⬜ | Configure DB backups (e.g. provider automated backups). |

---

## 3. API & frontend

| Item | Status | Notes |
|------|--------|--------|
| **Health check endpoint** | ✅ | `GET /api/health/` (optional `?db=1` to check DB). |
| **Frontend API URL from env** | ✅ | Build with `VITE_API_URL=https://api.yourdomain.com/api`. |
| **Token refresh URL dynamic** | ✅ | Uses same base URL as api. |
| **Request timeout** | ✅ | Axios timeout 30s; refresh 10s. |

---

## 4. Logging & observability

| Item | Status | Notes |
|------|--------|--------|
| **Console logging by default** | ✅ | Production platforms capture stdout. |
| **Optional log file** | ✅ | Set `LOG_FILE=/path/to/app.log` if needed. |
| **Structured / JSON logs** | ⬜ | Optional: switch handler to a JSON formatter for log aggregators. |
| **Error tracking (Sentry)** | ⬜ | Add `sentry-sdk`, init in `settings.py`, set `SENTRY_DSN`. |
| **Uptime / alerting** | ⬜ | Use health endpoint in a monitor (e.g. UptimeRobot, Pingdom). |

---

## 5. Rate limiting & abuse

| Item | Status | Notes |
|------|--------|--------|
| **Hint / Explanation / Submit throttles** | ✅ | 10/h, 5/h, 120/h per user. |
| **Throttle storage** | ✅ | Use Redis (`REDIS_URL`) in production so limits are shared. |
| **Global DRF throttle** | ✅ | 1000/hour user fallback. |

---

## 6. Deployment

| Item | Status | Notes |
|------|--------|--------|
| **Backend (e.g. Railway / Render)** | ⬜ | Set env vars; run `migrate`, `collectstatic` if serving static; use gunicorn/uvicorn. |
| **Frontend (e.g. Vercel / Netlify)** | ⬜ | Build with `VITE_API_URL`; deploy `dist/`. |
| **Static files (Django)** | ⬜ | Use WhiteNoise or CDN; run `collectstatic`. |
| **CI/CD** | ⬜ | Run tests and migrations on push; deploy on main. |
| **Secrets** | ⬜ | Store SECRET_KEY, GROQ_API_KEY, DB_*, REDIS_URL in platform secrets, not in code. |

---

## 7. Optional hardening

| Item | Status | Notes |
|------|--------|--------|
| **Input validation** | ✅ | Serializers validate; add more field limits if needed. |
| **Password strength** | ✅ | Django validators (length, common, numeric). |
| **HSTS** | ✅ | `SECURE_HSTS_*` set in settings when not DEBUG. |
| **Admin URL** | ⬜ | Consider renaming or restricting `/admin/` in production. |

---

## Quick production env example

```env
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=<generate with get_random_secret_key>
ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
GROQ_API_KEY=<your key>
DB_NAME=neurotutor
DB_USER=neurotutor
DB_PASSWORD=<secure>
DB_HOST=<db host>
DB_PORT=5432
REDIS_URL=redis://...
```

Frontend build:

```bash
VITE_API_URL=https://api.yourdomain.com/api npm run build
```

---

## Critics addressed in code

1. **Hardcoded API URL** → `VITE_API_URL` + fallback to localhost.
2. **Empty ALLOWED_HOSTS** → From env; default localhost for dev.
3. **Hardcoded CORS** → From env; default dev origins.
4. **No health check** → `GET /api/health/` and optional `?db=1`.
5. **SECRET_KEY not enforced in prod** → Raise if production and missing.
6. **Database always PostgreSQL** → Use SQLite when DB_NAME not set.
7. **Logging only to file** → Console by default; optional LOG_FILE.
8. **Cache always in-memory** → Redis when REDIS_URL set.
9. **Missing python-dotenv / psycopg2** → Added to requirements.txt.
10. **.env.example** → Updated with production variables.
