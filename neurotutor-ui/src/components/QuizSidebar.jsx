import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Book,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuizSidebar = ({
  isOpen,
  onToggle,
  reviewStats,
  userData,
  agentLatencies,
  conceptMap,
  showTerminal,
  setShowTerminal,
  onDashboardClick,
}) => {
  const navigate = useNavigate();
  
  const sidebarVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 glass border border-white/10 rounded-l-xl p-2 sm:p-3 transition-all ${
          isOpen ? "right-64 lg:right-80 xl:right-96" : "right-0"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-64 lg:w-80 xl:w-96 glass border-l border-white/10 z-30 overflow-y-auto"
          >
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Header */}
              <motion.div
                variants={contentVariants}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between"
              >
                <h3 className="text-lg font-semibold text-white">Dashboard</h3>
                <button
                  onClick={onToggle}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </motion.div>

              {/* User Profile */}
              <motion.div
                variants={contentVariants}
                transition={{ delay: 0.2 }}
                className="glass p-4 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center text-black font-bold">
                    {userData?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {userData?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Level {userData?.level || 1}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-cyan-400">
                      {userData?.xp || 0}
                    </p>
                    <p className="text-xs text-gray-500">XP</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-400">
                      {userData?.streak_days || 0}
                    </p>
                    <p className="text-xs text-gray-500">Streak</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">
                      {userData?.daily_goal_progress || 0}/5
                    </p>
                    <p className="text-xs text-gray-500">Daily</p>
                  </div>
                </div>
              </motion.div>

              {/* Review Queue */}
              {reviewStats && (
                <motion.div
                  variants={contentVariants}
                  transition={{ delay: 0.4 }}
                  className="glass p-4 rounded-xl border border-amber-800/50 bg-amber-950/20"
                >
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">
                    Review Due
                  </h4>
                  <p className="text-2xl font-bold text-white mb-1">
                    {reviewStats.due_today}
                  </p>
                  <p className="text-xs text-amber-600">
                    questions need review
                  </p>
                </motion.div>
              )}

              {/* Agent Activity */}
              {agentLatencies && (
                <motion.div
                  variants={contentVariants}
                  transition={{ delay: 0.5 }}
                  className="glass p-4 rounded-xl border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-300">
                      Agent Activity
                    </h4>
                    <button
                      onClick={() => setShowTerminal(!showTerminal)}
                      className="text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      {showTerminal ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(agentLatencies).map(([agent, latency]) => (
                      <div
                        key={agent}
                        className="flex justify-between items-center text-xs"
                      >
                        <span className="text-gray-400 capitalize">
                          {agent.replace("Agent", "")}
                        </span>
                        <span
                          className={`font-mono ${latency < 500 ? "text-green-400" : latency < 1000 ? "text-yellow-400" : "text-red-400"}`}
                        >
                          {latency}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Concept Map */}
              {conceptMap && (
                <motion.div
                  variants={contentVariants}
                  transition={{ delay: 0.6 }}
                  className="glass p-4 rounded-xl border border-white/10"
                >
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">
                    Learning Path
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">Prerequisites:</p>
                      <div className="flex flex-wrap gap-1">
                        {conceptMap.prerequisites?.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs"
                          >
                            {c.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Current:</p>
                      <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs font-medium">
                        {conceptMap.concept?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Next steps:</p>
                      <div className="flex flex-wrap gap-1">
                        {conceptMap.successors?.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs"
                          >
                            {c.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                variants={contentVariants}
                transition={{ delay: 0.7 }}
                className="space-y-4 pt-4 border-t border-white/10"
              >
                <button
                  onClick={() => navigate("/review")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white font-medium hover:from-blue-500 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  <span>📝</span>
                  <span>Review Center</span>
                </button>
                <button
                  onClick={() => {
                    if (onDashboardClick) onDashboardClick();
                    navigate("/dashboard");
                  }}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-all text-sm"
                >
                  📊 Full Dashboard
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 xl:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default QuizSidebar;
