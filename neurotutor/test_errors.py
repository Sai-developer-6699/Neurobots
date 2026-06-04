import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')

import django
django.setup()

from django.test import RequestFactory
from tutor.views import skip_question, mark_for_review, get_review_queue
from tutor.models import User, Question

user = User.objects.first()
q = Question.objects.first()

rf = RequestFactory()
req = rf.post(f'/api/question/{q.id}/skip/')
req.user = user

try:
    resp = skip_question(req, question_id=q.id)
    resp.render()
    print("Skip Question Output:", resp.content)
except Exception as e:
    import traceback
    traceback.print_exc()

req2 = rf.get('/api/review/queue/')
req2.user = user
try:
    resp2 = get_review_queue(req2)
    resp2.render()
    print("Get Review Queue Output:", resp2.content)
except Exception as e:
    import traceback
    traceback.print_exc()
