export const mockProgress = {
  overview: {
    overall_mastery: 0.72,
    questions_completed: 45,
    questions_total: 100,
    current_streak: 7,
    longest_streak: 12,
  },
  mastery_over_time: [
    { date: "2024-11-27", mastery: 0.45 },
    { date: "2024-11-28", mastery: 0.52 },
    { date: "2024-11-29", mastery: 0.58 },
    { date: "2024-11-30", mastery: 0.63 },
    { date: "2024-12-01", mastery: 0.68 },
    { date: "2024-12-02", mastery: 0.7 },
    { date: "2024-12-03", mastery: 0.72 },
  ],
  concepts: [
    {
      tag: "matrix_multiplication",
      display_name: "Matrix Multiplication",
      mastery_level: 0.85,
      bloom_level: 3,
      total_attempts: 12,
      consecutive_correct: 5,
      next_review_due: "2024-12-05T14:00:00Z",
    },
    {
      tag: "determinants",
      display_name: "Determinants",
      mastery_level: 0.62,
      bloom_level: 2,
      total_attempts: 8,
      consecutive_correct: 2,
      next_review_due: "2024-12-04T10:00:00Z",
    },
  ],
  bloom_progress: {
    1: { completed: 15, total: 15 }, // Remember - 100%
    2: { completed: 12, total: 15 }, // Understand - 80%
    3: { completed: 8, total: 15 }, // Apply - 53%
    4: { completed: 3, total: 15 }, // Analyze - 20%
    5: { completed: 0, total: 15 }, // Evaluate - 0%
    6: { completed: 0, total: 15 }, // Create - 0%
  },
};
