import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Tag } from "lucide-react";

export default function QuestionCard({ question }) {
  const bloomColors = {
    1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", // Remember
    2: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300", // Understand
    3: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", // Apply
    4: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", // Analyze
    5: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", // Evaluate
    6: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", // Create
  };

  // Fallback for string-based bloom levels from groq
  const parseBloom = (val) => {
    if (!val) return 1;
    if (typeof val === "number") return val;
    const lower = val.toString().toLowerCase();
    if (lower.includes("remember")) return 1;
    if (lower.includes("understand")) return 2;
    if (lower.includes("apply")) return 3;
    if (lower.includes("analyze")) return 4;
    if (lower.includes("evaluate")) return 5;
    if (lower.includes("create")) return 6;
    return 1;
  };

  const bloomIdx = parseBloom(question.bloom_level);

  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Badge variant="secondary" className={bloomColors[bloomIdx]}>
            <Brain className="w-3 h-3 mr-1" />
            Bloom Level: {question.bloom_level || "Remember"}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground capitalize">
            <Tag className="w-3 h-3 mr-1" />
            {question.category || "General"}
          </Badge>
          {question.sub_category && (
            <Badge
              variant="outline"
              className="text-muted-foreground capitalize"
            >
              {question.sub_category}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl md:text-2xl leading-relaxed">
          {question.text || question.question_text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Placeholder for potential image or rich content */}
      </CardContent>
    </Card>
  );
}
