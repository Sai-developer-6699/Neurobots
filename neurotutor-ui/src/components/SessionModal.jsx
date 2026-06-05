import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questionAPI } from "../services/api";

/**
 * SessionModal
 * ─────────────
 * Shows the user's current session stats:
 *   • Streak (days)
 *   • Questions answered today (correct / wrong)
 *   • Spaced repetition reminders (questions due for review)
 *   • Recent wrong answers that need reinforcement
 *
 * Props:
 *   isOpen   – boolean
 *   onClose  – () => void
 *   userData – object from gamification/me endpoint (xp, streak_days, etc.)
 */
const SessionModal = ({ isOpen, onClose, userData }) => {
  const [sessionData, setSessionData] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    fetchSessionData();
  }, [isOpen]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const [statsRes, reviewRes] = await Promise.all([
        questionAPI.getUserStats(),
        questionAPI.getReviewQueue(5),
      ]);
      setSessionData(statsRes.data);
      setReviewQueue(reviewRes.data?.questions || []);
    } catch (err) {
      console.error("SessionModal fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Merge live fetched data with prop userData (prop is optimistically updated)
  const stats = sessionData || userData || {};
  const streak = stats.streak_days ?? 0;
  const xp = stats.xp ?? 0;
  const level = stats.level ?? 1;
  const answeredToday = stats.daily_goal_progress ?? 0;
  const dailyGoal = 10; // configurable later
  const goalPct = Math.min(100, Math.round((answeredToday / dailyGoal) * 100));

  // Streak fire colour
  const streakColor =
    streak >= 7
      ? "text-orange-400"
      : streak >= 3
        ? "text-amber-400"
        : "text-gray-400";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                                   w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl
                                   shadow-[0_0_60px_rgba(0,243,255,0.08)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h2 className="text-lg font-bold text-white font-heading tracking-tight">
                  Session Overview
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* ── Row 1: Streak + XP + Level ── */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    icon="🔥"
                    label="Streak"
                    value={`${streak}d`}
                    valueClass={streakColor}
                    sub={
                      streak === 0
                        ? "Start today!"
                        : streak === 1
                          ? "1 day"
                          : `${streak} days`
                    }
                  />
                  <StatCard
                    icon="⚡"
                    label="XP"
                    value={xp.toLocaleString()}
                    valueClass="text-cyan-300"
                    sub={`Level ${level}`}
                  />
                  <StatCard
                    icon="🎯"
                    label="Today"
                    value={`${answeredToday}/${dailyGoal}`}
                    valueClass="text-purple-300"
                    sub="questions"
                  />
                </div>

                {/* ── Daily Goal Progress Bar ── */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Daily Goal Progress</span>
                    <span className="text-cyan-400 font-semibold">
                      {goalPct}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goalPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        goalPct >= 100
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600"
                      }`}
                    />
                  </div>
                  {goalPct >= 100 && (
                    <p className="text-xs text-green-400 mt-1 text-center font-semibold">
                      🎉 Daily goal complete!
                    </p>
                  )}
                </div>

                {/* ── Spaced Repetition Reminders ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                      📚 Due for Review
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        reviewQueue.length > 0
                          ? "bg-amber-900/50 text-amber-400 border border-amber-700"
                          : "bg-green-900/30 text-green-400 border border-green-800"
                      }`}
                    >
                      {reviewQueue.length > 0
                        ? `${reviewQueue.length} due`
                        : "All caught up!"}
                    </span>
                  </div>

                  {reviewQueue.length === 0 ? (
                    <div className="text-center py-4 text-gray-600 text-sm">
                      ✨ No reviews due right now. Keep it up!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {reviewQueue.map((item, idx) => (
                        <ReviewItem key={item.id ?? idx} item={item} />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Streak Warning ── */}
                {streak === 0 && (
                  <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-red-300">
                        No streak yet
                      </p>
                      <p className="text-xs text-red-400/70">
                        Answer a question today to start your streak!
                      </p>
                    </div>
                  </div>
                )}

                {streak > 0 && streak < 3 && (
                  <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">
                        {streak}-day streak!
                      </p>
                      <p className="text-xs text-amber-400/70">
                        Keep going — 7 days unlocks a bonus!
                      </p>
                    </div>
                  </div>
                )}

                {streak >= 7 && (
                  <div className="bg-orange-950/20 border border-orange-700/40 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="text-sm font-semibold text-orange-300">
                        {streak}-day streak! You're on fire!
                      </p>
                      <p className="text-xs text-orange-400/70">
                        Incredible consistency. Don't break the chain!
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Close Button ── */}
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10
                                               text-gray-300 font-semibold text-sm transition-all hover:text-white"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, valueClass, sub }) => (
  <div className="bg-white/3 border border-white/8 rounded-xl p-3 text-center hover:border-white/15 transition-colors">
    <div className="text-xl mb-1">{icon}</div>
    <div className={`text-xl font-bold font-heading ${valueClass}`}>
      {value}
    </div>
    <div className="text-xs text-gray-500 mt-0.5">{sub || label}</div>
  </div>
);

const ReviewItem = ({ item }) => (
  <div className="flex items-start gap-3 bg-amber-950/20 border border-amber-900/30 rounded-lg px-3 py-2">
    <span className="text-amber-400 mt-0.5 text-sm">📖</span>
    <div className="min-w-0">
      <p className="text-xs text-white font-medium truncate">{item.text}</p>
      <div className="flex gap-2 mt-0.5">
        {item.concept && (
          <span className="text-[10px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded-full border border-cyan-900">
            {item.concept}
          </span>
        )}
        {item.bloom_level && (
          <span className="text-[10px] text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded-full border border-purple-900">
            {item.bloom_level}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default SessionModal;
