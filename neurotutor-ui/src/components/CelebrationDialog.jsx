import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Confetti particle ────────────────────────────────────────────────────────
const COLORS = [
  "#00f3ff",
  "#a855f7",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#3b82f6",
  "#fbbf24",
  "#34d399",
];

const Particle = ({ x, color, delay, size, angle, distance }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: `calc(50% + ${x}px)`,
      top: "50%",
      width: size,
      height: size,
      backgroundColor: color,
    }}
    initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
    animate={{
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: 0,
      scale: 0,
      rotate: Math.random() * 720 - 360,
    }}
    transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: "easeOut" }}
  />
);

const generateParticles = (count = 60) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 20,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.3,
    size: 6 + Math.random() * 8,
    angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
    distance: 80 + Math.random() * 160,
  }));

// ── Main dialog ──────────────────────────────────────────────────────────────
/**
 * CelebrationDialog
 * Props:
 *   isOpen       – boolean
 *   onClose      – () => void
 *   type         – 'goal' | 'streak' | 'levelup'
 *   streakDays   – number (for streak type)
 *   level        – number (for levelup type)
 *   xpBonus      – number (optional bonus XP to show)
 */
const CelebrationDialog = ({
  isOpen,
  onClose,
  type = "goal",
  streakDays,
  level,
  xpBonus,
}) => {
  const timerRef = useRef(null);
  const particles = useRef(generateParticles(70)).current;

  // Auto-close after 4 s
  useEffect(() => {
    if (isOpen) {
      timerRef.current = setTimeout(onClose, 4000);
    }
    return () => clearTimeout(timerRef.current);
  }, [isOpen, onClose]);

  const content =
    {
      goal: {
        emoji: "🎯",
        title: "Daily Goal Complete!",
        sub: `You answered ${5} questions today.`,
        bonus: xpBonus ? `+${xpBonus} Bonus XP` : "+50 Bonus XP",
        color: "from-cyan-500/20 to-blue-600/10",
        border: "border-cyan-500/30",
        glow: "shadow-[0_0_60px_rgba(0,243,255,0.2)]",
      },
      streak: {
        emoji: "🔥",
        title: `${streakDays}-Day Streak!`,
        sub:
          streakDays >= 7
            ? "You're absolutely on fire!"
            : "Keep the momentum going!",
        bonus: null,
        color: "from-orange-500/20 to-red-600/10",
        border: "border-orange-500/30",
        glow: "shadow-[0_0_60px_rgba(249,115,22,0.2)]",
      },
      levelup: {
        emoji: "🏆",
        title: `Level ${level} Reached!`,
        sub: "Your knowledge is growing fast.",
        bonus: null,
        color: "from-yellow-500/20 to-amber-600/10",
        border: "border-yellow-500/30",
        glow: "shadow-[0_0_60px_rgba(234,179,8,0.2)]",
      },
    }[type] || content?.goal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none px-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`relative pointer-events-auto w-full max-w-sm glass rounded-3xl border ${content.border} bg-gradient-to-br ${content.color} ${content.glow} p-8 text-center overflow-hidden`}
            >
              {/* Confetti burst */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                {particles.map((p) => (
                  <Particle key={p.id} {...p} />
                ))}
              </div>

              {/* Emoji bounce */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: [0, 1.3, 1], rotate: [0, 10, -5, 0] }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-7xl mb-4 relative z-10"
              >
                {content.emoji}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-white font-heading mb-2 relative z-10"
              >
                {content.title}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-sm mb-4 relative z-10"
              >
                {content.sub}
              </motion.p>

              {/* Bonus XP badge */}
              {content.bonus && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold text-sm mb-5 relative z-10"
                >
                  ⚡ {content.bonus}
                </motion.div>
              )}

              {/* Dismiss button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={onClose}
                className="relative z-10 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all"
              >
                Keep Learning 🚀
              </motion.button>

              {/* Auto-close progress bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-white/20 rounded-b-3xl"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CelebrationDialog;
