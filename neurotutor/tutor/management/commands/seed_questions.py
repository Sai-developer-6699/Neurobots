from django.core.management.base import BaseCommand
from tutor.models import Question

class Command(BaseCommand):
    help = 'Seeds the database with initial questions'

    def handle(self, *args, **kwargs):
        questions_data = [
            # Python Basics
            {"text": "What is the output of print(type([]))?", "correct_answer": "<class 'list'>", "concept": "Python Types", "bloom_level": "Remember", "difficulty": 1},
            {"text": "Which keyword is used to define a function in Python?", "correct_answer": "def", "concept": "Python Syntax", "bloom_level": "Remember", "difficulty": 1},
            {"text": "How do you insert an element at the end of a list?", "correct_answer": "append()", "concept": "Python Lists", "bloom_level": "Understand", "difficulty": 1},
            {"text": "What is the result of 3 ** 2?", "correct_answer": "9", "concept": "Python Operators", "bloom_level": "Apply", "difficulty": 1},
            {"text": "Is Python interpreted or compiled?", "correct_answer": "Interpreted", "concept": "Python Concepts", "bloom_level": "Understand", "difficulty": 2},
            
            # Django
            {"text": "What architecture pattern does Django follow?", "correct_answer": "MVT", "concept": "Django Architecture", "bloom_level": "Remember", "difficulty": 2},
            {"text": "Which file is used to configure database settings in Django?", "correct_answer": "settings.py", "concept": "Django Config", "bloom_level": "Remember", "difficulty": 2},
            {"text": "What is the command to run the development server?", "correct_answer": "python manage.py runserver", "concept": "Django CLI", "bloom_level": "Apply", "difficulty": 1},
            {"text": "What does ORM stand for?", "correct_answer": "Object-Relational Mapping", "concept": "Database", "bloom_level": "Understand", "difficulty": 3},
            {"text": "Which function is used to render a template?", "correct_answer": "render()", "concept": "Django Views", "bloom_level": "Apply", "difficulty": 2},

            # React
            {"text": "What is the virtual DOM?", "correct_answer": "A lightweight copy of the real DOM", "concept": "React Internals", "bloom_level": "Understand", "difficulty": 3},
            {"text": "Which hook is used for side effects?", "correct_answer": "useEffect", "concept": "React Hooks", "bloom_level": "Apply", "difficulty": 2},
            {"text": "How do you pass data from parent to child?", "correct_answer": "Props", "concept": "React Data Flow", "bloom_level": "Understand", "difficulty": 2},
            {"text": "What is JSX?", "correct_answer": "JavaScript XML", "concept": "React Syntax", "bloom_level": "Remember", "difficulty": 1},
            {"text": "Which hook is used to manage state?", "correct_answer": "useState", "concept": "React Hooks", "bloom_level": "Apply", "difficulty": 1},

            # DSA
            {"text": "What is the time complexity of binary search?", "correct_answer": "O(log n)", "concept": "Algorithms", "bloom_level": "Analyze", "difficulty": 3},
            {"text": "Which data structure uses LIFO?", "correct_answer": "Stack", "concept": "Data Structures", "bloom_level": "Remember", "difficulty": 1},
            {"text": "Which data structure uses FIFO?", "correct_answer": "Queue", "concept": "Data Structures", "bloom_level": "Remember", "difficulty": 1},
            {"text": "What is the best case complexity of Bubble Sort?", "correct_answer": "O(n)", "concept": "Sorting", "bloom_level": "Analyze", "difficulty": 2},
            {"text": "What is a hash collision?", "correct_answer": "Two keys hashing to the same index", "concept": "Hashing", "bloom_level": "Understand", "difficulty": 3},

            # System Design
            {"text": "What does CAP stand for?", "correct_answer": "Consistency, Availability, Partition Tolerance", "concept": "Distributed Systems", "bloom_level": "Remember", "difficulty": 4},
            {"text": "What is a Load Balancer?", "correct_answer": "Distributes traffic across servers", "concept": "Scalability", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is Horizontal Scaling?", "correct_answer": "Adding more machines to the pool", "concept": "Scalability", "bloom_level": "Apply", "difficulty": 3},
            {"text": "What is Vertical Scaling?", "correct_answer": "Adding more power to an existing machine", "concept": "Scalability", "bloom_level": "Apply", "difficulty": 3},
            {"text": "What is Caching used for?", "correct_answer": "Reducing latency and database load", "concept": "Performance", "bloom_level": "Apply", "difficulty": 2},

            # More Python
            {"text": "What is a lambda function?", "correct_answer": "Anonymous function", "concept": "Python Functions", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is a generator?", "correct_answer": "Function that yields values", "concept": "Python Advanced", "bloom_level": "Analyze", "difficulty": 4},
            {"text": "What is the difference between list and tuple?", "correct_answer": "List is mutable, tuple is immutable", "concept": "Python Types", "bloom_level": "Analyze", "difficulty": 2},
            {"text": "What is a decorator?", "correct_answer": "Function that modifies another function", "concept": "Python Advanced", "bloom_level": "Analyze", "difficulty": 4},
            {"text": "What is PEP 8?", "correct_answer": "Python Style Guide", "concept": "Best Practices", "bloom_level": "Remember", "difficulty": 1},

            # More Django
            {"text": "What is middleware?", "correct_answer": "Hooks into request/response processing", "concept": "Django Core", "bloom_level": "Understand", "difficulty": 4},
            {"text": "What is a Signal?", "correct_answer": "Dispatcher for events", "concept": "Django Core", "bloom_level": "Understand", "difficulty": 4},
            {"text": "What is CSRF?", "correct_answer": "Cross-Site Request Forgery", "concept": "Security", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is models.ForeignKey used for?", "correct_answer": "Many-to-one relationship", "concept": "Database", "bloom_level": "Apply", "difficulty": 2},
            {"text": "What is models.ManyToManyField used for?", "correct_answer": "Many-to-many relationship", "concept": "Database", "bloom_level": "Apply", "difficulty": 2},

            # More React
            {"text": "What is the Context API?", "correct_answer": "Global state management", "concept": "React State", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is Redux?", "correct_answer": "State management library", "concept": "React Ecosystem", "bloom_level": "Remember", "difficulty": 3},
            {"text": "What is the difference between class and functional components?", "correct_answer": "Classes use this/state, functions uses hooks", "concept": "React Components", "bloom_level": "Analyze", "difficulty": 2},
            {"text": "What is prop drilling?", "correct_answer": "Passing props through multiple levels", "concept": "React Patterns", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is a key in a list?", "correct_answer": "Unique identifier for elements", "concept": "React Rendering", "bloom_level": "Apply", "difficulty": 2},

            # More DSA
            {"text": "What is a Binary Search Tree?", "correct_answer": "Left child < Code < Right child", "concept": "Trees", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is checking for a cycle in a graph?", "correct_answer": "DFS or BFS", "concept": "Graph Algorithms", "bloom_level": "Analyze", "difficulty": 4},
            {"text": "What is dynamic programming?", "correct_answer": "Breaking down problems into subproblems", "concept": "Algorithms", "bloom_level": "Analyze", "difficulty": 5},
            {"text": "What is memoization?", "correct_answer": "Caching results of function calls", "concept": "Optimization", "bloom_level": "Apply", "difficulty": 4},
            {"text": "What is Big O notation?", "correct_answer": "Describes algorithm performance", "concept": "Complexity", "bloom_level": "Understand", "difficulty": 2},

            # More System Design
            {"text": "What is Database Sharding?", "correct_answer": "Partitioning data across servers", "concept": "Database Scaling", "bloom_level": "Analyze", "difficulty": 5},
            {"text": "What is a Microservice?", "correct_answer": "Small, independent service", "concept": "Architecture", "bloom_level": "Understand", "difficulty": 3},
            {"text": "What is SQL vs NoSQL?", "correct_answer": "Structured vs Unstructured data", "concept": "Database", "bloom_level": "Analyze", "difficulty": 2},
            {"text": "What is a CDN?", "correct_answer": "Content Delivery Network", "concept": "Performance", "bloom_level": "Remember", "difficulty": 2},
            {"text": "What is Latency?", "correct_answer": "Time taken for data to travel", "concept": "Networking", "bloom_level": "Understand", "difficulty": 2},
        ]

        count = 0
        for q_data in questions_data:
            question, created = Question.objects.get_or_create(
                text=q_data['text'],
                defaults=q_data
            )
            if created:
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} new questions'))
