export const mockDashboard = {
  student: {
    name: "Sarah Chen",
    streak: 7,
    total_mastery: 0.68,
  },
  active_courses: [
    {
      id: "course-1",
      title: "Linear Algebra Fundamentals",
      mastery: 0.72,
      questions_completed: 45,
      next_review_count: 3,
    },
    {
      id: "course-2",
      title: "Calculus I",
      mastery: 0.55,
      questions_completed: 23,
      next_review_count: 7,
    },
  ],
  recent_achievements: [
    {
      type: "bloom_promotion",
      concept: "Matrix Multiplication",
      new_level: 3,
      timestamp: "2024-12-03T10:30:00Z",
    },
  ],
};
