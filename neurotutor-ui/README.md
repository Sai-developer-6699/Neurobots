# NeuroTutor — Frontend

React + Vite frontend for the NeuroTutor adaptive learning platform.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS v4** (custom dark design system)
- **Framer Motion** (animations, celebration dialogs, transitions)
- **React Router v6** (client-side routing)
- **Axios** (API client with JWT interceptors)

## Pages

| Route | Component | Description |
|---|---|---|
| `/` | `Landing.jsx` | Public landing page with feature showcase |
| `/login` | `Login.jsx` | JWT login form |
| `/register` | `Register.jsx` | Registration form |
| `/dashboard` | `StudentHome.jsx` | Post-login home: XP bar, daily goal, concept mastery grid |
| `/learn` | `Dashboard.jsx` | Main quiz interface with live metrics sidebar |
| `/review` | `ReviewMode.jsx` | Spaced repetition review session |

## Key Components

| Component | Purpose |
|---|---|
| `MasteryChart.jsx` | Bloom level progress bars per concept |
| `ProgressHeatmap.jsx` | 52-week GitHub-style activity calendar |
| `GamificationPanel.jsx` | XP, level, streak, leaderboard |
| `SessionModal.jsx` | Session stats overlay (streak, daily goal, review queue) |
| `CelebrationDialog.jsx` | Confetti dialog for goal/streak/level-up milestones |

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build
```

## Environment

The frontend proxies API calls to `http://127.0.0.1:8000/api/` via Vite's dev proxy (configured in `vite.config.js`). No `.env` needed for development.

## API Service

All API calls go through `src/services/api.js`:

```js
import { questionAPI, authAPI } from './services/api';

// Examples
questionAPI.submitAnswer({ question_id, submitted_answer })
questionAPI.getUserStats()          // GET /api/gamification/me/
questionAPI.getMasterySummary()     // GET /api/mastery/summary/
questionAPI.getHeatmapData()        // GET /api/gamification/heatmap/
```

## Design System

The app uses a custom dark design system defined in `index.css`:

- **Background**: `#0a0a0f` with subtle grid overlay
- **Primary**: Cyan (`#00f3ff`) with glow effects
- **Glass cards**: `backdrop-blur` + `bg-white/5` + `border-white/10`
- **Typography**: `Inter` (body), `Space Grotesk` (headings)
- **Animations**: Framer Motion for page transitions, metric updates, and celebration dialogs
