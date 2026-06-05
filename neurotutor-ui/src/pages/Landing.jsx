import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// ── Animation helpers ──────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: "easeOut" },
});

// ── Data ───────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🧠",
    title: "Neuro-Adaptive AI",
    desc: "Questions are dynamically matched to your Zone of Proximal Development — always challenging, never overwhelming.",
    color: "from-cyan-500/20 to-blue-600/10",
    border: "border-cyan-800/40",
    glow: "shadow-[0_0_30px_rgba(0,243,255,0.08)]",
  },
  {
    icon: "⏳",
    title: "Spaced Repetition (SM-2)",
    desc: "Reviews are scheduled at the exact moment you're about to forget — proven to improve retention by 4×.",
    color: "from-purple-500/20 to-indigo-600/10",
    border: "border-purple-800/40",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.08)]",
  },
  {
    icon: "💬",
    title: "Socratic AI Tutor",
    desc: "Never just told the answer. The AI guides you with questions, hints, and explanations tailored to your bloom level.",
    color: "from-emerald-500/20 to-teal-600/10",
    border: "border-emerald-800/40",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.08)]",
  },
  {
    icon: "🎮",
    title: "Gamified Progress",
    desc: "Earn XP, maintain daily streaks, and climb the leaderboard. Learning feels like a game, not a chore.",
    color: "from-amber-500/20 to-orange-600/10",
    border: "border-amber-800/40",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.08)]",
  },
  {
    icon: "📊",
    title: "Bloom's Taxonomy Mastery",
    desc: "Track your progress across all 6 cognitive levels — from Remember to Create — for every concept.",
    color: "from-rose-500/20 to-pink-600/10",
    border: "border-rose-800/40",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.08)]",
  },
  {
    icon: "🔍",
    title: "Semantic Answer Grading",
    desc: "Your answers are graded on conceptual understanding, not exact wording. Express yourself naturally.",
    color: "from-sky-500/20 to-blue-600/10",
    border: "border-sky-800/40",
    glow: "shadow-[0_0_30px_rgba(14,165,233,0.08)]",
  },
];

const STATS = [
  { value: "6", label: "Bloom Levels", sub: "per concept" },
  { value: "SM-2", label: "Algorithm", sub: "spaced repetition" },
  { value: "4×", label: "Better Retention", sub: "vs passive reading" },
  { value: "∞", label: "Questions", sub: "AI-generated" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Answer Questions",
    desc: "Tackle adaptive questions matched to your current mastery level.",
  },
  {
    step: "02",
    title: "Get AI Feedback",
    desc: "Receive Socratic hints and semantic grading — not just right/wrong.",
  },
  {
    step: "03",
    title: "Track Mastery",
    desc: "Watch your Bloom level progress across every concept in real time.",
  },
  {
    step: "04",
    title: "Review & Retain",
    desc: "SM-2 schedules reviews before you forget. Knowledge sticks for life.",
  },
];

// ── Animated counter ───────────────────────────────────────────────────────
const AnimatedStat = ({ value, label, sub }) => (
  <motion.div
    {...fadeUp(0.1)}
    className="text-center px-6 py-8 glass rounded-2xl border border-white/8 hover:border-white/15 transition-colors"
  >
    <div className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 font-heading mb-1">
      {value}
    </div>
    <div className="text-white font-semibold text-sm uppercase tracking-wider">
      {label}
    </div>
    <div className="text-gray-500 text-xs mt-0.5">{sub}</div>
  </motion.div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden">
      {/* ── Background ── */}
      <div className="fixed inset-0 z-[-2] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,243,255,0.08),transparent)]" />
      <div className="fixed top-[15%] right-[5%]  w-[600px] h-[600px] bg-cyan-500/5   rounded-full blur-[140px] z-[-1]" />
      <div className="fixed bottom-[10%] left-[5%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] z-[-1]" />
      <div className="fixed top-[60%] right-[20%] w-[300px] h-[300px] bg-blue-500/5   rounded-full blur-[100px] z-[-1]" />

      {/* ── Navbar ── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b border-white/8 shadow-lg shadow-black/20" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center text-black font-black text-lg shadow-lg shadow-cyan-500/30">
                N
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-heading tracking-tight">
                NeuroTutor
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-sm text-gray-400 hover:text-white font-medium transition-colors rounded-lg hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-32 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Mastery Learning
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tight leading-[1.05] font-heading">
            Learn Smarter.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500">
              Forget Nothing.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            NeuroTutor adapts to your knowledge gaps in real time, grades
            answers semantically, and uses spaced repetition to make sure you
            retain everything — forever.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-lg font-bold px-8 py-4 rounded-xl shadow-[0_0_40px_rgba(0,243,255,0.35)] hover:shadow-[0_0_60px_rgba(0,243,255,0.5)] transition-all hover:-translate-y-1"
            >
              Start Learning Free
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 text-white font-medium transition-all hover:-translate-y-0.5"
            >
              Continue Learning
            </Link>
          </div>
        </motion.div>

        {/* Hero visual — mock terminal/quiz card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-20 max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-gray-600 font-mono">
                neurotutor — quiz session
              </span>
            </div>
            <div className="p-6 text-left space-y-4">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 text-xs font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-800 rounded-full">
                  functions
                </span>
                <span className="px-2 py-0.5 text-xs font-bold text-purple-300 bg-purple-950/50 border border-purple-800 rounded-full">
                  Apply
                </span>
              </div>
              <p className="text-white font-semibold text-lg">
                What is the difference between a parameter and an argument in
                Python?
              </p>
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-gray-400 text-sm font-mono">
                A parameter is the variable in the function definition, while an
                argument is the actual value passed when calling it.
              </div>
              <div className="flex items-start gap-3 bg-green-950/20 border-l-4 border-green-500/50 p-4 rounded-r-xl">
                <span className="text-green-400 text-xl">✅</span>
                <div>
                  <p className="text-green-400 font-bold text-sm">
                    Correct — Your answer accurately captures the distinction.
                  </p>
                  <p className="text-green-200/60 text-xs mt-1">
                    +10 XP · Mastery: Apply → Analyze
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <AnimatedStat key={i} {...s} />
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-500">
            The Method
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 font-heading">
            How NeuroTutor Works
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={i} {...fadeUp(i * 0.1)} className="relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-10" />
              )}
              <div className="glass p-6 rounded-2xl border border-white/8 hover:border-white/15 transition-all h-full">
                <div className="text-3xl font-black text-white/10 font-heading mb-3">
                  {step.step}
                </div>
                <h3 className="text-white font-bold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 font-heading">
            Everything You Need to Master Any Subject
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.08)}
              className={`relative p-6 rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} ${f.glow} hover:scale-[1.02] transition-transform cursor-default`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <motion.div
          {...fadeUp()}
          className="glass rounded-3xl border border-white/10 p-12 relative overflow-hidden shadow-[0_0_80px_rgba(0,243,255,0.06)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 z-0" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 font-heading">
              Ready to Learn Smarter?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join NeuroTutor and start building knowledge that actually sticks.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-lg font-bold px-10 py-4 rounded-xl shadow-[0_0_40px_rgba(0,243,255,0.4)] hover:shadow-[0_0_60px_rgba(0,243,255,0.6)] transition-all hover:-translate-y-1"
            >
              Get Started — It's Free
              <span>→</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-black font-black text-xs">
            N
          </div>
          <span className="text-gray-500 text-sm font-medium">NeuroTutor</span>
        </div>
        <p className="text-gray-700 text-xs">
          Built for the AI Championship Cup · 2026
        </p>
      </footer>
    </div>
  );
};

export default Landing;
