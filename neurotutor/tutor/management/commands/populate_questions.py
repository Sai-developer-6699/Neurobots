"""
Django management command to populate questions from course materials

Usage:
    python manage.py populate_questions --limit 50
    python manage.py populate_questions --category algorithms
"""

import os
import sys
import json
import time
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone
from groq import Groq

from tutor.models import Question


class Command(BaseCommand):
    help = 'Generate and populate questions from course materials'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of questions to generate'
        )
        
        parser.add_argument(
            '--category',
            type=str,
            default=None,
            help='Only process files from specific category'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview questions without saving to database'
        )
    
    def __init__(self):
        super().__init__()
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.stats = {
            'files_processed': 0,
            'questions_generated': 0,
            'questions_saved': 0,
            'errors': 0
        }
    
    def handle(self, *args, **options):
        limit = options['limit']
        category_filter = options['category']
        dry_run = options['dry_run']
        
        self.stdout.write(self.style.SUCCESS('Starting question population...'))
        
        # Get course materials directory
        materials_dir = Path('data/course_materials')
        
        if not materials_dir.exists():
            self.stdout.write(self.style.ERROR(f'Course materials not found at {materials_dir}'))
            return
        
        # Get all markdown files
        files = list(materials_dir.rglob('*.md'))
        
        if category_filter:
            files = [f for f in files if category_filter in str(f.parent)]
        
        self.stdout.write(f'Found {len(files)} course material files')
        
        # Process each file
        questions_generated = 0
        
        for file_path in files:
            if limit and questions_generated >= limit:
                break
            
            self.stdout.write(f'\nProcessing: {file_path.name}...')
            
            try:
                content = file_path.read_text(encoding='utf-8')
                category = file_path.parent.name
                topic = file_path.stem
                
                # Generate questions
                questions = self.generate_questions_from_content(
                    content=content,
                    category=category,
                    topic=topic,
                    count=5 if not limit else min(5, limit - questions_generated)
                )
                
                # Save questions
                for q_data in questions:
                    if dry_run:
                        self.stdout.write(f"  [DRY RUN] Would create: {q_data['text'][:60]}...")
                    else:
                        question, created = Question.objects.get_or_create(
                            text=q_data['text'],
                            defaults=q_data
                        )
                        
                        if created:
                            self.stdout.write(self.style.SUCCESS(f"  ✓ Created: {q_data['text'][:60]}..."))
                            self.stats['questions_saved'] += 1
                        else:
                            self.stdout.write(f"  ⏭  Exists: {q_data['text'][:60]}...")
                    
                    questions_generated += 1
                
                self.stats['files_processed'] += 1
                time.sleep(2)  # Rate limiting
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error: {e}"))
                self.stats['errors'] += 1
        
        # Print summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('SUMMARY'))
        self.stdout.write('=' * 60)
        self.stdout.write(f"Files processed: {self.stats['files_processed']}")
        self.stdout.write(f"Questions generated: {self.stats['questions_generated']}")
        self.stdout.write(f"Questions saved: {self.stats['questions_saved']}")
        self.stdout.write(f"Errors: {self.stats['errors']}")
    
    def generate_questions_from_content(self, content: str, category: str, topic: str, count: int = 5):
        """
        Use Groq to generate questions from course content
        """
        
        # Map category to question category
        category_mapping = {
            'programming_basics': 'technical',
            'algorithms': 'technical',
            'data_structures': 'technical',
            'system_design': 'system_design',
            'operating_systems': 'technical',
            'software_engineering': 'theoretical',
            'devops': 'technical',
        }
        
        question_category = category_mapping.get(category, 'theoretical')
        
        prompt = f"""Based on this educational content about {topic}, generate {count} high-quality interview/exam questions.

Content:
{content[:2000]}  # Limit to avoid token limits

Generate {count} questions that:
1. Test understanding at different Bloom's taxonomy levels
2. Are clear and specific
3. Have definitive correct answers
4. Cover different aspects of the topic

For each question, provide:
- The question text
- The correct answer (concise)
- Bloom's taxonomy level (remember/understand/apply/analyze/evaluate/create)
- Difficulty (1-5)
- Ideal answer duration in seconds (for interview practice)

Respond in JSON format:
{{
  "questions": [
    {{
      "text": "question here",
      "correct_answer": "answer here",
      "bloom_level": "understand",
      "difficulty": 3,
      "ideal_duration_seconds": 45,
      "rationale": "why this question is valuable"
    }}
  ]
}}"""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educator creating high-quality assessment questions."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content
            
            # Parse JSON
            result_text = result_text.replace('```json', '').replace('```', '').strip()
            result = json.loads(result_text)
            
            # Format for database
            questions = []
            for q in result.get('questions', []):
                questions.append({
                    'text': q['text'],
                    'correct_answer': q['correct_answer'],
                    'concept': topic,
                    'bloom_level': q.get('bloom_level', 'remember'),
                    'difficulty': q.get('difficulty', 3),
                    'category': question_category,
                    'sub_category': topic,
                    'ideal_duration_seconds': q.get('ideal_duration_seconds', 60),
                })
            
            self.stats['questions_generated'] += len(questions)
            return questions
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Generation error: {e}"))
            return []
