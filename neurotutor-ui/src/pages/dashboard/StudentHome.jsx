import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { questionAPI } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ConceptMap from "../../components/ConceptMap.jsx";

// ── Bloom level colours ─────────────────────────────────────────────────────
const BLOOM_COLORS = {
  remember: {
    bar: "from-blue-500 to-blue-400",
    badge: "bg-blue-950/50 text-blue-300 border-blue-800",
  },
  understand: {
    bar: "from-green-500 to-green-400",
    badge: "bg-green-950/50 text-green-300 border-green-800",
  },
  apply: {
    bar: "from-yellow-500 to-yellow-400",
    badge: "bg-yellow-950/50 text-yellow-300 border-yellow-800",
  },
  analyze: {
    bar: "from-orange-500 to-orange-400",
    badge: "bg-orange-950/50 text-orange-300 border-orange-800",
  },
  evaluate: {
    bar: "from-red-500 to-red-400",
    badge: "bg-red-950/50 text-red-300 border-red-800",
  },
  create: {
    bar: "from-purple-500 to-purple-400",
    badge: "bg-purple-950/50 text-purple-300 border-purple-800",
  },
};

// ── XP level formula ────────────────────────────────────────────────────────
const xpForLevel = (lvl) => Math.pow((lvl - 1) * 10, 2);

