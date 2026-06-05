import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { questionAPI } from "../services/api";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import MasteryChart from "../components/MasteryChart.jsx";
import ProgressHeatmap from "../components/ProgressHeatmap.jsx";
import SessionModal from "../components/SessionModal.jsx";
import CelebrationDialog from "../components/CelebrationDialog.jsx";
import ConceptMap from "../components/ConceptMap.jsx";
import DifficultyBadge from "../components/DifficultyBadge.jsx";
import SessionExpiredModal from "../components/SessionExpiredModal.jsx";
import { motion, AnimatePresence } from "framer-motion";

// ── Small reusable stat card ────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  icon,
  valueClass = "text-white",
  accent,
}) => (
  <div
    className={`glass p-4 rounded-xl border ${accent || "border-white/10"} flex flex-col gap-1`}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      {icon && <span className="text-base opacity-60">{icon}</span>}
    </div>
    <p className={`text-2xl font-bold font-heading ${valueClass}`}>{value}</p>
    {sub && <p className="text-xs text-gray-600">{sub}</p>}
  </div>
);

// ── XP progress bar ─────────────────────────────────────────────────────────
const XPBar = ({ xp, level }) => {
  const xpForLevel = (lvl) => Math.pow((lvl - 1) * 10, 2);
  const startXP = xpForLevel(level);
  const nextXP = xpForLevel(level + 1);
  const pct = Math.min(
    100,
    Math.max(0, ((xp - startXP) / (nextXP - startXP)) * 100),
  );
  return (
    <div className="glass p-4 rounded-xl border border-white/10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Level {level}
        </span>
        <span className="text-xs text-gray-600 font-mono">
          {xp} / {nextXP} XP
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-300 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-700">Lv {level}</span>
        <span className="text-[10px] text-gray-700">Lv {level + 1}</span>
      </div>
    </div>
  );
};

// ── Bloom level badge colours ───────────────────────────────────────────────
const BLOOM_COLORS = {
  remember: "bg-blue-950/50 text-blue-300 border-blue-800",
  understand: "bg-green-950/50 text-green-300 border-green-800",
  apply: "bg-yellow-950/50 text-yellow-300 border-yellow-800",
  analyze: "bg-orange-950/50 text-orange-300 border-orange-800",
  evaluate: "bg-red-950/50 text-red-300 border-red-800",
  create: "bg-purple-950/50 text-purple-300 border-purple-800",
};

