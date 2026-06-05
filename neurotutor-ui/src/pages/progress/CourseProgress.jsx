import { mockProgress } from "@/data/mockProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Clock, TrendingUp } from "lucide-react";

export default function CourseProgress() {
  const { overview, concepts, bloom_progress } = mockProgress;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Course Progress
        </h1>
        <p className="text-muted-foreground">
          Track your mastery and learning journey.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Overall Mastery
              </span>
              <span className="text-2xl font-bold">
                {(overview.overall_mastery * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Questions</span>
              <span className="text-2xl font-bold">
                {overview.questions_completed}/{overview.questions_total}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Current Streak
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {overview.current_streak}
                </span>
                <span className="text-xl">🔥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Longest Streak
              </span>
              <span className="text-2xl font-bold">
                {overview.longest_streak}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Concept Breakdown */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Concept Mastery
          </h2>
          <div className="space-y-4">
            {concepts.map((concept) => (
              <Card key={concept.tag}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {concept.display_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          Bloom Level {concept.bloom_level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Next review:{" "}
                          {new Date(
                            concept.next_review_due,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-xl">
                      {(concept.mastery_level * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={concept.mastery_level * 100}
                    className="h-3"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bloom's Taxonomy Pyramid (Simplified as list for now) */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bloom's Progress
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {[6, 5, 4, 3, 2, 1].map((level) => {
                const data = bloom_progress[level];
                const labels = [
                  "Remember",
                  "Understand",
                  "Apply",
                  "Analyze",
                  "Evaluate",
                  "Create",
                ];
                const percentage = (data.completed / data.total) * 100;

                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {level}. {labels[level - 1]}
                      </span>
                      <span className="text-muted-foreground">
                        {data.completed}/{data.total}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
