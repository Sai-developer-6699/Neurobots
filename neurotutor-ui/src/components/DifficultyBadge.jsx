import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const BADGE_STYLES = {
  advance: {
    icon: "🚀",
    title: "Level Up!",
    color: "bg-gradient-to-r from-green-500 to-emerald-500",
    textColor: "text-white",
  },
  remediate: {
    icon: "📚",
    title: "Review Time",
    color: "bg-gradient-to-r from-yellow-500 to-orange-500",
    textColor: "text-white",
  },
  stay: {
    icon: "✨",
    title: "Keep Going!",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    textColor: "text-white",
  },
  mastered: {
    icon: "🎉",
    title: "Mastered!",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    textColor: "text-white",
  },
};

export default function DifficultyBadge({ recommendation, onDismiss }) {
  if (!recommendation) return null;

  const style = BADGE_STYLES[recommendation.action] || BADGE_STYLES.stay;

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-20 right-4 z-50 max-w-sm"
      >
        <div
          className={`${style.color} ${style.textColor} p-4 rounded-xl shadow-2xl glass`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span className="text-4xl">{style.icon}</span>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{style.title}</h3>
              <p className="text-sm opacity-90 mb-2">{recommendation.reason}</p>

              {recommendation.action === "advance" && (
                <div className="text-xs opacity-75">
                  Advancing to:{" "}
                  <span className="font-bold capitalize">
                    {recommendation.suggested_bloom_level}
                  </span>{" "}
                  level
                </div>
              )}

              {recommendation.action === "remediate" && (
                <div className="text-xs opacity-75">
                  Reviewing:{" "}
                  <span className="font-bold capitalize">
                    {recommendation.suggested_bloom_level}
                  </span>{" "}
                  level concepts
                </div>
              )}

              {recommendation.accuracy !== undefined && (
                <div className="text-xs opacity-75 mt-1">
                  Recent accuracy: {Math.round(recommendation.accuracy * 100)}%
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
