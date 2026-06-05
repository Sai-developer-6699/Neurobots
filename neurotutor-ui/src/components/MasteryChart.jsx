import React from "react";
import { motion } from "framer-motion";

const BLOOM_LEVELS = {
  remember: { label: "Remember", color: "bg-blue-500", order: 1 },
  understand: { label: "Understand", color: "bg-green-500", order: 2 },
  apply: { label: "Apply", color: "bg-yellow-500", order: 3 },
  analyze: { label: "Analyze", color: "bg-orange-500", order: 4 },
  evaluate: { label: "Evaluate", color: "bg-red-500", order: 5 },
  create: { label: "Create", color: "bg-purple-500", order: 6 },
};

const MasteryChart = ({ concepts }) => {
  if (!concepts || concepts.length === 0) {
    return (
      <div className="glass p-6 rounded-xl border border-white/10">
        <p className="text-gray-400 text-center">
          No mastery data yet. Start learning!
        </p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl space-y-6 border border-white/10 backdrop-blur-md">
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 font-heading">
        📊 Mastery Progress
      </h3>

      <div className="space-y-6">
        {concepts.map((concept, idx) => (
          <motion.div
            key={concept.concept}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-2"
          >
            {/* Concept Header */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-white capitalize flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                {concept.concept.replace(/_/g, " ")}
              </span>
              <span className="text-sm text-gray-400 font-mono">
                {concept.accuracy.toFixed(0)}%{" "}
                <span className="text-gray-600">
                  ({concept.total_attempts} attempts)
                </span>
              </span>
            </div>

            {/* Bloom Level Progress */}
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_10px_rgba(0,255,255,0.3)]`}
                initial={{ width: 0 }}
                animate={{ width: `${(concept.level_number / 6) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider">
              <span>
                Level:{" "}
                <span
                  className={
                    BLOOM_LEVELS[concept.current_level]?.color.replace(
                      "bg-",
                      "text-",
                    ) || "text-white"
                  }
                >
                  {BLOOM_LEVELS[concept.current_level]?.label ||
                    concept.current_level}
                </span>
              </span>
              <span>{concept.level_number} / 6</span>
            </div>

            {/* Visual Bloom Ladder (Optional - Mini Blocks) */}
            <div className="flex gap-1 mt-1 opacity-50">
              {Object.entries(BLOOM_LEVELS)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([level, info]) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-sm ${
                      info.order <= concept.level_number
                        ? info.color
                        : "bg-white/5"
                    }`}
                    title={info.label}
                  />
                ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MasteryChart;
