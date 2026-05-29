# tutor/prompts.py

SYSTEM_PROMPTS = {
    'Remember': "You help students recall basic facts. Be encouraging and direct.",
    'Understand': "You help students grasp concepts. Use analogies and examples.",
    'Apply': "You guide students to apply knowledge. Ask them to think through steps.",
    'Analyze': "You push students to break down problems. Ask probing questions.",
    'Evaluate': "You encourage critical thinking. Challenge assumptions.",
    'Create': "You inspire synthesis. Encourage creative problem-solving.",
    'Default': "You are a supportive tutor who provides constructive feedback."
}

def get_feedback_system_prompt(bloom_level):
    return SYSTEM_PROMPTS.get(str(bloom_level).capitalize(), SYSTEM_PROMPTS['Default'])

def get_feedback_user_prompt(question_text, user_answer, correct_answer, concept, bloom_level, context=None):
    prompt = f"""Question: {question_text}
Student's Answer: {user_answer}
Correct Answer: {correct_answer}
Concept: {concept}
Bloom Level: {bloom_level}
"""
    if context:
        prompt += f"\nRelevant Course Material:\n{context}\n"
    
    prompt += """
Provide feedback that:
1. Acknowledges what they got right (if anything)
2. Explains the misconception
3. Points toward the correct answer WITHOUT stating it directly
4. Encourages them to try again

Keep it under 100 words and supportive."""
    return prompt

def get_hint_system_prompt(hint_style):
    return f"""You are a Socratic tutor. {hint_style}.
CRITICAL RULE: NEVER give the direct answer. Always ask questions or give hints that guide thinking."""

def get_hint_user_prompt(question_text, concept, bloom_level, attempt_count, context=None):
    prompt = f"""Question: {question_text}
Concept: {concept}
Bloom Level: {bloom_level}
Student has tried {attempt_count} time(s)
"""
    if context:
        prompt += f"\nRelevant Course Material:\n{context}\n"

    prompt += f"""
Generate a hint that:
1. Does NOT reveal the answer
2. Asks a question or points to relevant knowledge
3. Is appropriate for Bloom level: {bloom_level}
4. Gets slightly more direct if attempts > 1

Keep under 75 words."""
    return prompt

def get_explanation_system_prompt():
    return "You are a patient tutor explaining a concept clearly."

def get_evaluation_system_prompt():
    return """You are a strict but fair academic grader AI. Your ONLY job is to evaluate whether a student's answer is conceptually correct.

You MUST respond with ONLY a valid JSON object — no extra text, no markdown, no explanation outside the JSON.

Format:
{
  "verdict": "correct" | "partial" | "incorrect",
  "confidence": 0.0 to 1.0,
  "explanation": "One sentence explaining the verdict."
}

Rules:
- "correct": The student's answer captures the core concept, even if worded differently.
- "partial": The student shows some understanding but misses key details.
- "incorrect": The student's answer is wrong or irrelevant.
- Be lenient with wording/phrasing — judge conceptual understanding, not exact phrasing.
- confidence reflects how sure you are of your verdict (1.0 = very sure)."""

def get_evaluation_user_prompt(question_text, user_answer, correct_answer, concept, bloom_level):
    return f"""Question: {question_text}
Concept: {concept}
Bloom Level: {bloom_level}
Correct Answer (reference): {correct_answer}
Student's Answer: {user_answer}

Evaluate the student's answer. Respond ONLY with the JSON object."""

def get_explanation_user_prompt(question_text, correct_answer, concept, context=None):
    prompt = f"""Question: {question_text}
Correct Answer: {correct_answer}
Concept: {concept}
"""
    if context:
        prompt += f"\nRelevant Course Material:\n{context}\n"

    prompt += """
The student has struggled with this. Provide:
1. Clear explanation of the correct answer
2. Why this is correct
3. Common misconceptions
4. A memory aid or tip

Keep under 200 words."""
    return prompt
