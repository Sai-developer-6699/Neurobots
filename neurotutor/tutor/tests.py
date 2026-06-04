from django.test import TestCase
from tutor.models import Question, Response
from tutor.services.mastery_service import MasteryService

# Create your tests here.
print(f"Total questions: {Question.objects.count()}")

# Check by concept
from django.db.models import Count
stats = Question.objects.values('concept', 'bloom_level').annotate(count=Count('id'))
for stat in stats:
    print(f"{stat['concept']} - {stat['bloom_level']}: {stat['count']}")