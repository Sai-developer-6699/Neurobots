"""
Test: Daily Goal Celebration Trigger
Verifies that goal_completed=True fires exactly on the 5th correct answer,
and that the counter never exceeds DAILY_GOAL_TARGET.

Run with:
    python test_daily_goal.py
from the neurotutor/ directory.
"""
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from tutor.models import UserProfile
from tutor.services.gamification_service import gamification_service

User = get_user_model()

# ── Setup test user ──────────────────────────────────────────────────────────
TEST_EMAIL = 'goaltest@neurotutor.test'
try:
    user = User.objects.get(email=TEST_EMAIL)
    print(f"Using existing test user: {user.email}")
except User.DoesNotExist:
    user = User(email=TEST_EMAIL, name='Goal Tester')
    user.set_password('testpass123')
    user.save()
    print(f"Created test user: {user.email}")

# Reset profile to a clean today-state
profile, _ = UserProfile.objects.get_or_create(user=user)
today = timezone.now().date()
profile.xp = 0
profile.level = 1
profile.streak_days = 0
profile.daily_goal_progress = 0
profile.last_daily_goal_date = today   # already today so no reset fires
profile.last_activity_date = today - timezone.timedelta(days=1)  # yesterday → streak will increment
profile.save()

print(f"\n{'='*60}")
print(f"TEST: Daily Goal Celebration Trigger")
print(f"DAILY_GOAL_TARGET = {gamification_service.DAILY_GOAL_TARGET}")
print(f"XP_PER_QUESTION   = {gamification_service.XP_PER_QUESTION}")
print(f"XP_DAILY_GOAL     = {gamification_service.XP_DAILY_GOAL}")
print(f"{'='*60}\n")

PASS = "✅ PASS"
FAIL = "❌ FAIL"
results = []

# ── Simulate 7 correct answers ───────────────────────────────────────────────
for i in range(1, 8):
    stats = gamification_service.update_user_stats(user=user, xp_gain=gamification_service.XP_PER_QUESTION)

    goal_completed = stats.get('goal_completed', False)
    daily_progress = stats['daily_goal_progress']
    target         = gamification_service.DAILY_GOAL_TARGET

    # Assertions
    never_exceeds = daily_progress <= target
    fires_at_5    = (i == target) == goal_completed   # True only on 5th
    no_double_fire = not (i > target and goal_completed)

    status = PASS if (never_exceeds and fires_at_5 and no_double_fire) else FAIL
    results.append(status == PASS)

    print(f"Answer #{i:2d} | progress={daily_progress}/{target} | "
          f"goal_completed={goal_completed} | xp={stats['xp']} | {status}")

    if not never_exceeds:
        print(f"         ⚠️  OVERFLOW: progress {daily_progress} > target {target}")
    if not fires_at_5:
        expected = i == target
        print(f"         ⚠️  goal_completed should be {expected}, got {goal_completed}")
    if not no_double_fire:
        print(f"         ⚠️  goal_completed fired again after target reached!")

print(f"\n{'='*60}")
all_pass = all(results)
print(f"RESULT: {'ALL TESTS PASSED ✅' if all_pass else 'SOME TESTS FAILED ❌'}")
print(f"{'='*60}\n")

# ── Verify XP bonus was awarded exactly once ─────────────────────────────────
profile.refresh_from_db()
# All 7 answers earn XP (10 each), plus 50 bonus when goal hit at answer #5
expected_xp = (gamification_service.XP_PER_QUESTION * 7) + gamification_service.XP_DAILY_GOAL
actual_xp = profile.xp
bonus_check = actual_xp == expected_xp
print(f"\nXP Check: expected={expected_xp}, actual={actual_xp} → {'✅ PASS' if bonus_check else '❌ FAIL'}")
print(f"  (7 answers × {gamification_service.XP_PER_QUESTION} XP + {gamification_service.XP_DAILY_GOAL} bonus = {expected_xp})")
print(f"  Note: daily_goal_progress capped at 5, but XP still awarded for all correct answers\n")

# ── Cleanup ──────────────────────────────────────────────────────────────────
user.delete()
print("Test user cleaned up.")
