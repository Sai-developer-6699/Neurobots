import React from "react";
import { motion } from "framer-motion";

const QUALITY_OPTIONS = [
  {
    value: 5,
    label: "Easy",
    emoji: "⚡",
    color: "bg-green-600",
    desc: "Perfect recall",
  },
  {
    value: 4,
    label: "Good",
    emoji: "✅",
    color: "bg-blue-600",
    desc: "Correct with hesitation",
  },
  {
    value: 3,
    label: "Hard",
    emoji: "🤔",
    color: "bg-yellow-600",
    desc: "Difficult but correct",
  },
  {
    value: 0,
    label: "Again",
    emoji: "😰",
    color: "bg-red-600",
    desc: "Need to review again",
  },
];

const QualityRating = ({ onRate }) => {
  return (
    <div className="mt-8 glass p-6 rounded-xl border border-white/10 animate-fade-in">
      <p className="text-gray-400 mb-6 text-center text-lg">
        How well did you know this answer?
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUALITY_OPTIONS.map((option, idx) => (
          <motion.button
            key={option.value}
            onClick={() => onRate(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${option.color} p-6 rounded-xl text-white font-medium
                       hover:opacity-90 transition-opacity flex flex-col items-center gap-2 shadow-lg`}
          >
            <div className="text-4xl mb-1">{option.emoji}</div>
            <div className="text-lg font-bold">{option.label}</div>
            <div className="text-xs opacity-75 text-center leading-tight">
              {option.desc}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QualityRating;
