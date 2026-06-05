import React, { useEffect, useState } from "react";
import { questionAPI } from "../services/api";
import { motion } from "framer-motion";

const GamificationPanel = ({ userData }) => {
  // userData contains { xp, level, streak_days, daily_goal_progress } passed from Dashboard
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await questionAPI.getLeaderboard();
        setLeaderboard(res.data);
      } catch (error) {
        console.error("Failed leaderboard", error);
      }
    };
    fetchLeaderboard();
  }, []);

  // Derived level stats for progress bar
  // Formula: Level = floor(0.1 * sqrt(XP)) + 1
  // Reversing for progress:
  // Current Level Min XP = ((Level - 1) / 0.1)^2
  // Next Level Min XP = (Level / 0.1)^2

  // Example: Lvl 1 (0 XP) -> Lvl 2 (100 XP)
  // XP = 50. Progress = 50%
  const currentLevel = userData?.level || 1;
  const currentXP = userData?.xp || 0;

  const xpForLevel = (lvl) => Math.pow((lvl - 1) * 10, 2);
  const startXP = xpForLevel(currentLevel);
  const nextXP = xpForLevel(currentLevel + 1);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentXP - startXP) / (nextXP - startXP)) * 100),
  );

  return (
    <div className="space-y-6">
      {/* XP & Level Card */}
      <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🏆</div>

        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="text-gray-400 text-sm uppercase tracking-wider">
              Level {currentLevel}
            </h3>
            <p className="text-2xl font-bold text-white">
              {currentXP}{" "}
              <span className="text-sm text-gray-500">/ {nextXP} XP</span>
            </p>
          </div>
        </div>

        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
          />
        </div>
      </div>

      {/* Daily Goal & Streak */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4 rounded-xl border border-white/10 text-center">
          <h4 className="text-gray-400 text-xs uppercase mb-1">Daily Goal</h4>
          <div className="text-2xl font-bold text-white flex justify-center items-center gap-2">
            <span>{userData?.daily_goal_progress || 0}</span>
            <span className="text-gray-500 text-lg">/ 5</span>
          </div>
          {userData?.daily_goal_progress >= 5 && (
            <p className="text-xs text-green-400 mt-1">Completed! 🎉</p>
          )}
        </div>
        <div className="glass p-4 rounded-xl border border-white/10 text-center">
          <h4 className="text-gray-400 text-xs uppercase mb-1">Day Streak</h4>
          <div className="text-2xl font-bold text-orange-400 flex justify-center items-center gap-2">
            🔥 {userData?.streak_days || 0}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass p-6 rounded-xl border border-white/10">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">
          Leaderboard
        </h3>
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Join the competition!
            </p>
          ) : (
            leaderboard.map((user, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold w-4 ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-orange-400" : "text-gray-600"}`}
                  >
                    #{index + 1}
                  </span>
                  <span className="text-white">{user.username}</span>
                </div>
                <span className="text-primary font-mono">{user.xp} XP</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;
