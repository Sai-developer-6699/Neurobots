export const mockQuestions = {
  // CONCEPT 1: Matrix Multiplication (5 questions)
  matrix_multiplication: [
    {
      id: "mm1",
      bloom_level: 1, // Remember
      question_text: "What is the requirement for multiplying two matrices?",
      correct_answer:
        "The number of columns in the first matrix must equal the number of rows in the second matrix",
      difficulty: 0.3,
    },
    {
      id: "mm2",
      bloom_level: 2, // Understand
      question_text: "If A is 2x3 and B is 3x4, what are the dimensions of AB?",
      correct_answer: "2x4",
      difficulty: 0.5,
    },
    {
      id: "mm3",
      bloom_level: 3, // Apply
      question_text: "Compute: [[1,2],[3,4]] × [[5],[6]]",
      correct_answer: "[[17],[39]]",
      difficulty: 0.6,
    },
    {
      id: "mm4",
      bloom_level: 4, // Analyze
      question_text:
        "Why is matrix multiplication not commutative? Provide an example.",
      correct_answer:
        "AB ≠ BA because the dimensions may not even allow BA, and even when both are defined, the results differ due to the order of operations.",
      difficulty: 0.75,
    },
    {
      id: "mm5",
      bloom_level: 3, // Apply
      question_text:
        "A company has 3 factories producing 2 products. Matrix F (3x2) shows production rates. Matrix P (2x1) shows prices. What does FP represent?",
      correct_answer:
        "FP gives a 3x1 matrix showing the total revenue for each factory",
      difficulty: 0.7,
    },
  ],

  // CONCEPT 2: Determinants (5 questions)
  determinants: [
    {
      id: "det1",
      bloom_level: 1,
      question_text: "What does a determinant of zero indicate about a matrix?",
      correct_answer: "The matrix is singular (non-invertible)",
      difficulty: 0.4,
    },
    {
      id: "det2",
      bloom_level: 2,
      question_text: "Calculate the determinant of [[3, 1], [2, 4]]",
      correct_answer: "10 (calculated as 3*4 - 1*2)",
      difficulty: 0.5,
    },
    {
      id: "det3",
      bloom_level: 3,
      question_text: "If det(A) = 5, what is det(2A)?",
      correct_answer: "For a 2x2 matrix, det(2A) = 4 * det(A) = 20",
      difficulty: 0.65,
    },
    {
      id: "det4",
      bloom_level: 4,
      question_text: "Why does det(AB) = det(A) × det(B)?",
      correct_answer:
        "Because determinants measure scaling factors, and combining transformations multiplies their scaling effects",
      difficulty: 0.8,
    },
    {
      id: "det5",
      bloom_level: 2,
      question_text: "What is the geometric interpretation of the determinant?",
      correct_answer:
        "The determinant represents the scaling factor of area/volume under the linear transformation",
      difficulty: 0.6,
    },
  ],

  // CONCEPT 3: Vector Spaces (5 questions)
  vector_spaces: [
    {
      id: "vs1",
      bloom_level: 1,
      question_text:
        "What are the two main operations that must be defined for a vector space?",
      correct_answer: "Vector addition and scalar multiplication",
      difficulty: 0.35,
    },
    {
      id: "vs2",
      bloom_level: 2,
      question_text:
        "Is the set of all 2D vectors with non-negative components a vector space? Why?",
      correct_answer:
        "No, because it's not closed under scalar multiplication (multiplying by -1 gives negative components)",
      difficulty: 0.7,
    },
    {
      id: "vs3",
      bloom_level: 3,
      question_text: "Verify that the zero vector property holds for R²",
      correct_answer: "(x,y) + (0,0) = (x,y) for all vectors in R²",
      difficulty: 0.55,
    },
    {
      id: "vs4",
      bloom_level: 4,
      question_text:
        "Prove or disprove: The set of all polynomials of degree exactly 3 forms a vector space",
      correct_answer:
        "False. It's not closed under addition (adding two degree-3 polynomials can give a lower degree)",
      difficulty: 0.85,
    },
    {
      id: "vs5",
      bloom_level: 3,
      question_text:
        "What is the dimension of the vector space of all 2x2 matrices?",
      correct_answer:
        "4 (basis: [[1,0],[0,0]], [[0,1],[0,0]], [[0,0],[1,0]], [[0,0],[0,1]])",
      difficulty: 0.65,
    },
  ],
};
