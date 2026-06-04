import os
import sys

sys.path.append(r"d:\CodingProjects\Competition\AI_Championship_Cup\neurotutor")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "neurotutor.settings")

import django
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from tutor.views import skip_question, get_manual_review_queue
from tutor.models import User, Question
from adrf.requests import AsyncRequest

factory = APIRequestFactory()
user = User.objects.first()
q = Question.objects.first()

print("Testing SKIP...")
request = factory.post(f'/api/question/{q.id}/skip/')
force_authenticate(request, user=user)
try:
    resp = skip_question(request, question_id=q.id)
    resp.render()
    print('SKIP RESULT:', resp.content.decode())
except Exception as e:
    import traceback
    traceback.print_exc()

print("Testing QUEUE...")
request2 = factory.get('/api/review/queue/')
force_authenticate(request2, user=user)
try:
    resp2 = get_manual_review_queue(request2)
    resp2.render()
    print('QUEUE RESULT:', resp2.content.decode())
except Exception as e:
    import traceback
    traceback.print_exc()
