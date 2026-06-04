# test_data_setup.py
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
django.setup()

from tutor.models import Question, Response, Mastery, LearningEvent
from django.utils import timezone

def create_test_data():
    print("Cleaning old data...")
    Response.objects.all().delete()
    Mastery.objects.all().delete()
    LearningEvent.objects.all().delete()
    Question.objects.all().delete()
    print("✓ Database cleaned.")

    print("Creating test data...")
    
    # Concepts and their questions at different Bloom levels
    concepts = {
        'variables': [
            ('What is a variable in Python?', 'A named location to store data', 'remember', 1),
            ('True or False: Variables can store numbers.', 'True', 'remember', 1),
            ('True or False: Variables must start with a letter or underscore.', 'True', 'remember', 1),
            ('Which is a valid variable name?', 'my_var', 'understand', 2),
            ('Create a variable named x with value 5', 'x = 5', 'apply', 3),
            ('Why is "2var" invalid?', 'Cannot start with number', 'analyze', 4),
            ('Evaluate usage of global variables', 'Use sparingly to avoid state issues', 'evaluate', 5),
            ('Design a variable naming convention', 'snake_case for variables', 'create', 6),
        ],
        'loops': [
            ('What keyword starts a loop?', 'for or while', 'remember', 1),
            ('True or False: A while loop runs until condition is false.', 'True', 'remember', 1),
            ('True or False: "break" stops a loop.', 'True', 'remember', 1),
            ('Explain the difference between for and while', 'for iterates seq, while condition', 'understand', 2),
            ('Write a loop to print 1 to 5', 'for i in range(1, 6): print(i)', 'apply', 3),
            ('Analyze why this loop is infinite', 'Condition never becomes false', 'analyze', 4),
            ('Compare recursion vs iteration', 'Recursion uses stack, iteration uses state', 'evaluate', 5),
            ('Create a complex nested loop pattern', 'Nested loops for matrix', 'create', 6),
        ],
        'functions': [
            ('What keyword defines a function?', 'def', 'remember', 1),
            ('True or False: Functions can return values.', 'True', 'remember', 1),
            ('True or False: "pass" does nothing.', 'True', 'remember', 1),
            ('What is a return value?', 'Output of function', 'understand', 2),
            ('Write a function to add two numbers', 'def add(a, b): return a + b', 'apply', 3),
            ('Analyze scope of variables in function', 'Local vs Global scope', 'analyze', 4),
            ('Evaluate benefits of pure functions', 'No side effects, easier to test', 'evaluate', 5),
            ('Design a library of math functions', 'Module structure', 'create', 6),
        ]
    }
    
    questions_created = 0
    
    for concept, questions in concepts.items():
        print(f"  Processing concept: {concept}")
        for q_text, ans, level, diff in questions:
            # Check if exists to avoid duplicates
            if not Question.objects.filter(text=q_text).exists():
                Question.objects.create(
                    text=q_text,
                    correct_answer=ans,
                    concept=concept,
                    bloom_level=level,
                    difficulty=diff,
                    created_at=timezone.now()
                )
                questions_created += 1
    
    print(f"✓ Created {questions_created} new questions.")
    print(f"Total Questions: {Question.objects.count()}")

if __name__ == "__main__":
    create_test_data()
