export const mockInterventions = {
  socratic:
    "🤔 Let's think about this step by step. When you multiply two matrices, what rule determines if the multiplication is possible?",
  hint: "💡 Hint: Look at the dimensions. A 2x3 matrix has 2 rows and 3 columns. What happens to these numbers when you multiply?",
  encouragement:
    "✨ Great effort! You're on the right track. Let me help you refine your thinking...",
  concept_review:
    "📚 Let's review: Matrix multiplication requires the number of columns in the first matrix to equal the number of rows in the second.",
};

export const mockInterventionTemplates = {
  matrix_multiplication: {
    socratic:
      "Think about the pattern: when you multiply A (m×n) by B (p×q), which dimensions need to match? And which dimensions remain in the result?",
    hint: "Remember: (rows of A) × (cols of A) · (rows of B) × (cols of B) → (rows of A) × (cols of B)",
    concept_review:
      "Matrix multiplication: The number of columns in the first matrix MUST equal the number of rows in the second. The result has dimensions (rows of first) × (columns of second).",
  },
  determinants: {
    socratic:
      "What does the determinant tell us about the transformation represented by the matrix? Think about how it affects areas or volumes.",
    hint: "For a 2×2 matrix [[a,b],[c,d]], the determinant is ad - bc. This represents how much the matrix scales areas.",
    concept_review:
      "The determinant is a scalar that indicates if a matrix is invertible (det ≠ 0) and by how much it scales areas/volumes.",
  },
  vector_spaces: {
    socratic:
      "For something to be a vector space, it needs to satisfy closure properties. What happens when you add two elements or multiply by a scalar?",
    hint: "Check all vector space axioms: closure under addition and scalar multiplication, existence of zero vector, additive inverses, etc.",
    concept_review:
      "A vector space is a set with addition and scalar multiplication that satisfy 10 axioms, including closure, associativity, and distributivity.",
  },
};
