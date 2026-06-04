"""
Phase 8 Prerequisite Verification Script
Run from the neurotutor/ directory:
    python scripts/verify_phase8_readiness.py
"""
import os, sys, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurotutor.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"
results = {}

# ── 1. Models ────────────────────────────────────────────────────────────────
def check_models():
    print("\n── 1. Database Models ──────────────────────────────────────────")
    from tutor.models import Question, Mastery, LearningEvent
    from tutor.models import Response as QuizResponse
    from django.contrib.auth import get_user_model
    User = get_user_model()

    counts = {
        'Users':          User.objects.count(),
        'Questions':      Question.objects.count(),
        'Responses':      QuizResponse.objects.count(),
        'Masteries':      Mastery.objects.count(),
        'LearningEvents': LearningEvent.objects.count(),
    }
    ok = True
    for name, count in counts.items():
        needed = 1 if name != 'Masteries' else 0
        status = PASS if count >= needed else WARN
        if count == 0 and name in ('Users', 'Questions'):
            status = FAIL; ok = False
        print(f"  {status}  {name}: {count}")
    results['Models'] = ok
    return ok

# ── 2. AI Service methods ────────────────────────────────────────────────────
def check_ai_service():
    print("\n── 2. AI Service ───────────────────────────────────────────────")
    try:
        from tutor.ai_service import ai_service
        required = ['evaluate_answer', 'generate_feedback',
                    'generate_socratic_hint', 'generate_explanation']
        ok = True
        for m in required:
            has = hasattr(ai_service, m)
            print(f"  {PASS if has else FAIL}  {m}")
            if not has: ok = False
        results['AI Service'] = ok
        return ok
    except Exception as e:
        print(f"  {FAIL}  Import error: {e}")
        results['AI Service'] = False
        return False

# ── 3. Async views ───────────────────────────────────────────────────────────
def check_async_views():
    print("\n── 3. Async Views (ADRF) ───────────────────────────────────────")
    try:
        import tutor.views as v
        has_adrf = hasattr(v, 'submit_answer')
        import inspect
        is_async = inspect.iscoroutinefunction(v.submit_answer)
        print(f"  {PASS if has_adrf else FAIL}  submit_answer view exists")
        print(f"  {PASS if is_async else FAIL}  submit_answer is async")
        results['Async Views'] = has_adrf and is_async
        return has_adrf and is_async
    except Exception as e:
        print(f"  {FAIL}  {e}")
        results['Async Views'] = False
        return False

# ── 4. Concept Graph ─────────────────────────────────────────────────────────
def check_concept_graph():
    print("\n── 4. Concept Graph ────────────────────────────────────────────")
    try:
        from tutor.data.concept_graph import CONCEPT_GRAPH, get_concept_info, get_learning_path
        count = len(CONCEPT_GRAPH)
        ok = count >= 10
        print(f"  {PASS if ok else FAIL}  {count} concepts defined")
        # Smoke test
        info = get_concept_info("recursion")
        has_prereqs = len(info.get('prerequisites', [])) > 0
        print(f"  {PASS if has_prereqs else WARN}  recursion prerequisites: {info.get('prerequisites', [])}")
        # Learning path test
        path = get_learning_path("variables", "recursion")
        print(f"  {PASS if path else WARN}  variables→recursion path: {' → '.join(path) if path else 'not found'}")
        results['Concept Graph'] = ok
        return ok
    except Exception as e:
        print(f"  {FAIL}  {e}")
        results['Concept Graph'] = False
        return False

# ── 5. LearningEvent logging ─────────────────────────────────────────────────
def check_learning_events():
    print("\n── 5. LearningEvent Logging ────────────────────────────────────")
    try:
        from tutor.models import LearningEvent
        # smoke-test field existence
        fields = [f.name for f in LearningEvent._meta.get_fields()]
        needed = {'event_type', 'payload', 'created_at', 'user'}
        missing = needed - set(fields)
        ok = len(missing) == 0
        print(f"  {PASS if ok else FAIL}  Required fields present" + (f" (missing: {missing})" if missing else ""))
        results['LearningEvent'] = ok
        return ok
    except Exception as e:
        print(f"  {FAIL}  {e}")
        results['LearningEvent'] = False
        return False

# ── 6. Performance tracking data ─────────────────────────────────────────────
def check_test_data():
    print("\n── 6. Performance Data ─────────────────────────────────────────")
    from django.contrib.auth import get_user_model
    from tutor.models import Response as QuizResponse, Question
    User = get_user_model()

    q_count = Question.objects.count()
    u_count = User.objects.count()
    r_count = QuizResponse.objects.count()

    q_ok = q_count >= 20
    u_ok = u_count >= 1
    r_ok = r_count >= 5

    print(f"  {PASS if q_ok else WARN}  Questions: {q_count} (need 20+)")
    print(f"  {PASS if u_ok else WARN}  Users: {u_count} (need 1+)")
    print(f"  {PASS if r_ok else WARN}  Responses: {r_count} (need 5+)")

    # Check if user has recent responses for difficulty agent
    user = User.objects.first()
    if user:
        recent = QuizResponse.objects.filter(user=user).order_by('-timestamp')[:5]
        print(f"  {PASS if len(recent) >= 5 else WARN}  Recent responses for '{user.email}': {len(recent)}")

    results['Test Data'] = q_ok  # Questions is the critical one
    return q_ok

# ── 7. Agents directory ──────────────────────────────────────────────────────
def check_agents_dir():
    print("\n── 7. Agents Directory ─────────────────────────────────────────")
    import pathlib
    agents_dir = pathlib.Path(__file__).parent.parent / 'tutor' / 'agents'
    init_file = agents_dir / '__init__.py'
    dir_ok = agents_dir.is_dir()
    init_ok = init_file.is_file()
    print(f"  {PASS if dir_ok else FAIL}  tutor/agents/ directory")
    print(f"  {PASS if init_ok else FAIL}  tutor/agents/__init__.py")
    results['Agents Dir'] = dir_ok and init_ok
    return dir_ok and init_ok

# ── 8. Throttle classes ──────────────────────────────────────────────────────
def check_throttling():
    print("\n── 8. Rate Limiting ────────────────────────────────────────────")
    try:
        from tutor.views import HintThrottle, ExplanationThrottle, SubmitThrottle, _check_throttle
        print(f"  {PASS}  HintThrottle ({HintThrottle.rate})")
        print(f"  {PASS}  ExplanationThrottle ({ExplanationThrottle.rate})")
        print(f"  {PASS}  SubmitThrottle ({SubmitThrottle.rate})")
        results['Rate Limiting'] = True
        return True
    except Exception as e:
        print(f"  {FAIL}  {e}")
        results['Rate Limiting'] = False
        return False

# ── Summary ──────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  NEUROTUTOR — PHASE 8 READINESS CHECK")
    print("=" * 60)

    check_models()
    check_ai_service()
    check_async_views()
    check_concept_graph()
    check_learning_events()
    check_test_data()
    check_agents_dir()
    check_throttling()

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    for check, passed in results.items():
        print(f"  {PASS if passed else FAIL}  {check}")

    all_pass = all(results.values())
    critical = all(results.get(k, False) for k in ['Models', 'AI Service', 'Async Views', 'Concept Graph'])

    print("\n" + "=" * 60)
    if all_pass:
        print("  ✅  ALL CHECKS PASSED — READY FOR PHASE 8")
    elif critical:
        print("  ⚠️   CRITICAL CHECKS PASS — PHASE 8 CAN START")
        print("       (fix warnings before completion)")
    else:
        print("  ❌  NOT READY — Fix FAIL items above first")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    main()
