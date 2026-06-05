import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConceptMap from "./ConceptMap.jsx";
import QualityRating from "./QualityRating.jsx";

const MinimalQuiz = ({
  question,
  answer,
  onAnswerChange,
  onSubmit,
  onNextQuestion,
  onReviewQuestion,
  onSkipQuestion,
  isSubmitting,
  feedback,
  hint,
  hintCount,
  onGetHint,
  explanation,
  showExplanation,
  onGetExplanation,
  attemptCount,
  prerequisiteHint,
  conceptMap,
  showTerminal,
  setShowTerminal,
  agentLatencies,
  questionMode,
  onRateQuality,
  onMarkForReview,
  showReviewToast,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Debug log
  console.log("MinimalQuiz render - question:", question);
  console.log("MinimalQuiz render - question text:", question?.text);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim() && !isSubmitting) {
      onSubmit(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mode Indicator */}
      {questionMode && questionMode !== "normal" && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            questionMode === "review"
              ? "bg-blue-100 border-blue-300 text-blue-800"
              : "bg-orange-100 border-orange-300 text-orange-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                questionMode === "review" ? "bg-blue-500" : "bg-orange-500"
              }`}
            />
            <span className="font-medium">
              {questionMode === "review" ? "📝 Review Mode" : "⏭️ Skip Mode"}
            </span>
          </div>
          <div className="text-sm">
            {questionMode === "review"
              ? "Reviewing current question to understand concepts better"
              : "Skipping to next question without reviewing"}
          </div>
        </div>
      )}

      {!question ? (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden p-8 text-center">
          <div className="text-gray-400 mb-4">No question available</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-all"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <>
          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Question Header */}
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {question?.concept && (
                    <span className="px-3 py-1 text-xs font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-800 rounded-full uppercase tracking-wider">
                      {question.concept.replace(/_/g, " ")}
                    </span>
                  )}
                  {question?.bloom_level && (
                    <span className="px-3 py-1 text-xs font-bold text-purple-300 bg-purple-950/50 border border-purple-800 rounded-full uppercase tracking-wider">
                      {question.bloom_level}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  {attemptCount > 0
                    ? `Attempt ${attemptCount}`
                    : "First attempt"}
                </span>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6 sm:p-8">
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-relaxed"
              >
                {question?.text}
              </motion.h1>

              {/* Prerequisite Hint */}
              <AnimatePresence>
                {prerequisiteHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <div className="flex items-start gap-2 bg-indigo-950/30 border border-indigo-800/40 rounded-xl px-4 py-3">
                      <span className="text-indigo-400 text-sm mt-0.5">💡</span>
                      <p className="text-sm text-indigo-300/90">
                        {prerequisiteHint}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Concept Map */}
              <AnimatePresence>
                {conceptMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <ConceptMap
                      concept={question.concept}
                      prerequisites={conceptMap.prerequisites}
                      successors={conceptMap.successors}
                      related={conceptMap.related}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Answer Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <motion.textarea
                    value={answer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Type your answer here..."
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 resize-none transition-all ${
                      isFocused
                        ? "border-cyan-500/50 bg-white/10"
                        : "border-white/10 hover:border-white/20"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                    rows="3"
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  {isSubmitting && (
                    <div className="absolute top-4 right-4">
                      <motion.div
                        className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    type="submit"
                    disabled={
                      !answer.trim() || isSubmitting || feedback?.is_correct
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{
                      scale:
                        answer.trim() && !isSubmitting && !feedback?.is_correct
                          ? 1.02
                          : 1,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : feedback?.is_correct
                        ? "Correct! 🎉"
                        : "Submit Answer"}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={onGetHint}
                    disabled={isSubmitting || hintCount >= 3}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{
                      scale: hintCount < 3 && !isSubmitting ? 1.02 : 1,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💡 Hint ({3 - hintCount} left)
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={onGetExplanation}
                    disabled={isSubmitting || !showExplanation}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{
                      scale: showExplanation && !isSubmitting ? 1.02 : 1,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    📖 Explanation
                  </motion.button>
                </div>
              </form>

              {/* Hint Display */}
              <AnimatePresence>
                {hint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl"
                  >
                    <p className="text-amber-300 text-sm">{hint}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Explanation Display */}
              <AnimatePresence>
                {explanation && showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-green-950/30 border border-green-800/40 rounded-xl"
                  >
                    <h4 className="text-green-300 font-medium mb-2">
                      Explanation
                    </h4>
                    <p className="text-green-200/90 text-sm">
                      {explanation.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Feedback Display */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mt-4 p-4 rounded-xl border ${
                      feedback.is_correct
                        ? "bg-green-950/30 border-green-800/40"
                        : "bg-red-950/30 border-red-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {feedback.is_correct ? "✅" : "❌"}
                      </span>
                      <div className="flex-1">
                        <p
                          className={`font-medium mb-1 ${
                            feedback.is_correct
                              ? "text-green-300"
                              : "text-red-300"
                          }`}
                        >
                          {feedback.is_correct ? "Correct!" : "Incorrect"}
                        </p>
                        <p
                          className={`text-sm ${
                            feedback.is_correct
                              ? "text-green-200/90"
                              : "text-red-200/90"
                          }`}
                        >
                          {feedback.feedback || feedback.verdict_message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Agent Terminal (Minimal) */}
              <AnimatePresence>
                {(isSubmitting || agentLatencies) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <button
                      onClick={() => setShowTerminal(!showTerminal)}
                      className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-gray-500 hover:text-cyan-400 transition-colors font-mono"
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        animate={{
                          opacity: isSubmitting ? [1, 0.5, 1] : 1,
                          scale: isSubmitting ? [1, 1.2, 1] : 1,
                        }}
                        transition={{
                          duration: 1,
                          repeat: isSubmitting ? Infinity : 0,
                        }}
                      />
                      <span>
                        agent://orchestrator{" "}
                        {isSubmitting ? "(thinking…)" : "(idle)"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Navigation Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center"
          >
            <div className="text-sm text-gray-500">
              Press{" "}
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">
                Ctrl+Enter
              </kbd>{" "}
              or{" "}
              <kbd className="px-2 py-1 bg-white/10 rounded text-xs">
                Cmd+Enter
              </kbd>{" "}
              to submit
            </div>

            {/* Action buttons or Quality Rating */}
            <div className="flex gap-2 w-full sm:w-auto">
              {feedback?.is_correct && questionMode === "practice" ? (
                <div className="w-full sm:w-auto bg-black/40 p-4 rounded-xl border border-cyan-500/30">
                  <h3 className="text-white text-center mb-4 font-medium">How well did you know this?</h3>
                  <QualityRating onRate={(rating) => onRateQuality(rating)} />
                </div>
              ) : (
                <>
                  {/* Show Next Question button after feedback */}
                  {feedback && (
                    <motion.button
                      onClick={onNextQuestion}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      🚀 Next Question
                    </motion.button>
                  )}

                  <motion.button
                    type="button"
                    onClick={() => {
                      if (feedback) onReviewQuestion();
                      else onMarkForReview();
                    }}
                    className={`px-6 py-2 bg-gradient-to-r ${feedback ? "from-blue-500 to-indigo-600 shadow-blue-500/20" : "from-gray-700 to-gray-600 shadow-gray-700/20 hover:from-blue-600 hover:to-indigo-700"} text-white font-medium rounded-xl transition-all shadow-lg relative`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    📝 Review {feedback ? "Question" : "Progress"}
                    {showReviewToast && !feedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -45 }}
                        className="absolute left-1/2 -ml-24 w-48 bg-green-500/90 text-white text-xs py-1.5 px-3 rounded shadow-lg pointer-events-none text-center"
                      >
                        Added to Review Queue!
                      </motion.div>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={onSkipQuestion}
                    className={`px-6 py-2 bg-gradient-to-r ${feedback ? "from-orange-500 to-red-600 shadow-orange-500/20" : "from-gray-700 to-gray-600 shadow-gray-700/20 hover:from-orange-600 hover:to-red-700"} text-white font-medium rounded-xl transition-all shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ⏭️ Skip Question
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MinimalQuiz;
