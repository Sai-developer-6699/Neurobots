import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { questionAPI } from "../services/api";
import QualityRating from "../components/QualityRating.jsx";
import { useNavigate } from "react-router-dom";

const ReviewMode = () => {
  const navigate = useNavigate();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        questionAPI.getManualReviews(), // Use the new API endpoint
        questionAPI.getReviewStats(),
      ]);
      setReviewQueue(queueRes.data.queue || []); // Updated to use the correct field
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch review data:", error);
      setReviewQueue([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleQualityRating = async (quality) => {
    const currentQuestion = reviewQueue[currentIndex];

    try {
      await questionAPI.rateReviewQuality(currentQuestion.id, quality);

      // Move to next
      if (currentIndex < reviewQueue.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        // Finished all reviews
        navigate("/dashboard");
        // Could actully show a 'Complete' summary screen here
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reviewQueue || !reviewQueue.length) {
    return (
      <div className="container mx-auto p-6 h-screen flex items-center justify-center">
        <div className="glass p-12 rounded-xl text-center border border-white/10 max-w-lg">
          <p className="text-8xl mb-6">🎉</p>
          <h2 className="text-3xl font-heading mb-4 text-white text-glow">
            All caught up!
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            You've reviewed all your due cards for now.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-black font-bold py-3 px-8 rounded-xl hover:bg-cyan-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = reviewQueue[currentIndex];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col">
      {/* Background elements */}
      <div className="fixed top-0 left-0 w-full h-full bg-black z-[-1]"></div>
      <div className="fixed bottom-0 left-[20%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] z-[-1]"></div>

      {/* Navbar / Header */}
      <header className="p-6 flex justify-between items-center max-w-4xl mx-auto w-full">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Dashboard
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Reviewing {currentIndex + 1} of {reviewQueue.length}
          </span>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-mono text-cyan-300 border border-white/5">
            {stats?.due_today || 0} due
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col justify-center pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass p-8 sm:p-12 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/40"
          >
            {/* Tags */}
            <div className="flex gap-2 mb-8">
              {currentQuestion.concept && (
                <span className="px-3 py-1 bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 rounded-full text-xs uppercase tracking-wider font-bold">
                  {currentQuestion.concept}
                </span>
              )}
              <span className="px-3 py-1 bg-purple-950/50 text-purple-300 border border-purple-500/30 rounded-full text-xs uppercase tracking-wider font-bold">
                {currentQuestion.bloom_level}
              </span>
            </div>

            {/* Question */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12 leading-tight font-heading">
              {currentQuestion.text}
            </h2>

            {/* Show Answer Button */}
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-black py-4 rounded-xl
                                         font-bold text-lg hover:from-primary/90 hover:to-blue-600/90 transition-all 
                                         shadow-[0_0_20px_rgba(0,243,255,0.3)] transform hover:scale-[1.01]"
              >
                Show Answer
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-6 bg-white/5 rounded-xl border-l-4 border-primary">
                  <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide font-bold">
                    Answer
                  </p>
                  <div className="text-xl text-white font-medium">
                    {currentQuestion.correct_answer ||
                      "No answer provided (Check explanation)"}
                  </div>
                </div>

                <QualityRating onRate={handleQualityRating} />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ReviewMode;
