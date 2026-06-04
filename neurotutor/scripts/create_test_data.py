"""
Create test data for Phase 8 multi-agent system testing.
Run from neurotutor/ directory:
    python scripts/create_test_data.py
"""
import os, sys, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from tutor.models import Question, Mastery, LearningEvent
from tutor.models import Response as QuizResponse

User = get_user_model()

def create_test_users():
    print("\n── Creating Test Users ──────────────────────────────────────────")
    users = []
    specs = [
        ('phase8_improver@neurotutor.test', 'Improving User'),
        ('phase8_struggling@neurotutor.test', 'Struggling User'),
        ('phase8_expert@neurotutor.test', 'Expert User'),
    ]
    for email, name in specs:
        try:
            user = User.objects.get(email=email)
            print(f"  ♻️  Existing: {email}")
        except User.DoesNotExist:
            user = User(email=email, name=name)
            user.set_password('testpass123')
            user.save()
            print(f"  ✅  Created: {email}")
        users.append(user)
    return users

def create_responses(users):
    print("\n── Creating Response Patterns ───────────────────────────────────")
    questions = list(Question.objects.all()[:15])
    if len(questions) < 5:
        print("  ❌  Need at least 5 questions. Run ingest_content.py or seed_questions first.")
        return

    improver, struggling, expert = users

    # Pattern 1: Improving (first 3 wrong, last 7 correct) → difficulty agent should say "advance"
    QuizResponse.objects.filter(user=improver).delete()
    for i, q in enumerate(questions[:10]):
        QuizResponse.objects.create(
            user=improver, question=q,
            submitted_answer='wrong answer' if i < 3 else q.correct_answer,
            is_correct=(i >= 3),
            timestamp=timezone.now() - timezone.timedelta(minutes=10 - i)
        )
    print(f"  ✅  Improver: 3 wrong → 7 correct (expect 'advance' recommendation)")

    # Pattern 2: Struggling (8 wrong, 2 correct) → difficulty agent should say "remediate"
    QuizResponse.objects.filter(user=struggling).delete()
    for i, q in enumerate(questions[:10]):
        QuizResponse.objects.create(
            user=struggling, question=q,
            submitted_answer=q.correct_answer if i < 2 else 'wrong answer',
            is_correct=(i < 2),
            timestamp=timezone.now() - timezone.timedelta(minutes=10 - i)
        )
    print(f"  ✅  Struggling: 2 correct → 8 wrong (expect 'remediate' recommendation)")

    # Pattern 3: Expert (all correct) → difficulty agent should say "advance"
    QuizResponse.objects.filter(user=expert).delete()
    for i, q in enumerate(questions[:10]):
        QuizResponse.objects.create(
            user=expert, question=q,
            submitted_answer=q.correct_answer,
            is_correct=True,
            timestamp=timezone.now() - timezone.timedelta(minutes=10 - i)
        )
    print(f"  ✅  Expert: all 10 correct (expect 'advance' recommendation)")

def create_masteries(users):
    print("\n── Creating Mastery Records ─────────────────────────────────────")
    improver, struggling, expert = users
    from tutor.services.mastery_service import MasteryService
    bloom_levels = MasteryService.BLOOM_LEVELS

    concepts_for_test = ['functions', 'recursion', 'arrays', 'sorting', 'trees']

    for concept in concepts_for_test:
        Mastery.objects.get_or_create(
            user=improver, concept=concept,
            defaults={'current_level': 'understand'}
        )
        Mastery.objects.get_or_create(
            user=struggling, concept=concept,
            defaults={'current_level': 'remember'}
        )
        Mastery.objects.get_or_create(
            user=expert, concept=concept,
            defaults={'current_level': 'apply'}
        )

    print(f"  ✅  Mastery records for {len(concepts_for_test)} concepts × 3 users")

def verify_data():
    print("\n── Verification ─────────────────────────────────────────────────")
    for email in [
        'phase8_improver@neurotutor.test',
        'phase8_struggling@neurotutor.test',
        'phase8_expert@neurotutor.test',
    ]:
        try:
            u = User.objects.get(email=email)
            r_count = QuizResponse.objects.filter(user=u).count()
            m_count = Mastery.objects.filter(user=u).count()
            print(f"  ✅  {u.name}: {r_count} responses, {m_count} masteries")
        except User.DoesNotExist:
            print(f"  ❌  {email} not found")

def main():
    print("=" * 60)
    print("  PHASE 8 TEST DATA CREATION")
    print("=" * 60)
    users = create_test_users()
    create_responses(users)
    create_masteries(users)
    verify_data()
    print("\n  ✅  Test data ready. Run verify_phase8_readiness.py to confirm.\n")

if __name__ == '__main__':
    main()
