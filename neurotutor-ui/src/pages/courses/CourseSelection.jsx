import { mockCourses } from "@/data/mockCourses";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { BookOpen, BarChart } from "lucide-react";

export default function CourseSelection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Explore Courses
        </h1>
        <p className="text-muted-foreground">
          Select a course to start mastering new concepts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCourses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="capitalize">
                  {course.difficulty}
                </Badge>
                {course.student_progress !== null && (
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  >
                    In Progress
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.total_questions} questions</span>
                </div>

                {course.student_progress !== null ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span>{Math.round(course.student_progress * 100)}%</span>
                    </div>
                    <Progress value={course.student_progress * 100} />
                  </div>
                ) : (
                  <div className="h-4" /> /* Spacer to keep alignment */
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to={`/learn/${course.id}/quiz`} className="w-full">
                <Button
                  className="w-full"
                  variant={
                    course.student_progress !== null ? "default" : "secondary"
                  }
                >
                  {course.student_progress !== null
                    ? "Continue Learning"
                    : "Start Course"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