// ── Main Dashboard ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout, sessionExpired, handleSessionExpired, renewSession } =
    useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conceptFilter = searchParams.get("concept");

  // Quiz state
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [hintCount, setHintCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [explanation, setExplanation] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Stats state
  const [masteryData, setMasteryData] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [userData, setUserData] = useState(null);

  // Session modal
  const [showSession, setShowSession] = useState(false);

  // Heatmap refresh key — increment once per 5 submissions
  const [heatmapRefreshKey, setHeatmapRefreshKey] = useState(0);
  const submissionsSinceHeatmapRef = useRef(0);

  // Celebration dialog
  const [celebration, setCelebration] = useState({
    open: false,
    type: "goal",
    streakDays: 0,
    level: 1,
    xpBonus: 0,
  });

  // Phase 8 — difficulty recommendation toast & concept map
  const [difficultyRec, setDifficultyRec] = useState(null); // {action, reason, suggested_bloom_level, show_badge}
  const [conceptMap, setConceptMap] = useState(null); // {prerequisites, successors, related}
  const [prerequisiteHint, setPrerequisiteHint] = useState(""); // soft banner under question
  const difficultyTimerRef = useRef(null);
  const [agentLatencies, setAgentLatencies] = useState(null); // {evaluation, EvaluationAgent(...), HintAgent, ...}
  const [showTerminal, setShowTerminal] = useState(false); // Default to collapsed to reduce noise

  // ── Fetch all stats ──────────────────────────────────────────────────────
  const fetchMasteryAndStats = useCallback(async () => {
    try {
      const [masteryRes, reviewRes, userRes] = await Promise.all([
        questionAPI.getMasterySummary(),
        questionAPI.getReviewStats(),
        questionAPI.getUserStats(),
      ]);
      setMasteryData(masteryRes.data);
      setReviewStats(reviewRes.data);
      setUserData(userRes.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  }, []);

  useEffect(() => {
    fetchMasteryAndStats();
  }, []);

  // ── Fetch question (adaptive first, fallback to random) ───────────────────
  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setHint(null);
    setAnswer("");
    setHintCount(0);
    setAttemptCount(0);
    setShowExplanation(false);
    setExplanation(null);
    setDifficultyRec(null);
    setConceptMap(null);
    setPrerequisiteHint("");
    setAgentLatencies(null);
    try {
      console.log("🔍 Fetching adaptive question...");
      const res = await questionAPI.getAdaptiveQuestion(conceptFilter);
      console.log("📝 Adaptive question response:", res.data);
      if (res.data?.question) {
        console.log("✅ Setting question:", res.data.question);
        setQuestion(res.data.question);
      } else if (res.data?.should_advance) {
        console.log("⏭️ Should advance, getting fallback...");
        const fallback = await questionAPI.getRandomQuestion(conceptFilter);
        console.log("🎲 Fallback question:", fallback.data);
        setQuestion(fallback.data);
        if (fallback.data?.prerequisite_hint) {
          setPrerequisiteHint(fallback.data.prerequisite_hint);
        }
      } else {
        console.log("❌ No question available");
        setQuestion(null);
      }
    } catch (err) {
      if (err.response?.status === 404 || err.response?.data?.message) {
        try {
          const fallback = await questionAPI.getRandomQuestion(conceptFilter);
          setQuestion(fallback.data);
          if (fallback.data?.prerequisite_hint) {
            setPrerequisiteHint(fallback.data.prerequisite_hint);
          }
        } catch (e) {
          console.error("Fallback random question failed", e);
          setQuestion(null);
        }
      } else {
        console.error("Failed to fetch question", err);
        setQuestion(null);
      }
    } finally {
      setLoading(false);
    }
  }, [conceptFilter]);

  useEffect(() => {
    fetchQuestion();
  }, []);

  // ── Session expiry handling ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleSessionExpiredEvent = () => {
      handleSessionExpired();
    };

    window.addEventListener("sessionExpired", handleSessionExpiredEvent);
    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpiredEvent);
    };
  }, [handleSessionExpired]);

  // ── Submit answer ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || !answer.trim()) {
      console.log("❌ Missing question or answer");
      return;
    }
    console.log("📤 Submitting answer for question ID:", question.id);
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await questionAPI.submitAnswer({
        question_id: question.id,
        submitted_answer: answer,
      });
      console.log("✅ Submit response:", res.data);
      setFeedback(res.data);
      setAgentLatencies(res.data.agent_latencies || null);
      setAttemptCount((prev) => prev + 1);

      // ✅ Accurate update using actual values from backend
      setUserData((prev) => {
        const updated = {
          ...prev,
          xp: (prev?.xp || 0) + (res.data.xp_gained || 0),
          level: res.data.new_level || prev?.level || 1,
          streak_days:
            res.data.streak_days != null
              ? res.data.streak_days
              : prev?.streak_days || 0,
          daily_goal_progress:
            res.data.daily_goal_progress != null
              ? res.data.daily_goal_progress
              : (prev?.daily_goal_progress || 0) +
                (res.data.xp_gained > 0 ? 1 : 0),
        };

        // 🎉 Trigger celebration dialog
        if (res.data.goal_completed) {
          setCelebration({ open: true, type: "goal", xpBonus: 50 });
        } else if (
          res.data.new_level &&
          res.data.new_level > (prev?.level || 1)
        ) {
          setCelebration({
            open: true,
            type: "levelup",
            level: res.data.new_level,
          });
        } else if (
          res.data.streak_days &&
          res.data.streak_days > 0 &&
          res.data.streak_days % 7 === 0
        ) {
          setCelebration({
            open: true,
            type: "streak",
            streakDays: res.data.streak_days,
          });
        }

        return updated;
      });

      // Refresh all metrics after submission
      fetchMasteryAndStats();
      submissionsSinceHeatmapRef.current += 1;
      if (submissionsSinceHeatmapRef.current % 5 === 0) {
        setHeatmapRefreshKey((k) => k + 1);
      }

      // Phase 8 — difficulty recommendation & concept map
      const rec = res.data.difficulty_recommendation;
      if (rec?.show_badge) {
        setDifficultyRec(rec);
        if (difficultyTimerRef.current)
          clearTimeout(difficultyTimerRef.current);
        difficultyTimerRef.current = setTimeout(
          () => setDifficultyRec(null),
          6000,
        );
      }
      if (res.data.concept_map) setConceptMap(res.data.concept_map);
      if (res.data.prerequisite_hint)
        setPrerequisiteHint(res.data.prerequisite_hint);
      else setPrerequisiteHint("");
    } catch (err) {
      console.error("Failed to submit answer", err);
      setFeedback({
        error: "Unable to submit. Please try again.",
        is_correct: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Hint ─────────────────────────────────────────────────────────────────
  const handleGetHint = async () => {
    if (hintCount >= 3) return;
    setIsLoadingHint(true);
    setHint(null);
    try {
      const res = await questionAPI.getHint(question.id);
      setHint(res.data.hint);
      setHintCount((prev) => prev + 1);
      if (res.data.can_show_answer) setShowExplanation(true);
    } catch {
      setHint("Unable to generate hint. Please try again.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  // ── Explanation ──────────────────────────────────────────────────────────
  const handleGetExplanation = async () => {
    try {
      const res = await questionAPI.getExplanation(question.id);
      setExplanation(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Unable to get explanation");
    }
  };

  // ── Derived metrics ──────────────────────────────────────────────────────
  const xp = userData?.xp ?? 0;
  const level = userData?.level ?? 1;
  const streak = userData?.streak_days ?? 0;
  const dailyProgress = userData?.daily_goal_progress ?? 0;
  const dailyGoal = 5;
  const retentionScore = Math.max(0, 100 - (reviewStats?.due_today ?? 0) * 2);
  const totalConcepts = masteryData?.total_concepts ?? 0;
  const overallProg = masteryData?.overall_progress ?? 0;

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading && !question)
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your session…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      {/* Background glows */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[10%] right-[5%]  w-[500px] h-[500px] bg-cyan-500/4   rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-purple-600/4 rounded-full blur-[110px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo — click to go to landing */}
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-black font-black text-sm shadow-lg shadow-cyan-500/20">
                N
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-heading tracking-tight">
                NeuroTutor
              </span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Streak pill */}
              {streak > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-950/40 border border-orange-800/50 text-orange-400 text-xs font-bold">
                  🔥 {streak} day streak
                </div>
              )}

              {/* Review badge */}
              {(reviewStats?.due_today ?? 0) > 0 && (
                <Link to="/review">
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/50 border border-amber-700/60 text-amber-400 text-xs font-bold"
                  >
                    📚 {reviewStats.due_today} due
                  </motion.div>
                </Link>
              )}

              {/* Session button */}
              <button
                onClick={() => setShowSession(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
              >
                📊 Session
              </button>

              {/* User + logout */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
                <span className="text-sm text-gray-300">{user?.name}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main two-column layout ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* ══ LEFT: Quiz + Charts ══ */}
          <div className="space-y-6 min-w-0">
            {/* Phase 8 — difficulty recommendation toast (fixed top-right) */}
            <AnimatePresence>
              {difficultyRec && (
                <motion.div
                  key="difficulty-toast"
                  initial={{ opacity: 0, x: 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 80 }}
                  className="fixed top-20 right-4 z-50 glass border border-white/10 rounded-2xl p-4 shadow-2xl max-w-[280px]"
                >
                  {difficultyRec.action === "advance" && (
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🚀</span>
                      <div>
                        <p className="font-bold text-emerald-400 text-sm">
                          Level Up!
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {difficultyRec.reason}
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">
                          Next: {difficultyRec.suggested_bloom_level}
                        </p>
                      </div>
                    </div>
                  )}
                  {difficultyRec.action === "mastered" && (
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🏆</span>
                      <div>
                        <p className="font-bold text-yellow-400 text-sm">
                          Concept Mastered!
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {difficultyRec.reason}
                        </p>
                      </div>
                    </div>
                  )}
                  {difficultyRec.action === "remediate" && (
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">📖</span>
                      <div>
                        <p className="font-bold text-amber-400 text-sm">
                          Let's Review
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {difficultyRec.reason}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                          Back to: {difficultyRec.suggested_bloom_level}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setDifficultyRec(null)}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 text-xs"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quiz card – simplified, more minimal */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
              {/* Card header */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {question?.concept && (
                    <span className="px-2.5 py-0.5 text-xs font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-800 rounded-full uppercase tracking-wider">
                      {question.concept.replace(/_/g, " ")}
                    </span>
                  )}
                  {question?.bloom_level && (
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider ${BLOOM_COLORS[question.bloom_level] || "bg-white/5 text-gray-400 border-white/10"}`}
                    >
                      {question.bloom_level}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 uppercase tracking-widest">
                  {attemptCount > 0 ? `Attempt ${attemptCount}` : "New"}
                </span>
              </div>

              <div className="p-6 sm:p-7">
                {question ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-snug font-heading">
                      {question.text}
                    </h2>

                    {/* Phase 8 — prerequisite hint banner */}
                    {prerequisiteHint && (
                      <div className="mb-4 flex items-start gap-2 bg-indigo-950/30 border border-indigo-800/40 rounded-xl px-4 py-2.5">
                        <span className="text-indigo-400 text-sm mt-0.5">
                          💡
                        </span>
                        <p className="text-xs text-indigo-300/80">
                          {prerequisiteHint}
                        </p>
                      </div>
                    )}

                    {/* Phase 8 — concept pathway map */}
                    {conceptMap && (
                      <ConceptMap
                        concept={question.concept}
                        prerequisites={conceptMap.prerequisites}
                        successors={conceptMap.successors}
                        related={conceptMap.related}
                        className="mb-5"
                      />
                    )}

                    {/* Agent terminal – shows multi-agent activity */}
                    {(isSubmitting || agentLatencies) && (
                      <div className="mb-5">
                        {!showTerminal ? (
                          <button
                            onClick={() => setShowTerminal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px] text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors font-mono"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>
                              agent://orchestrator{" "}
                              {isSubmitting ? "(thinking…)" : "(idle)"}
                            </span>
                          </button>
                        ) : (
                          <div className="bg-black/80 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-gray-300">
                            <div
                              className="flex items-center justify-between mb-2 cursor-pointer hover:text-white"
                              onClick={() => setShowTerminal(false)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-emerald-400">
                                  agent://orchestrator
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 hover:text-red-400">
                                × close
                              </span>
                            </div>

                            <div className="space-y-1 pl-3.5 border-l border-white/10">
                              <div className="flex justify-between text-gray-500">
                                <span>status:</span>
                                <span
                                  className={
                                    isSubmitting
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                  }
                                >
                                  {isSubmitting ? "processing..." : "completed"}
                                </span>
                              </div>
                              {agentLatencies &&
                                Object.entries(agentLatencies).map(
                                  ([name, ms]) => (
                                    <div
                                      key={name}
                                      className="flex justify-between hover:bg-white/5 rounded px-1 -mx-1"
                                    >
                                      <span className="text-gray-400">
                                        {name}
                                      </span>
                                      <span className="text-cyan-200">
                                        {ms}ms
                                      </span>
                                    </div>
                                  ),
                                )}
                              {!agentLatencies && isSubmitting && (
                                <div className="text-gray-600 italic">
                                  spawning agents...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hint */}
                    <AnimatePresence>
                      {hint && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mb-5 bg-amber-950/30 border-l-4 border-amber-500/50 p-4 rounded-r-xl"
                        >
                          <p className="text-xs font-bold text-amber-400 mb-1">
                            💡 Hint {hintCount}
                          </p>
                          <p className="text-amber-200/80 text-sm">{hint}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Answer form */}
                    {!feedback?.is_correct && (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                          rows={3}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Type your answer here…"
                          className="w-full p-4 text-base bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 outline-none text-white placeholder-gray-600 transition-all resize-none"
                          disabled={isSubmitting}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                              handleSubmit(e);
                          }}
                        />
                        <p className="text-xs text-gray-700 -mt-2">
                          Ctrl+Enter to submit
                        </p>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={isSubmitting || !answer.trim()}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold px-6 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,243,255,0.25)] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />{" "}
                                Evaluating…
                              </>
                            ) : (
                              "Submit Answer"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleGetHint}
                            disabled={isLoadingHint || hintCount >= 3}
                            className="px-5 py-3 border border-white/10 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 disabled:opacity-40 transition-all flex items-center gap-2"
                          >
                            {isLoadingHint ? (
                              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>💡</span>
                                <span className="hidden sm:inline text-sm">
                                  Hint {hintCount > 0 && `(${hintCount}/3)`}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Feedback */}
                    <AnimatePresence>
                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-5 rounded-xl border-l-4 p-5 ${
                            feedback.is_correct
                              ? "bg-green-950/20 border-green-500/50"
                              : feedback.verdict === "partial"
                                ? "bg-amber-950/20 border-amber-500/50"
                                : "bg-red-950/20 border-red-500/50"
                          }`}
                        >
                          {/* Verdict message from semantic evaluation */}
                          <p
                            className={`font-bold text-base mb-1 ${
                              feedback.is_correct
                                ? "text-green-400"
                                : feedback.verdict === "partial"
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            {feedback.verdict_message ||
                              (feedback.is_correct
                                ? "✅ Correct!"
                                : "❌ Not quite")}
                          </p>

                          {/* Confidence badge */}
                          {feedback.confidence != null && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${feedback.is_correct ? "bg-green-500" : "bg-red-500"}`}
                                  style={{
                                    width: `${Math.round(feedback.confidence * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 font-mono">
                                {Math.round(feedback.confidence * 100)}%
                                confidence
                              </span>
                            </div>
                          )}

                          {/* Socratic feedback (for wrong answers) */}
                          {feedback.feedback && (
                            <p
                              className={`text-sm mt-2 leading-relaxed ${
                                feedback.is_correct
                                  ? "text-green-200/70"
                                  : "text-red-200/70"
                              }`}
                            >
                              {feedback.feedback}
                            </p>
                          )}

                          {/* Mastery update pill */}
                          {feedback.current_mastery && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-600">
                                Mastery:
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs font-bold rounded-full border ${BLOOM_COLORS[feedback.current_mastery] || "bg-white/5 text-gray-400 border-white/10"}`}
                              >
                                {feedback.current_mastery}
                              </span>
                              {feedback.xp_gained > 0 && (
                                <span className="text-xs text-yellow-400 font-bold">
                                  +{feedback.xp_gained} XP
                                </span>
                              )}
                            </div>
                          )}

                          {/* Next question button */}
                          {feedback.is_correct && (
                            <button
                              onClick={fetchQuestion}
                              className="mt-4 w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group"
                            >
                              Next Question
                              <span className="group-hover:translate-x-1 transition-transform">
                                →
                              </span>
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Explanation trigger */}
                    {(showExplanation ||
                      (attemptCount >= 2 && !feedback?.is_correct)) &&
                      !explanation && (
                        <div className="mt-6 pt-5 border-t border-white/5 text-center">
                          <p className="text-gray-600 text-xs mb-3">
                            Struggling with this concept?
                          </p>
                          <button
                            onClick={handleGetExplanation}
                            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-cyan-500/10 transition-colors"
                          >
                            📖 Show Full Explanation
                          </button>
                        </div>
                      )}

                    {/* Explanation */}
                    <AnimatePresence>
                      {explanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-5 bg-blue-950/20 p-5 rounded-xl border border-blue-500/20"
                        >
                          <h3 className="font-bold text-blue-300 mb-2 text-sm">
                            📖 Explanation
                          </h3>
                          <p className="text-blue-200/80 text-sm whitespace-pre-wrap leading-relaxed">
                            {explanation.explanation}
                          </p>
                          {explanation.correct_answer && (
                            <div className="mt-3 pt-3 border-t border-blue-500/20">
                              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                                Correct Answer
                              </span>
                              <p className="font-mono text-blue-100 bg-blue-900/40 px-3 py-1.5 rounded mt-1 text-sm border border-blue-500/20 inline-block">
                                {explanation.correct_answer}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={fetchQuestion}
                            className="mt-4 w-full bg-blue-600/80 hover:bg-blue-500/80 text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-sm"
                          >
                            Got it! Next Question →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  !loading && (
                    <div className="text-center py-16">
                      <p className="text-gray-400 text-lg mb-2">
                        No questions available
                      </p>
                      <p className="text-gray-600 text-sm mb-4">
                        Check back later or try a different concept.
                      </p>
                      <button
                        onClick={fetchQuestion}
                        className="text-cyan-400 hover:underline text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Mastery chart */}
            <MasteryChart concepts={masteryData?.concepts || []} />

            {/* Heatmap */}
            <ProgressHeatmap refreshKey={heatmapRefreshKey} />
          </div>

          {/* ══ RIGHT: Live Metrics Sidebar ══ */}
          <div className="space-y-4">
            {/* XP / Level bar */}
            <XPBar xp={xp} level={level} />

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Day Streak"
                value={streak > 0 ? `🔥 ${streak}` : "0"}
                sub={
                  streak >= 7
                    ? "You're on fire!"
                    : streak > 0
                      ? "Keep going!"
                      : "Start today!"
                }
                valueClass={
                  streak >= 7
                    ? "text-orange-400"
                    : streak > 0
                      ? "text-amber-400"
                      : "text-gray-500"
                }
                accent={streak > 0 ? "border-orange-900/50" : "border-white/10"}
              />
              <StatCard
                label="Daily Goal"
                value={`${dailyProgress}/${dailyGoal}`}
                sub={
                  dailyProgress >= dailyGoal
                    ? "🎉 Complete!"
                    : `${dailyGoal - dailyProgress} to go`
                }
                valueClass={
                  dailyProgress >= dailyGoal ? "text-green-400" : "text-white"
                }
                accent={
                  dailyProgress >= dailyGoal
                    ? "border-green-900/50"
                    : "border-white/10"
                }
              />
              <StatCard
                label="Concepts"
                value={totalConcepts}
                sub="mastered"
                icon="🧠"
                valueClass="text-cyan-300"
              />
              <StatCard
                label="Retention"
                value={`${retentionScore}%`}
                sub="spaced rep score"
                icon="📈"
                valueClass={
                  retentionScore >= 80
                    ? "text-green-400"
                    : retentionScore >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                }
              />
            </div>

            {/* Overall progress bar */}
            <div className="glass p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Overall Mastery
                </span>
                <span className="text-xs text-cyan-400 font-bold">
                  {overallProg}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProg}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Across all Bloom levels
              </p>
            </div>

            {/* Review due card */}
            {(reviewStats?.due_today ?? 0) > 0 && (
              <Link to="/review">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(245,158,11,0)",
                      "0 0 20px rgba(245,158,11,0.15)",
                      "0 0 0 rgba(245,158,11,0)",
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="glass p-4 rounded-xl border border-amber-800/50 bg-amber-950/20 cursor-pointer hover:border-amber-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        📚 Review Due
                      </p>
                      <p className="text-2xl font-bold text-white mt-0.5">
                        {reviewStats.due_today}
                      </p>
                      <p className="text-xs text-amber-600">
                        questions need review
                      </p>
                    </div>
                    <div className="text-3xl opacity-30">→</div>
                  </div>
                </motion.div>
              </Link>
            )}

            {/* Concept breakdown (top 3) */}
            {masteryData?.concepts?.length > 0 && (
              <div className="glass p-4 rounded-xl border border-white/10">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Top Concepts
                </h3>
                <div className="space-y-3">
                  {masteryData.concepts.slice(0, 4).map((c) => (
                    <div key={c.concept}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-300 capitalize truncate max-w-[60%]">
                          {c.concept.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded border ${BLOOM_COLORS[c.current_level] || "text-gray-500 border-white/10"}`}
                        >
                          {c.current_level}
                        </span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${c.progress_percentage}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty Recommendation Badge */}
      {difficultyRec && (
        <DifficultyBadge
          recommendation={difficultyRec}
          onDismiss={() => setDifficultyRec(null)}
        />
      )}

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onClose={() => navigate("/login")}
        onLogin={() => navigate("/login")}
        onRenew={renewSession}
      />

      {/* Session Modal */}
      <SessionModal
        isOpen={showSession}
        onClose={() => setShowSession(false)}
        userData={userData}
      />

      {/* Celebration Dialog */}
      <CelebrationDialog
        isOpen={celebration.open}
        onClose={() => setCelebration((prev) => ({ ...prev, open: false }))}
        type={celebration.type}
        streakDays={celebration.streakDays}
        level={celebration.level}
        xpBonus={celebration.xpBonus}
      />
    </div>
  );
};

export default Dashboard;
