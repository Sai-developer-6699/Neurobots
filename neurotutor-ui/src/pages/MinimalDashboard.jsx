import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { questionAPI } from "../services/api";
import { useNavigate, useParams, Link } from "react-router-dom";
import Cookies from "js-cookie";
import MinimalQuiz from "../components/MinimalQuiz.jsx";
import QuizSidebar from "../components/QuizSidebar.jsx";
import DifficultyBadge from "../components/DifficultyBadge.jsx";
import SessionExpiredModal from "../components/SessionExpiredModal.jsx";
import CollapsibleMetrics from "../components/CollapsibleMetrics.jsx";
import EnhancedConceptMap from "../components/EnhancedConceptMap.jsx";
import AdaptiveLearningPath from "../components/AdaptiveLearningPath.jsx";
import RelatedTopicsPanel from "../components/RelatedTopicsPanel.jsx";
import SessionModal from "../components/SessionModal.jsx";
import CelebrationDialog from "../components/CelebrationDialog.jsx";
import DebugPanel from "../components/DebugPanel.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Target, X } from "lucide-react";

const MinimalDashboard = () => {
  const { user, logout, sessionExpired, handleSessionExpired, renewSession } =
    useAuth();
  const navigate = useNavigate();
  const { questionId } = useParams(); // For practice mode

  // Quiz state
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [hintCount, setHintCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [explanation, setExplanation] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionMode, setQuestionMode] = useState(questionId ? 'practice' : 'normal'); // 'normal', 'review', 'skip', 'practice'

  // Loading states
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Stats state
  const [masteryData, setMasteryData] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [userData, setUserData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Session modal
  const [showSession, setShowSession] = useState(false);

  // Celebration dialog
  const [celebration, setCelebration] = useState({
    open: false,
    type: "goal",
    streakDays: 0,
    level: 1,
    xpBonus: 0,
  });

  // Heatmap refresh key
  const [heatmapRefreshKey, setHeatmapRefreshKey] = useState(0);

  // Enhanced concept mapping states
  const [showConceptMap, setShowConceptMap] = useState(false);
  const [showAdaptivePath, setShowAdaptivePath] = useState(false);
  const [activeConcept, setActiveConcept] = useState(null);

  // Phase 8 states
  const [difficultyRec, setDifficultyRec] = useState(null);
  const [conceptMap, setConceptMap] = useState(null);
  const [prerequisiteHint, setPrerequisiteHint] = useState("");
  const [agentLatencies, setAgentLatencies] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);

  // Refs
  const difficultyTimerRef = useRef(null);
  const submissionsSinceHeatmapRef = useRef(0);

  // ── Handle concept selection from related topics ───────────────────────────────
  const handleConceptSelect = async (concept) => {
    console.log("Selected concept:", concept);

    // Reset quiz state before fetching
    setSidebarOpen(false);
    setShowAdaptivePath(false);
    setShowConceptMap(false);
    setActiveConcept(concept); // Remember the concept session
    setQuestion(null); // Clear old question immediately
    setFeedback(null);
    setHint(null);
    setAnswer("");
    setHintCount(0);
    setAttemptCount(0);
    setShowExplanation(false);
    setExplanation(null);
    setLoading(true);

    console.log("State reset, sending API request for concept:", concept);

    // Fetch a question for the selected concept
    try {
      console.log("Calling getAdaptiveQuestion...");
      const res = await questionAPI.getAdaptiveQuestion(concept);
      console.log("Question for concept response:", res.data);

      if (res.data?.question) {
        setQuestion(res.data.question);
        setConceptMap(res.data.concept_map);
        setPrerequisiteHint(res.data.prerequisite_hint || "");

        // Check for latencies in response
        if (res.data.latencies) {
          setAgentLatencies(res.data.latencies);
          console.log(
            "Agent latencies loaded from concept selection:",
            res.data.latencies,
          );
        }
      } else if (res.data?.fallback_question) {
        setQuestion(res.data.fallback_question);
        setConceptMap(res.data.concept_map);
        setPrerequisiteHint(res.data.prerequisite_hint || "");
      }

      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back to quiz area
    } catch (error) {
      console.error("Error fetching question for concept:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch question ────────────────────────────────────────────────────────
  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setHint(null);
    setAnswer("");
    setHintCount(0);
    setAttemptCount(0);
    setShowExplanation(false);
    setExplanation(null);
    setDifficultyRec(null);
    setConceptMap(null);
    setPrerequisiteHint("");
    setAgentLatencies(null);

    try {
      let res;
      if (questionId) {
        console.log(`Fetching specific question ID: ${questionId}`);
        res = await questionAPI.getQuestionById(questionId);
      } else {
        console.log(`Fetching adaptive question${activeConcept ? ` for ${activeConcept}` : ""}...`);
        res = await questionAPI.getAdaptiveQuestion(activeConcept);
      }
      console.log("Question response:", res.data);

      // Adapt the response structure depending on the endpoint
      const questionData = questionId ? res.data : res.data?.question;
      
      if (questionData) {
        setQuestion(questionData);
        console.log("Question set successfully:", questionData);

        // Check for concept map and latencies in question response
        if (res.data.concept_map) {
          setConceptMap(res.data.concept_map);
          console.log(
            "Concept map loaded from question response:",
            res.data.concept_map,
          );
        }
        if (res.data.latencies) {
          setAgentLatencies(res.data.latencies);
          console.log(
            "Agent latencies loaded from question response:",
            res.data.latencies,
          );
        }
        if (res.data.prerequisite_hint) {
          setPrerequisiteHint(res.data.prerequisite_hint);
        }
      } else if (res.data?.fallback_question) {
        setQuestion(res.data.fallback_question);
        setPrerequisiteHint(res.data.prerequisite_hint || "");
        console.log("Fallback question set:", res.data.fallback_question);

        // Check for concept map and latencies in fallback response
        if (res.data.concept_map) {
          setConceptMap(res.data.concept_map);
          console.log(
            "Concept map loaded from fallback response:",
            res.data.concept_map,
          );
        }
        if (res.data.latencies) {
          setAgentLatencies(res.data.latencies);
          console.log(
            "Agent latencies loaded from fallback response:",
            res.data.latencies,
          );
        }
      } else {
        console.log("No question found, trying random question...");
        // Try random question as fallback
        const randomRes = await questionAPI.getRandomQuestion(activeConcept);
        console.log("Random question response:", randomRes.data);

        if (randomRes.data?.id || randomRes.data?.text) {
          console.log("Setting question from random response...");
          setQuestion(randomRes.data);
          setPrerequisiteHint(randomRes.data.prerequisite_hint || "");
          console.log("Random question set successfully:", randomRes.data);
          console.log("Question state should now be set to:", randomRes.data);
        } else {
          console.error("No questions available from any endpoint");
          console.log("Final random response data:", randomRes.data);
          setQuestion(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch question:", err);
      console.error("Error response:", err.response?.data);

      // Try random question as fallback
      try {
        console.log("Trying random question as fallback...");
        const randomRes = await questionAPI.getRandomQuestion(activeConcept);
        if (randomRes.data?.id || randomRes.data?.text) {
          setQuestion(randomRes.data);
          setPrerequisiteHint(randomRes.data.prerequisite_hint || "");
          console.log(
            "Fallback random question set successfully:",
            randomRes.data,
          );
        } else {
          console.error("No questions available from any endpoint");
          setQuestion(null);
        }
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        setQuestion(null);
      }
    } finally {
      setLoading(false);
    }
  }, [questionId, activeConcept]);

  // ── Load initial stats ────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      console.log("Fetching user stats...");
      const [masteryRes, reviewRes, userRes, heatmapRes] = await Promise.all([
        questionAPI.getMastery(),
        questionAPI.getReviewStats(),
        questionAPI.getUserStats(),
        questionAPI.getHeatmapData(),
      ]);

      console.log("Mastery data:", masteryRes.data);
      console.log("Review stats:", reviewRes.data);
      console.log("User stats:", userRes.data);
      console.log("Heatmap data:", heatmapRes.data);

      // Create mapping dict for ConceptMap
      if (masteryRes.data?.concepts) {
        const masteryDict = {};
        masteryRes.data.concepts.forEach((c) => {
          masteryDict[c.concept] = c.progress_percentage;
        });
        setMasteryData({ ...masteryRes.data, mapping: masteryDict });
      } else {
        setMasteryData(masteryRes.data);
      }

      setReviewStats(reviewRes.data);
      setUserData(userRes.data);

      // Handle heatmap data - convert object to array format
      if (heatmapRes.data && typeof heatmapRes.data === "object") {
        // Convert object to array format for heatmap
        const heatmapArray = Object.entries(heatmapRes.data).map(
          ([date, data]) => ({
            date,
            ...data,
          }),
        );
        setHeatmapData(heatmapArray);
      } else {
        setHeatmapData(heatmapRes.data);
      }

      // Initialize agent latencies as null - will be populated after answer submission
      console.log("Initializing agent latencies to null");
      setAgentLatencies(null);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      console.error("Error response:", err.response?.data);

      // Set empty data to prevent crashes
      setMasteryData(null);
      setReviewStats(null);
      setUserData(null);
      setHeatmapData([]);
      setAgentLatencies(null);
    }
  };

  // ── Fetch mastery and stats ───────────────────────────────────────────────
  const fetchMasteryAndStats = useCallback(async () => {
    try {
      console.log("Fetching mastery and stats...");
      const [masteryRes, reviewRes, userRes, heatmapRes] = await Promise.all([
        questionAPI.getMasterySummary(),
        questionAPI.getReviewStats(),
        questionAPI.getUserStats(),
        questionAPI.getHeatmapData(),
      ]);

      console.log("Mastery data:", masteryRes.data);
      console.log("Review stats:", reviewRes.data);
      console.log("User stats:", userRes.data);
      console.log("Heatmap data:", heatmapRes.data);

      // Create mapping dict for ConceptMap
      if (masteryRes.data?.concepts) {
        const masteryDict = {};
        masteryRes.data.concepts.forEach((c) => {
          masteryDict[c.concept] = c.progress_percentage;
        });
        setMasteryData({ ...masteryRes.data, mapping: masteryDict });
      } else {
        setMasteryData(masteryRes.data);
      }

      setReviewStats(reviewRes.data);
      setUserData(userRes.data);

      // Handle heatmap data - convert object to array format
      if (heatmapRes.data && typeof heatmapRes.data === "object") {
        // Convert object to array format for heatmap
        const heatmapArray = Object.entries(heatmapRes.data).map(
          ([date, count]) => ({
            date,
            count: Number(count),
          }),
        );
        console.log("Converted heatmap array:", heatmapArray);
        setHeatmapData(heatmapArray);
      } else if (heatmapRes.data && Array.isArray(heatmapRes.data)) {
        setHeatmapData(heatmapRes.data);
      } else if (
        heatmapRes.data &&
        heatmapRes.data.heatmap &&
        Array.isArray(heatmapRes.data.heatmap)
      ) {
        setHeatmapData(heatmapRes.data.heatmap);
      } else {
        console.warn(
          "Heatmap data is not in expected format:",
          heatmapRes.data,
        );
        setHeatmapData([]);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      console.error("Error response:", err.response?.data);

      // Set empty data to prevent crashes
      setMasteryData(null);
      setReviewStats(null);
      setUserData(null);
      setHeatmapData([]);
    }
  }, []);

  // ── Next question ─────────────────────────────────────────────────────────
  const handleNextQuestion = () => {
    console.log("Loading next question...");
    setQuestionMode('normal');
    // Reset all quiz state
    setQuestion(null);
    setAnswer("");
    setFeedback(null);
    setHint(null);
    setHintCount(0);
    setAttemptCount(0);
    setShowExplanation(false);
    setExplanation(null);
    setDifficultyRec(null);
    setConceptMap(null);
    setPrerequisiteHint("");
    setAgentLatencies(null);

    // Fetch new question
    fetchQuestion();
  };

  // ── Review question ───────────────────────────────────────────────────────
  const handleReviewQuestion = async () => {
    console.log("Reviewing current question...");
    setQuestionMode('review');

    // Save to review queue in backend
    if (question?.id) {
      try {
        await questionAPI.markForReview(question.id);
        console.log("Question marked for manual review in backend.");
      } catch (err) {
        console.error("Failed to mark for review:", err);
      }
    }

    // Keep current question but show review interface
    setShowExplanation(true);
    if (!explanation) {
      handleGetExplanation();
    }
  };

  // ── Skip question ─────────────────────────────────────────────────────────
  const handleSkipQuestion = async () => {
    console.log("Skipping to next question...");
    setQuestionMode('skip');

    // Track skip in backend
    if (question?.id) {
      try {
        await questionAPI.skipQuestion(question.id);
        console.log("Skip event logged in backend.");
      } catch (err) {
        console.error("Failed to log skip event:", err);
      }
    }

    // Reset and load next question without reviewing current
    setQuestion(null);
    setAnswer("");
    setFeedback(null);
    setHint(null);
    setHintCount(0);
    setAttemptCount(0);
    setShowExplanation(false);
    setExplanation(null);
    setDifficultyRec(null);
    setConceptMap(null);
    setPrerequisiteHint("");
    setAgentLatencies(null);

    // Fetch new question
    fetchQuestion();
  };

  // ── Submit answer ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || !answer.trim()) return;

    console.log("Submitting answer:", {
      questionId: question.id,
      answer: answer.trim(),
    });
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await questionAPI.submitAnswer({
        question_id: question.id,
        submitted_answer: answer,
      });

      console.log("Submit answer response:", res.data);

      setFeedback(res.data);

      // Handle agent latencies - check different possible locations
      const latencies =
        res.data.agent_latencies ||
        res.data.latencies ||
        res.data.agent_performance ||
        null;
      console.log("Agent latencies found:", latencies);
      console.log("Full response data keys:", Object.keys(res.data));
      setAgentLatencies(latencies);

      const newAttemptCount = (prev) => prev + 1;
      setAttemptCount(newAttemptCount);

      // Debug explanation trigger conditions
      console.log("Explanation trigger check:");
      console.log("- is_correct:", res.data.is_correct);
      console.log("- verdict:", res.data.verdict);
      console.log("- attemptCount:", attemptCount);
      console.log("- Should show explanation:",
        res.data.is_correct ||
        res.data.verdict === "partial" ||
        attemptCount >= 2
      );

      // Show explanation automatically if correct, partially correct, or 3 attempts reached
      if (
        res.data.is_correct ||
        res.data.verdict === "partial" ||
        attemptCount >= 2
      ) {
        console.log("Triggering explanation display...");
        setShowExplanation(true);
        handleGetExplanation();
      } else {
        console.log("Not showing explanation yet");
      }

      // Update user data
      setUserData((prev) => {
        const updated = {
          ...prev,
          xp: (prev?.xp || 0) + (res.data.xp_gained || 0),
          level: res.data.new_level || prev?.level || 1,
          streak_days:
            res.data.streak_days != null
              ? res.data.streak_days
              : prev?.streak_days || 0,
          daily_goal_progress:
            res.data.daily_goal_progress != null
              ? res.data.daily_goal_progress
              : (prev?.daily_goal_progress || 0) +
              (res.data.xp_gained > 0 ? 1 : 0),
        };

        // 🎉 Trigger celebration dialog
        if (res.data.goal_completed) {
          setCelebration({ open: true, type: "goal", xpBonus: 50 });
        } else if (
          res.data.new_level &&
          res.data.new_level > (prev?.level || 1)
        ) {
          setCelebration({
            open: true,
            type: "levelup",
            level: res.data.new_level,
          });
        } else if (
          res.data.streak_days &&
          res.data.streak_days > 0 &&
          res.data.streak_days % 7 === 0
        ) {
          setCelebration({
            open: true,
            type: "streak",
            streakDays: res.data.streak_days,
          });
        }

        return updated;
      });

      // Refresh stats and heatmap
      fetchMasteryAndStats();
      submissionsSinceHeatmapRef.current += 1;
      if (submissionsSinceHeatmapRef.current % 5 === 0) {
        setHeatmapRefreshKey((k) => k + 1);
      }

      // Phase 8 — difficulty recommendation & concept map
      const rec = res.data.difficulty_recommendation;
      if (rec?.show_badge) {
        setDifficultyRec(rec);
        if (difficultyTimerRef.current)
          clearTimeout(difficultyTimerRef.current);
        difficultyTimerRef.current = setTimeout(
          () => setDifficultyRec(null),
          6000,
        );
      }
      if (res.data.concept_map) setConceptMap(res.data.concept_map);
      if (res.data.prerequisite_hint)
        setPrerequisiteHint(res.data.prerequisite_hint);
      else setPrerequisiteHint("");
    } catch (err) {
      console.error("Failed to submit answer:", err);
      console.error("Error response:", err.response?.data);
      setFeedback({
        error:
          err.response?.data?.error || "Unable to submit. Please try again.",
        is_correct: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle Quality Rating ────────────────────────────────────────────────
  const handleRateQuality = async (quality) => {
    try {
      setIsSubmitting(true);
      await questionAPI.rateReviewQuality(question.id, quality);
      // Head back to the review hub so they can keep practicing
      navigate("/review");
    } catch (err) {
      console.error("Failed to submit quality rating:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Get hint ─────────────────────────────────────────────────────────────
  const handleGetHint = async () => {
    if (hintCount >= 3) return;
    setIsLoadingHint(true);
    setHint(null);

    try {
      console.log("Getting hint for question:", question.id);
      const res = await questionAPI.getHint(question.id);
      console.log("Hint response:", res.data);
      setHint(res.data.hint);
      setHintCount((prev) => prev + 1);
      if (res.data.can_show_answer) setShowExplanation(true);
    } catch (err) {
      console.error("Failed to get hint:", err);
      console.error("Error response:", err.response?.data);
      setHint("Unable to generate hint. Please try again.");
    } finally {
      setIsLoadingHint(false);
    }
  };

  // ── Mark question for manual review ──────────────────────────────────────
  const [showReviewToast, setShowReviewToast] = useState(false);
  const handleMarkForReview = async () => {
    try {
      await questionAPI.markForReview(question.id);
      setShowReviewToast(true);
      setTimeout(() => setShowReviewToast(false), 3000);
    } catch (error) {
      console.error("Error marking question for review:", error);
    }
  };


  // ── Get explanation ───────────────────────────────────────────────────────
  const handleGetExplanation = async () => {
    try {
      console.log("Getting explanation for question:", question?.id);
      if (!question?.id) {
        console.error("No question ID available");
        return;
      }

      // Check authentication status
      const token = Cookies.get("access_token");
      console.log("Auth token present:", !!token);
      if (!token) {
        console.error("No authentication token found");
        alert("Please log in to view explanations");
        return;
      }

      const res = await questionAPI.getExplanation(question.id);
      console.log("Explanation response:", res.data);
      setExplanation(res.data);
    } catch (err) {
      console.error("Failed to get explanation:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      if (err.response?.status === 401) {
        console.error("Authentication required for explanation");
        alert("Please log in to view explanations");
      } else if (err.response?.status === 403) {
        const errorData = err.response?.data;
        if (errorData?.detail?.includes("rate limit")) {
          console.error("Rate limit exceeded for explanations");
          alert("Too many explanation requests. Please wait a while (5 per hour limit).");
        } else {
          console.error("Permission denied for explanation");
          alert("You don't have permission to view explanations. Please log in.");
        }
      } else if (err.response?.status === 429) {
        console.error("Rate limit exceeded for explanations");
        alert("Too many explanation requests. Please wait a while.");
      } else {
        const errorMessage = err.response?.data?.error || err.message || "Unable to get explanation";
        console.error("Explanation error details:", errorMessage);
        alert(`Failed to get explanation: ${errorMessage}`);
      }
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);
  useEffect(() => {
    fetchMasteryAndStats();
  }, [fetchMasteryAndStats]);

  // Debug question state changes
  useEffect(() => {
    console.log("Question state changed:", question);
  }, [question]);

  // Session expiry handling
  useEffect(() => {
    const handleSessionExpiredEvent = () => {
      handleSessionExpired();
    };

    window.addEventListener("sessionExpired", handleSessionExpiredEvent);
    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpiredEvent);
    };
  }, [handleSessionExpired]);

  // ── Handle Concept Selection ─────────────────────────────────────────────
  const onConceptSelect = (concept) => {
    console.log("Selected concept:", concept);
    setShowConceptMap(false);
    setShowAdaptivePath(false);
    // If we want to force a fetch for this specific concept, we would need
    // an endpoint for it. For now, we just close the modals or could do more.
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading && !question)
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your session…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      {/* Background glows */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-500/4 rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-purple-600/4 rounded-full blur-[110px]" />
      </div>

      {/* Simplified Navbar */}
      <nav className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-black font-black text-sm shadow-lg shadow-cyan-500/20">
                N
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                NeuroTutor
              </span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Learning Tools */}
              <button
                onClick={() => setShowConceptMap(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
              >
                <Brain size={16} />
                <span className="hidden sm:inline">Mind Map</span>
              </button>
              <button
                onClick={() => setShowAdaptivePath(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all"
              >
                <Target size={16} />
                <span className="hidden sm:inline">Learning Path</span>
              </button>

              {/* Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 12h18M3 6h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* User menu */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user?.name}
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Centered Quiz with Collapsible Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_320px] gap-4 lg:gap-6">
          {/* Main Quiz Area - Centered */}
          <div className="min-w-0 space-y-4 lg:space-y-6">
            <MinimalQuiz
              question={question}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmit}
              onNextQuestion={handleNextQuestion}
              onReviewQuestion={handleReviewQuestion}
              onMarkForReview={handleMarkForReview}
              onSkipQuestion={handleSkipQuestion}
              questionMode={questionMode}
              isSubmitting={isSubmitting}
              feedback={feedback}
              hint={hint}
              hintCount={hintCount}
              onGetHint={handleGetHint}
              explanation={explanation}
              showExplanation={showExplanation}
              onGetExplanation={handleGetExplanation}
              attemptCount={attemptCount}
              prerequisiteHint={prerequisiteHint}
              conceptMap={conceptMap}
              showTerminal={showTerminal}
              setShowTerminal={setShowTerminal}
              agentLatencies={agentLatencies}
              onRateQuality={handleRateQuality}
              showReviewToast={showReviewToast}
            />

            {/* Collapsible Metrics Below Quiz */}
            <CollapsibleMetrics
              masteryData={masteryData}
              heatmapData={heatmapData}
              reviewStats={reviewStats}
              userData={userData}
            />

            {/* Related Topics Panel */}
            {conceptMap && question?.concept && (
              <RelatedTopicsPanel
                currentConcept={question?.concept}
                conceptMap={conceptMap}
                onTopicSelect={handleConceptSelect}
                className="mt-6"
              />
            )}
          </div>

          {/* Right Sidebar - Quick Stats */}
          <div className="space-y-6">
            {/* User Stats Card */}
            {userData && (
              <div className="glass p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">
                      {userData.xp || 0}
                    </div>
                    <div className="text-sm text-gray-400">Total XP</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-400">
                        {userData.streak_days || 0}
                      </div>
                      <div className="text-xs text-gray-400">Day Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">
                        {userData.level || 1}
                      </div>
                      <div className="text-xs text-gray-400">Level</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {userData.daily_goal_progress || 0}/5
                    </div>
                    <div className="text-sm text-gray-400">Daily Goal</div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Queue */}
            {reviewStats && reviewStats.due_today > 0 && (
              <div className="glass p-6 rounded-xl border border-amber-800/50 bg-amber-950/20">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">
                  Review Due
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {reviewStats.due_today}
                  </div>
                  <p className="text-sm text-amber-600">
                    questions need review
                  </p>
                  <button
                    onClick={() => navigate("/review")}
                    className="mt-4 w-full px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-all"
                  >
                    Start Review
                  </button>
                </div>
              </div>
            )}

            {/* Agent Activity */}
            {agentLatencies && (
              <div className="glass p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Agent Activity
                </h3>
                <div className="space-y-2">
                  {Object.entries(agentLatencies).map(([agent, latency]) => (
                    <div
                      key={agent}
                      className="flex justify-between items-center text-sm"
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <QuizSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        masteryData={masteryData}
        reviewStats={reviewStats}
        userData={userData}
        heatmapData={heatmapData}
        agentLatencies={agentLatencies}
        showTerminal={showTerminal}
        conceptMap={conceptMap}
        prerequisiteHint={prerequisiteHint}
        question={question}
        onDashboardClick={() => {
          setActiveConcept(null);
          setSidebarOpen(false);
        }}
      />

      {/* Difficulty Recommendation Badge */}
      <AnimatePresence>
        {difficultyRec && (
          <DifficultyBadge
            recommendation={difficultyRec}
            onDismiss={() => setDifficultyRec(null)}
          />
        )}
      </AnimatePresence>

      {/* Session Modal */}
      <SessionModal
        isOpen={showSession}
        onClose={() => setShowSession(false)}
        userData={userData}
      />

      {/* Celebration Dialog */}
      <CelebrationDialog
        isOpen={celebration.open}
        onClose={() => setCelebration((prev) => ({ ...prev, open: false }))}
        type={celebration.type}
        streakDays={celebration.streakDays}
        level={celebration.level}
        xpBonus={celebration.xpBonus}
      />

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onClose={() => navigate("/login")}
        onLogin={() => navigate("/login")}
        onRenew={renewSession}
      />

      {/* Debug Panel - Remove in production */}
      <DebugPanel
        question={question}
        masteryData={masteryData}
        reviewStats={reviewStats}
        userData={userData}
        heatmapData={heatmapData}
        agentLatencies={agentLatencies}
        setAgentLatencies={setAgentLatencies}
        setConceptMap={setConceptMap}
      />

      {/* Enhanced Concept Map Modal */}
      <EnhancedConceptMap
        isOpen={showConceptMap}
        onClose={() => setShowConceptMap(false)}
        currentConcept={question?.concept}
        conceptMap={conceptMap}
        masteryData={masteryData?.mapping || {}}
        onConceptSelect={onConceptSelect}
      />

      {/* Adaptive Learning Path Modal */}
      <AnimatePresence>
        {showAdaptivePath && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-6xl mx-auto h-[90vh] my-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Target size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Adaptive Learning Path
                    </h2>
                    <p className="text-sm text-gray-400">
                      Personalized learning recommendations
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdaptivePath(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="h-[calc(90vh-80px)] overflow-y-auto p-6">
                <AdaptiveLearningPath
                  currentConcept={question?.concept}
                  conceptMap={conceptMap}
                  masteryData={masteryData?.mapping || {}}
                  userProgress={userData?.progress || {}}
                  onConceptSelect={onConceptSelect}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MinimalDashboard;