// ── Greeting ────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function StudentHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [masteryData, setMasteryData] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllConcepts, setShowAllConcepts] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState(null);
  const [conceptMaps, setConceptMaps] = useState({});
  const [conceptMapLoading, setConceptMapLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, masteryRes, reviewRes] = await Promise.all([
          questionAPI.getUserStats(),
          questionAPI.getMasterySummary(),
          questionAPI.getReviewStats(),
        ]);
        setUserData(userRes.data);
        setMasteryData(masteryRes.data);
        setReviewStats(reviewRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleToggleConceptMap = async (concept) => {
    if (expandedConcept === concept) {
      setExpandedConcept(null);
      return;
    }
    setExpandedConcept(concept);
    if (conceptMaps[concept]) return;
    try {
      setConceptMapLoading(true);
      const res = await questionAPI.getConceptMap(concept);
      setConceptMaps((prev) => ({ ...prev, [concept]: res.data }));
    } catch (err) {
      console.error("Failed to load concept map", err);
    } finally {
      setConceptMapLoading(false);
    }
  };

  // Derived
  const xp = userData?.xp ?? 0;
  const level = userData?.level ?? 1;
  const streak = userData?.streak_days ?? 0;
  const daily = userData?.daily_goal_progress ?? 0;
  const goal = userData?.daily_goal_target ?? 5;
  const startXP = xpForLevel(level);
  const nextXP = xpForLevel(level + 1);
  const xpPct = Math.min(
    100,
    Math.max(0, ((xp - startXP) / (nextXP - startXP)) * 100),
  );
  const dailyPct = Math.min(100, (daily / goal) * 100);
  const allConcepts = masteryData?.concepts ?? [];
  const conceptsToShow = showAllConcepts
    ? allConcepts
    : allConcepts.slice(0, 6);
  const hasMoreConcepts = allConcepts.length > 6;
  const dueToday = reviewStats?.due_today ?? 0;

  if (loading)
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Skeleton Navbar */}
        <nav className="glass sticky top-0 z-50 border-b border-white/5 h-14" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Skeleton header */}
          <div className="space-y-2">
            <div className="h-9 w-64 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
          </div>

          {/* Skeleton stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="glass p-4 rounded-xl border border-white/10 space-y-2"
              >
                <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                <div className="h-7 w-12 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Skeleton XP + daily goal bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="glass p-5 rounded-xl border border-white/10 space-y-3"
              >
                <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
                <div className="h-2.5 w-full bg-white/5 rounded-full animate-pulse" />
              </div>
            ))}
          </div>

          {/* Skeleton concept grid */}
          <div>
            <div className="h-5 w-40 bg-white/5 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="glass p-5 rounded-xl border border-white/8 space-y-3"
                >
                  <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, j) => (
                      <div
                        key={j}
                        className="h-1 flex-1 bg-white/5 rounded-full animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[5%]  right-[5%]  w-[500px] h-[500px] bg-cyan-500/4   rounded-full blur-[140px]" />
        <div className="absolute bottom-[5%] left-[5%]  w-[400px] h-[400px] bg-purple-600/4 rounded-full blur-[120px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="glass sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo → landing */}
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

            <div className="flex items-center gap-2">
              {/* Streak pill */}
              {streak > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-950/40 border border-orange-800/50 text-orange-400 text-xs font-bold">
                  🔥 {streak} day streak
                </div>
              )}
              {/* Review badge */}
              {dueToday > 0 && (
                <Link to="/review">
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/50 border border-amber-700/60 text-amber-400 text-xs font-bold"
                  >
                    📚 {dueToday} due
                  </motion.div>
                </Link>
              )}
              {/* User */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-sm text-gray-300">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-white/5 ml-1"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Welcome header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
              {getGreeting()}, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              {streak > 0
                ? `You're on a ${streak}-day streak. Don't break it!`
                : "Start a session to begin your streak."}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {dueToday > 0 && (
              <Link
                to="/review"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-400 font-bold text-sm hover:bg-amber-950/60 transition-all"
              >
                📚 Review {dueToday} due
              </Link>
            )}
            <Link
              to="/learn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm shadow-[0_0_20px_rgba(0,243,255,0.25)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] hover:-translate-y-0.5 transition-all"
            >
              ⚡ Start Learning
            </Link>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Level",
              value: level,
              sub: `${xp} XP`,
              icon: "🏆",
              color: "text-yellow-400",
              border: "border-yellow-900/40",
            },
            {
              label: "Day Streak",
              value: streak > 0 ? `🔥 ${streak}` : "0",
              sub:
                streak >= 7
                  ? "You're on fire!"
                  : streak > 0
                    ? "Keep going!"
                    : "Start today!",
              icon: null,
              color: streak > 0 ? "text-orange-400" : "text-gray-500",
              border: streak > 0 ? "border-orange-900/40" : "border-white/10",
            },
            {
              label: "Daily Goal",
              value: `${daily}/${goal}`,
              sub: daily >= goal ? "🎉 Complete!" : `${goal - daily} to go`,
              icon: "🎯",
              color: daily >= goal ? "text-green-400" : "text-white",
              border: daily >= goal ? "border-green-900/40" : "border-white/10",
            },
            {
              label: "Concepts",
              value: masteryData?.total_concepts ?? 0,
              sub: "mastered",
              icon: "🧠",
              color: "text-cyan-300",
              border: "border-white/10",
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className={`glass p-4 rounded-xl border ${s.border} flex flex-col gap-1`}
            >
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {s.label}
              </span>
              <p className={`text-2xl font-bold font-heading ${s.color}`}>
                {s.value}
              </p>
              <p className="text-xs text-gray-600">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── XP bar + Daily goal bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* XP bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-5 rounded-xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Level {level} Progress
                </p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {xp}{" "}
                  <span className="text-sm text-gray-500 font-normal">
                    / {nextXP} XP
                  </span>
                </p>
              </div>
              <div className="text-2xl">🏆</div>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-700">Lv {level}</span>
              <span className="text-[10px] text-gray-700">
                Lv {level + 1} ({nextXP} XP)
              </span>
            </div>
          </motion.div>

          {/* Daily goal bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass p-5 rounded-xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Daily Goal
                </p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {daily}{" "}
                  <span className="text-sm text-gray-500 font-normal">
                    / {goal} questions
                  </span>
                </p>
              </div>
              <div className="text-2xl">{daily >= goal ? "🎉" : "🎯"}</div>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${daily >= goal ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${dailyPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.45 }}
              />
            </div>
            {daily >= goal ? (
              <p className="text-xs text-green-400 font-bold mt-1.5">
                🎉 Goal complete! Come back tomorrow.
              </p>
            ) : (
              <p className="text-xs text-gray-700 mt-1.5">
                {goal - daily} more question{goal - daily !== 1 ? "s" : ""} to
                hit your goal
              </p>
            )}
          </motion.div>
        </div>

        {/* ── Mastery grid ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white font-heading">
              📊 Concept Mastery
            </h2>
            <Link
              to="/learn"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Practice all →
            </Link>
          </div>

          {allConcepts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {conceptsToShow.map((c, i) => {
                  const colors =
                    BLOOM_COLORS[c.current_level] || BLOOM_COLORS.remember;
                  return (
                    <motion.div
                      key={c.concept}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                    >
                      <Link
                        to={`/learn?concept=${encodeURIComponent(c.concept)}`}
                        className="block glass p-5 rounded-xl border border-white/8 hover:border-white/20 hover:scale-[1.02] transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white capitalize truncate group-hover:text-cyan-300 transition-colors">
                              {c.concept.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.total_attempts} attempts · {c.accuracy}%
                              accuracy
                            </p>
                          </div>
                          <span
                            className={`ml-2 shrink-0 px-2 py-0.5 text-xs font-bold rounded-full border ${colors.badge}`}
                          >
                            {c.current_level}
                          </span>
                        </div>

                        {/* Bloom ladder */}
                        <div className="flex gap-1 mb-2">
                          {[
                            "remember",
                            "understand",
                            "apply",
                            "analyze",
                            "evaluate",
                            "create",
                          ].map((lvl, li) => (
                            <div
                              key={lvl}
                              className={`h-1 flex-1 rounded-full transition-all ${li < c.level_number ? `bg-gradient-to-r ${colors.bar}` : "bg-white/5"}`}
                              title={lvl}
                            />
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                          <span>Bloom level {c.level_number}/6</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleConceptMap(c.concept);
                            }}
                            className="text-cyan-600 hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
                          >
                            {expandedConcept === c.concept
                              ? "Hide map"
                              : "Concept map"}
                          </button>
                        </div>

                        {expandedConcept === c.concept && (
                          <div className="mt-3">
                            {conceptMapLoading && !conceptMaps[c.concept] ? (
                              <p className="text-[11px] text-gray-500">
                                Loading concept pathway…
                              </p>
                            ) : (
                              <ConceptMap
                                concept={c.concept}
                                prerequisites={
                                  conceptMaps[c.concept]?.prerequisites || []
                                }
                                successors={
                                  conceptMaps[c.concept]?.successors || []
                                }
                                related={conceptMaps[c.concept]?.related || []}
                              />
                            )}
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              {hasMoreConcepts && (
                <button
                  type="button"
                  onClick={() => setShowAllConcepts((prev) => !prev)}
                  className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {showAllConcepts
                    ? "Show less"
                    : `Show more (${allConcepts.length - 6} more)`}
                </button>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl border border-dashed border-white/10 p-12 text-center"
            >
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-gray-400 font-medium">No mastery data yet</p>
              <p className="text-gray-600 text-sm mt-1 mb-5">
                Answer your first question to start tracking progress
              </p>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm shadow-[0_0_20px_rgba(0,243,255,0.25)] hover:-translate-y-0.5 transition-all"
              >
                ⚡ Start Learning
              </Link>
            </motion.div>
          )}
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8">
          {[
            {
              icon: "⚡",
              title: "Adaptive Quiz",
              desc: "Questions matched to your current mastery level",
              to: "/learn",
              color: "from-cyan-500/10 to-blue-600/5",
              border: "border-cyan-800/30",
              cta: "Start Quiz →",
              ctaColor: "text-cyan-400",
            },
            {
              icon: "📚",
              title: "Review Session",
              desc: `${dueToday > 0 ? `${dueToday} questions due` : "Spaced repetition review"}`,
              to: "/review",
              color: "from-amber-500/10 to-orange-600/5",
              border: "border-amber-800/30",
              cta: "Start Review →",
              ctaColor: "text-amber-400",
            },
            {
              icon: "🎯",
              title: "Track Progress",
              desc: "See your mastery heatmap and Bloom levels",
              to: "/learn",
              color: "from-purple-500/10 to-indigo-600/5",
              border: "border-purple-800/30",
              cta: "View Progress →",
              ctaColor: "text-purple-400",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <Link
                to={card.to}
                className={`block glass p-5 rounded-xl border ${card.border} bg-gradient-to-br ${card.color} hover:scale-[1.02] transition-all group`}
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="font-bold text-white mb-1">{card.title}</h3>
                <p className="text-gray-500 text-xs mb-3">{card.desc}</p>
                <span
                  className={`text-xs font-bold ${card.ctaColor} group-hover:underline`}
                >
                  {card.cta}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
