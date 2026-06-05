import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { questionAPI } from "@/services/api";
import QuestionCard from "@/components/learn/QuestionCard";
import InterventionPanel from "@/components/learn/InterventionPanel";
import ConfidenceSlider from "@/components/learn/ConfidenceSlider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Quiz() {
  // The topic could be passed via route (like /quiz/:concept)
  const { courseId, concept } = useParams();
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [status, setStatus] = useState("idle"); // idle, submitting, feedback, correct

  // Stats returned by backend
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState(0);
  const [masteryProgress, setMasteryProgress] = useState("0/6");
  const [apiFeedback, setApiFeedback] = useState("");
  const [apiIntervention, setApiIntervention] = useState(null);

  // Fetch initial question
  const fetchNextQuestion = async () => {
    setIsLoading(true);
    setStatus("idle");
    setAnswer("");
    setConfidence(50);
    try {
      // First try adaptive, fallback to random
      let response;
      try {
        response = await questionAPI.getAdaptiveQuestion(concept);
      } catch (err) {
        response = await questionAPI.getRandomQuestion(concept);
      }
      if (response.data.question) {
        setCurrentQuestion(response.data.question);
      } else {
        setCurrentQuestion(response.data);
      }
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept]);

  const handleSubmit = async () => {
    if (!currentQuestion || !answer.trim()) return;

    setStatus("submitting");

    try {
      const payload = {
        question_id: currentQuestion.id,
        submitted_answer: answer,
        confidence_score: confidence / 100, // Scale to 0-1 if backend expects it
      };

      const response = await questionAPI.submitAnswer(payload);
      const result = response.data;

      setStreak(result.streak_days || streak);
      if (result.mastery_progress) {
        setMasteryProgress(result.mastery_progress);
        // very hacky progress bar
        setProgress(parseInt(result.mastery_progress[0]) * 16.66);
      }
      setApiFeedback(result.verdict_message || result.feedback || "");

      if (result.is_correct) {
        setStatus("correct");
      } else {
        setStatus("feedback");
        // Store hint or conceptual intervention to pass to the InterventionPanel
        setApiIntervention({
          content: result.feedback || "Consider breaking the problem down.",
          prerequisite_hint: result.prerequisite_hint,
        });
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setStatus("idle"); // Revert on failure
    }
  };

  const handleNext = () => {
    fetchNextQuestion();
  };

  const handleInterventionAction = (action) => {
    console.log("Intervention action:", action);
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold">
          You've mastered all current questions! 🎉
        </h2>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs mb-1">
              <span>Mastery Progress</span>
              <span>{masteryProgress}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-orange-500 font-bold">
            <span className="text-xl">🔥</span>
            <span>{streak}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <QuestionCard question={currentQuestion} />

        {/* Answer Section */}
        <Card
          className={cn(
            "transition-all duration-300",
            status === "correct"
              ? "border-green-500 bg-green-50 dark:bg-green-900/10"
              : "",
          )}
        >
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={status !== "idle"}
                className="resize-none"
              />
            </div>

            {status === "idle" && (
              <ConfidenceSlider value={confidence} onChange={setConfidence} />
            )}

            {status === "idle" && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={!answer.trim()}
              >
                Submit Answer
              </Button>
            )}

            {status === "submitting" && (
              <Button className="w-full" size="lg" disabled>
                Analyzing Response...
              </Button>
            )}

            {status === "correct" && (
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-center gap-2 text-green-600 text-xl font-bold">
                  <CheckCircle className="w-8 h-8" />
                  Correct!
                </div>
                <p className="text-muted-foreground">
                  {apiFeedback ||
                    "Great explanation. You've mastered this concept."}
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={handleNext}
                >
                  Next Question <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {status === "feedback" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 font-bold">
                  <XCircle className="w-6 h-6" />
                  Let's review this
                </div>
                <InterventionPanel
                  type="socratic"
                  content={{ text: apiIntervention?.content || "Need a hint?" }}
                  onAction={handleInterventionAction}
                />
                {apiIntervention?.prerequisite_hint && (
                  <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded pb-3">
                    <strong>Bonus Hint:</strong>{" "}
                    {apiIntervention.prerequisite_hint}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setStatus("idle")}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
