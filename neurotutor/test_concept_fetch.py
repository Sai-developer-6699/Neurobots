import os
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
django.setup()

from django.contrib.auth import get_user_model
from tutor.services.mastery_service import mastery_service
from tutor.models import Question, SkippedQuestion, Response

user = get_user_model().objects.get(email="test23@gmail.com")
concept = "searching_algorithms"

# what is in the DB?
questions = Question.objects.filter(concept=concept)
print(f"Total questions for {concept}:", questions.count())

answered = Response.objects.filter(user=user, is_correct=True).values_list('question_id', flat=True)
skipped = SkippedQuestion.objects.filter(user=user).values_list('question_id', flat=True)
print(f"User has answered {len(answered)} correctly and skipped {len(skipped)}")

excluded_ids = list(answered) + list(skipped)

q = Question.objects.filter(concept=concept).exclude(id__in=excluded_ids).first()
if q:
    print(f"Found available question: {q.id} - {q.concept}")
else:
    print(f"NO available questions for {concept} after exclusions")

# Test mastery_service directly
next_q = mastery_service.get_next_question(user, concept)
if next_q:
    print(f"Mastery service returned: {next_q.id} - {next_q.concept}")
else:
    print("Mastery service returned None!")
