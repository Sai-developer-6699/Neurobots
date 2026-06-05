import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, BookOpen, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TypingText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20); // Typing speed
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <p className="text-sm md:text-base leading-relaxed">{displayedText}</p>
  );
};

export default function InterventionPanel({ type, content, onAction }) {
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const getIcon = () => {
    switch (type) {
      case "socratic":
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case "hint":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "concept_review":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "socratic":
        return "Let's think about this...";
      case "hint":
        return "Here's a hint";
      case "concept_review":
        return "Concept Review";
      case "encouragement":
        return "Great job!";
      default:
        return "AI Tutor";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-6"
      >
        <Card className="bg-secondary/30 border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
            {getIcon()}
            <CardTitle className="text-lg font-medium text-primary">
              {getTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 min-h-[60px]">
              <TypingText
                text={content}
                onComplete={() => setIsTypingComplete(true)}
              />
            </div>

            {isTypingComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 flex-wrap"
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction("hint")}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Show Hint
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction("example")}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Show Example
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAction("retry")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
