from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, QuestionSerializer
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from .models import Question, Response as UserResponse, LearningEvent, Response as QuizResponse, Mastery, UserQuestionInteraction, SkippedQuestion, ManualReviewQueue
from adrf.decorators import api_view as async_api_view  # Use ADRF
from .ai_service import ai_service
import traceback
from .agents.orchestrator import orchestrator
from asgiref.sync import sync_to_async
from .services.mastery_service import mastery_service, MasteryService
from .services.adaptive_service import AdaptiveService
from .services.spaced_repetition_service import spaced_repetition_service
from .services.gamification_service import gamification_service
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Rate Throttle Classes ────────────────────────────────────────────────────
class HintThrottle(UserRateThrottle):
    """10 hints per hour per user — prevents LLM quota exhaustion"""
    rate = '10/hour'
    scope = 'hint'

class ExplanationThrottle(UserRateThrottle):
    """5 explanations per hour per user"""
    rate = '5/hour'
    scope = 'explanation'

class SubmitThrottle(UserRateThrottle):
    """120 answer submissions per hour per user (~2/min)"""
    rate = '120/hour'
    scope = 'submit'


def _check_throttle(request, throttle_class):
    """
    Manually run a DRF throttle class against a request.
    Returns a 429 Response if throttled, else None.
    Compatible with both sync and async views.
    """
    throttle = throttle_class()
    if not throttle.allow_request(request, None):
        wait = throttle.wait()
        resp = Response(
            {'error': 'Rate limit exceeded. Please slow down.',
             'retry_after': int(wait) if wait else 60},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
        if wait:
            resp['Retry-After'] = int(wait)
        return resp
    return None

# Initialize Adaptive Service
adaptive_service = AdaptiveService()


def index(request):
    return render(request, 'index.html')


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Production health check. Returns 200 if app is up.
    Optional: ?db=1 to check database connectivity.
    """
    from django.db import connection
    payload = {'status': 'ok'}
    if request.query_params.get('db'):
        try:
            connection.ensure_connection()
            payload['db'] = 'ok'
        except Exception as e:
            logger.exception("Health check DB failed")
            return Response({'status': 'error', 'db': 'failed'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response(payload, status=status.HTTP_200_OK)


User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Please provide both email and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.check_password(password):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user by blacklisting refresh token"""
    try:
        refresh_token = request.data.get('refresh_token')
        token = RefreshToken(refresh_token)
        token.blacklist()  # This requires token blacklist app
        
        return Response(
            {'message': 'Successfully logged out'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_random_question(request):
    """
    ASYNC: Get an adaptive question based on the user's current mastery level.
    Falls back to random if no adaptive question is available.
    Accepts optional ?concept= query param to filter by concept.
    """
    concept = request.query_params.get('concept', None)

    # Try adaptive selection first (async wrapper)
    try:
        question = await sync_to_async(mastery_service.get_next_question)(request.user, concept=concept)
    except Exception as e:
        logger.warning(f"Adaptive question selection failed, falling back to random: {e}")
        question = None

    # Fallback: random question (async wrapper)
    if not question:
        def _get_random():
            from tutor.models import SkippedQuestion, Response as UserResponse
            answered_correctly = UserResponse.objects.filter(
                user=request.user, is_correct=True
            ).values_list('question_id', flat=True)
            skipped = SkippedQuestion.objects.filter(
                user=request.user
            ).values_list('question_id', flat=True)
            excluded_ids = list(answered_correctly) + list(skipped)

            qs = Question.objects.exclude(id__in=excluded_ids)
            if concept:
                qs = qs.filter(concept__iexact=concept)
            return qs.order_by('?').first()
        
        question = await sync_to_async(_get_random)()

    if not question:
        return Response({'error': 'No questions available'}, status=404)

    serializer = QuestionSerializer(question)
    data = serializer.data

    # Phase 8: include prerequisite_hint and latencies via ConceptMapper
    # Uses the ConceptMapperAgent via the orchestrator (now awaited natively)
    try:
        agent_result = await orchestrator.get_concept_map(
            concept=question.concept,
            user_id=request.user.pk,
        )
        if isinstance(agent_result, dict):
            data['prerequisite_hint'] = agent_result.get('prerequisite_hint', '')
            # Pass latencies so the "Agent Terminal" in frontend lights up
            if 'latencies' in agent_result:
                data['agent_latencies'] = agent_result['latencies']
    except Exception as e:
        logger.warning(f"Failed to enrich random question with concept map: {e!r}")

    return Response(data)


# ... (Previous code)



# ── Specific Question ───────────────────────────────────────────────────

@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_question_by_id(request, question_id):
    """
    Fetch a specific question by ID, primarily used for practicing explicit questions
    from the Manual Review queue.
    """
    try:
        question = await sync_to_async(get_object_or_404)(Question, id=question_id)
        serializer = QuestionSerializer(question)
        data = serializer.data
        
        # Phase 8: include prerequisite_hint and latencies via ConceptMapper
        try:
            agent_result = await orchestrator.get_concept_map(
                concept=question.concept,
                user_id=request.user.pk,
            )
            if isinstance(agent_result, dict):
                data['prerequisite_hint'] = agent_result.get('prerequisite_hint', '')
                if 'latencies' in agent_result:
                    data['agent_latencies'] = agent_result['latencies']
        except Exception as e:
            logger.warning(f"Failed to enrich specific question with concept map: {e!r}")
            
        return Response(data)
    except Exception as e:
        logger.error(f"Error fetching question {question_id}: {e}")
        return Response({'error': 'Failed to fetch question'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── Quality Rating (Memory) ───────────────────────────────────────────────────
@async_api_view(['POST'])
@permission_classes([IsAuthenticated])
async def rate_review(request):
    """
    Called after a specific question is answered right, to just schedule spaced repetition.
    Accepts question_id and quality.
    """
    question_id = request.data.get('question_id')
    quality = request.data.get('quality')
    
    if not question_id or quality is None:
        return Response({'error': 'question_id and quality are required'}, status=400)
        
    try:
        from tutor.models import Question
        from tutor.services.spaced_repetition_service import spaced_repetition_service
        question = await sync_to_async(get_object_or_404)(Question, id=question_id)
        
        # Schedule the review
        await sync_to_async(spaced_repetition_service.schedule_review)(
            user=request.user,
            question=question,
            quality=int(quality)
        )
        
        # Ensure it's removed from manual review queue
        def _clear_review_flag():
            from tutor.models import UserQuestionInteraction, ManualReviewQueue
            UserQuestionInteraction.objects.filter(
                user=request.user, 
                question=question
            ).update(wants_manual_review=False)
            
            ManualReviewQueue.objects.filter(
                user=request.user,
                question=question
            ).delete()
        await sync_to_async(_clear_review_flag)()
        
        return Response({'success': True})
    except Exception as e:
        logger.error(f"Error in rate_review for {question_id}: {e}")
        return Response({'error': 'Failed to schedule review'}, status=500)


# ✅ ASYNC VIEW - Use @async_api_view from ADRF
@async_api_view(['POST'])
@permission_classes([IsAuthenticated])
async def submit_answer(request):
    """
    ASYNC: Submit answer with AI feedback (rate-limited: 120/hour)
    """
    throttle_response = _check_throttle(request, SubmitThrottle)
    if throttle_response:
        return throttle_response

    question_id = request.data.get('question_id')
    user_answer = request.data.get('submitted_answer', '').strip()
    quality = request.data.get('quality')  # 0-5 (optional)
    
    if not question_id or not user_answer:
        return Response(
            {'error': 'question_id and submitted_answer are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Async DB queries
    try:
        question = await sync_to_async(Question.objects.get)(id=question_id)
    except Question.DoesNotExist:
        return Response(
            {'error': 'Question not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Phase 8: delegate to AgentOrchestrator (evaluation + hint + difficulty + concept_map)
    agent_output = await orchestrator.evaluate_answer(
        user=request.user,
        question=question,
        user_answer=user_answer,
    )
    is_correct          = agent_output.get('is_correct', False)
    verdict             = agent_output.get('verdict', 'incorrect')
    confidence          = agent_output.get('confidence', 0.0)
    eval_explanation    = agent_output.get('reasoning', '')
    _agent_hint         = agent_output.get('hint', None)
    _difficulty_rec     = agent_output.get('difficulty_recommendation', None)
    _concept_map        = agent_output.get('concept_map', None)
    _prerequisite_hint  = agent_output.get('prerequisite_hint', '')
    _agent_latencies    = agent_output.get('latencies', {})
    
    # Save response (async)
    quiz_response = await sync_to_async(QuizResponse.objects.create)(
        user=request.user,
        question=question,
        submitted_answer=user_answer,
        is_correct=is_correct,
        timestamp=timezone.now()
    )
    
    # Log event (async)
    await sync_to_async(LearningEvent.objects.create)(
        user=request.user,
        event_type='answer_submitted',
        payload={
            'question_id': question_id,
            'is_correct': is_correct,
            'concept': question.concept,
            'bloom_level': question.bloom_level
        }
    )
    
    # Track failures for Adaptive Curriculum + use hint from agent_output as feedback
    ai_feedback = _agent_hint  # hint already generated by HintAgent in stage-2
    if not is_correct:
        await sync_to_async(adaptive_service.track_failure)(
            user=request.user,
            concept=question.concept,
            question_text=question.text
        )
    
    updated_mastery = await sync_to_async(mastery_service.update_mastery)(
        user=request.user,
        concept=question.concept,
        is_correct=is_correct
    )
    
    # Remove from Review Queue if answered correctly
    if is_correct:
        def _clear_review_flag():
            # Clear the flag in UserQuestionInteraction
            UserQuestionInteraction.objects.filter(
                user=request.user, 
                question=question
            ).update(wants_manual_review=False)
            
            # Delete from ManualReviewQueue if it exists
            ManualReviewQueue.objects.filter(
                user=request.user,
                question=question
            ).delete()
        await sync_to_async(_clear_review_flag)()

    # Schedule Review (Spaced Repetition)
    if is_correct and quality is not None:
        try:
            await sync_to_async(spaced_repetition_service.schedule_review)(
                user=request.user,
                question=question,
                quality=int(quality)
            )
        except Exception as e:
            logger.error(f"Error scheduling review: {e}")
            
    # Gamification: Update stats (Async wrapper around sync service)
    xp_gained = 0
    new_level = 0
    streak_days = 0
    daily_goal_progress = 0
    goal_completed = False
    
    if is_correct:
        try:
            stats = await sync_to_async(gamification_service.update_user_stats)(
                user=request.user,
                xp_gain=gamification_service.XP_PER_QUESTION
            )
            xp_gained = gamification_service.XP_PER_QUESTION
            new_level = stats['level']
            streak_days = stats['streak_days']
            daily_goal_progress = stats['daily_goal_progress']
            goal_completed = stats.get('goal_completed', False)
        except Exception as e:
            logger.error(f"Error updating gamification stats: {e}")

    
    # Build user-facing message based on verdict
    if verdict == 'correct':
        verdict_message = f"✅ Correct — {eval_explanation}"
    elif verdict == 'partial':
        verdict_message = f"🟡 Partially correct — {eval_explanation}"
    else:
        verdict_message = f"❌ Incorrect — {eval_explanation}"

    return Response({
        'response_id': quiz_response.id,
        'is_correct': is_correct,
        # Evaluation details
        'verdict': verdict,
        'confidence': confidence,
        'verdict_message': verdict_message,
        # AI feedback / hint
        'feedback': ai_feedback,
        'concept': question.concept,
        'bloom_level': question.bloom_level,
        'correct_answer': question.correct_answer if not is_correct else None,
        'next_action': 'continue' if is_correct else 'retry_or_hint',
        'needs_quality_rating': is_correct and quality is None,
        # Mastery info
        'current_mastery': updated_mastery.current_level,
        'mastery_progress': f"{MasteryService.BLOOM_LEVELS[updated_mastery.current_level]}/6",
        # Gamification info
        'xp_gained': xp_gained,
        'new_level': new_level,
        'streak_days': streak_days,
        'daily_goal_progress': daily_goal_progress,
        'goal_completed': goal_completed,
        # Phase 8 — multi-agent extras
        'difficulty_recommendation': _difficulty_rec,
        'concept_map': _concept_map,
        'prerequisite_hint': _prerequisite_hint,
        'agent_latencies': _agent_latencies,
    }, status=status.HTTP_200_OK)


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_hint(request):
    """
    ASYNC: Get Socratic hint for a question (rate-limited: 10/hour)
    """
    # Rate limit check
    throttle_response = _check_throttle(request, HintThrottle)
    if throttle_response:
        return throttle_response

    question_id = request.query_params.get('question_id')
    
    if not question_id:
        return Response(
            {'error': 'question_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Async DB query
    try:
        question = await sync_to_async(Question.objects.get)(id=question_id)
    except Question.DoesNotExist:
        return Response(
            {'error': 'Question not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Count previous attempts (async)
    attempt_count = await sync_to_async(
        QuizResponse.objects.filter(
            user=request.user,
            question=question
        ).count
    )()
    
    # Phase 8: delegate to HintAgent via orchestrator
    hint_data = await orchestrator.get_hint(user=request.user, question=question)

    return Response({
        'hint': hint_data.get('hint', ''),
        'hint_level': hint_data.get('hint_level', 1),
        'attempt_count': attempt_count,
        'can_show_answer': attempt_count >= 3
    }, status=status.HTTP_200_OK)


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_explanation(request):
    """
    Get full explanation after multiple failed attempts (rate-limited: 5/hour)
    """
    # Rate limit check
    throttle_response = _check_throttle(request, ExplanationThrottle)
    if throttle_response:
        return throttle_response

    question_id = request.query_params.get('question_id')
    
    if not question_id:
        return Response(
            {'error': 'question_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        question = await sync_to_async(Question.objects.get)(id=question_id)
    except Question.DoesNotExist:
        return Response(
            {'error': 'Question not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # (Removed artificial attempt requirement here)
    
    # Phase 8: delegate to ExplanationAgent via orchestrator
    try:
        explanation_data = await orchestrator.get_explanation(user=request.user, question=question)
        explanation_text = explanation_data.get('explanation', '')
        key_concepts = explanation_data.get('key_concepts', [])
        analogy = explanation_data.get('analogy', '')
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        explanation_text = None
        key_concepts = []
        analogy = ''

    return Response({
        'explanation': explanation_text or 'Unable to generate explanation. Please try again.',
        'key_concepts': key_concepts,
        'analogy': analogy,
        'correct_answer': question.correct_answer,
        'status': 'success' if explanation_text else 'fallback'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    """Get user statistics for dashboard"""
    user = request.user
    
    # Calculate stats
    total_questions = UserResponse.objects.filter(user=user).count()
    correct_answers = UserResponse.objects.filter(user=user, is_correct=True).count()
    incorrect_answers = total_questions - correct_answers
    
    # Get recent activity
    recent_responses = UserResponse.objects.filter(user=user).order_by('-timestamp')[:10]
    recent_data = []
    for response in recent_responses:
        recent_data.append({
            'question': response.question.text,
            'is_correct': response.is_correct,
            'timestamp': response.timestamp.isoformat()
        })
    
    return Response({
        'total_questions': total_questions,
        'correct_answers': correct_answers,
        'incorrect_answers': incorrect_answers,
        'recent_activity': recent_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_question_history(request):
    """Get user's question history"""
    user = request.user
    responses = UserResponse.objects.filter(user=user).order_by('-timestamp')
    data = []
    for response in responses:
        data.append({
            'question': response.question.text,
            'submitted_answer': response.submitted_answer,
            'is_correct': response.is_correct,
            'timestamp': response.timestamp.isoformat()
        })
    return Response(data)

@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_mastery_summary(request):
    """
    Get user's overall mastery statistics.
    Optional query params: ?limit= & ?offset= for paginating concepts list.
    """
    summary = await sync_to_async(mastery_service.get_mastery_summary)(
        request.user
    )
    try:
        limit = int(request.query_params.get('limit', 0)) or 0
        offset = int(request.query_params.get('offset', 0)) or 0
    except (TypeError, ValueError):
        limit, offset = 0, 0
    if limit > 0 or offset > 0:
        concepts = summary.get('concepts', [])
        total = len(concepts)
        if offset > 0 or limit > 0:
            end = (offset + limit) if limit > 0 else None
            summary = {**summary, 'concepts': concepts[offset:end], 'total_concepts': total}
    return Response(summary)


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_next_question(request):
    """
    Get adaptive next question based on mastery
    """
    
    concept = request.query_params.get('concept')
    
    question = await sync_to_async(mastery_service.get_next_question)(
        request.user,
        concept
    )
    
    if not question:
        # Get recommended concepts
        recommended = await sync_to_async(mastery_service.get_recommended_concepts)(
            request.user
        )
        
        return Response({
            'message': 'No more questions available' if concept else 'All questions mastered!',
            'concept': concept,
            'recommended_concepts': recommended,
            'should_advance': True
        })
    
    # Get current mastery for this concept
    try:
        mastery = await sync_to_async(Mastery.objects.get)(
            user=request.user,
            concept=question.concept
        )
        current_level = mastery.current_level
    except Mastery.DoesNotExist:
        current_level = 'remember'
    
    return Response({
        'question': {
            'id': question.id,
            'text': question.text,
            'concept': question.concept,
            'bloom_level': question.bloom_level,
            'difficulty': question.difficulty
        },
        'current_mastery': current_level,
        'target_level': question.bloom_level
    })


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_recommended_concepts(request):
    """
    Get concepts user should focus on
    """
    
    limit = int(request.query_params.get('limit', 3))
    
    recommended = await sync_to_async(mastery_service.get_recommended_concepts)(
        request.user,
        limit
    )
    
    return Response(recommended)


# ==========================================
# Spaced Repetition Views (Phase 5)
# ==========================================

@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_review_queue(request):
    """
    Get questions due for review (SM-2)
    """
    limit = int(request.query_params.get('limit', 20))
    
    due_reviews = await sync_to_async(spaced_repetition_service.get_due_reviews)(
        request.user, 
        limit
    )
    
    questions = []
    # Async iteration over synchronous query results needs care, but list() was called in service
    for review in due_reviews:
        questions.append({
            'id': review.question.id,
            'text': review.question.text,
            'concept': review.question.concept,
            'bloom_level': review.question.bloom_level,
            'correct_answer': review.question.correct_answer, # Send answer for self-grading
            'review_data': {
                'ease_factor': review.ease_factor,
                'repetition': review.repetition_count,
                'last_interval': review.last_interval
            }
        })
    
    return Response({
        'questions': questions,
        'count': len(questions)
    })


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_review_stats(request):
    """
    Get review statistics
    """
    stats = await sync_to_async(spaced_repetition_service.get_review_stats)(
        request.user
    )
    
    return Response(stats)


# ==========================================
# Gamification Views (Phase 6)
# ==========================================

@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_heatmap_data(request):
    """
    Get activity heatmap data (last 365 days)
    """
    data = await sync_to_async(gamification_service.get_heatmap_data)(
        request.user
    )
    return Response(data)


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_leaderboard(request):
    """
    Get top users by XP
    """
    leaderboard = await sync_to_async(gamification_service.get_leaderboard)(
        limit=5
    )

    data = []
    for profile in leaderboard:
        # Use .name (custom User model has no .username field)
        display_name = getattr(profile.user, 'name', None) or profile.user.email.split('@')[0]
        data.append({
            'username': display_name,
            'xp': profile.xp,
            'level': profile.level,
            'avatar': None
        })

    return Response(data)


@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_user_stats(request):
    """
    Get current user's gamification stats: XP, level, streak, daily goal.
    Called by the frontend at /gamification/me/
    """
    profile = await sync_to_async(gamification_service.get_or_create_profile)(
        request.user
    )
    today = timezone.now().date()

    # Reset daily goal if it's a new day
    if profile.last_daily_goal_date != today:
        daily_progress = 0
    else:
        daily_progress = profile.daily_goal_progress

    return Response({
        'xp':                   profile.xp,
        'level':                profile.level,
        'streak_days':          profile.streak_days,
        'daily_goal_progress':  daily_progress,
        'daily_goal_target':    gamification_service.DAILY_GOAL_TARGET,
        'last_activity_date':   profile.last_activity_date.isoformat() if profile.last_activity_date else None,
    })


# ── Phase 8: Concept Map endpoint ───────────────────────────────────────────
@async_api_view(['GET'])
@permission_classes([IsAuthenticated])
async def get_concept_map(request):
    """
    GET /api/concept/map/?concept=<name>
    Returns prerequisites, successors, related concepts and a prerequisite hint
    for the requested concept without requiring a specific question.
    """
    concept = request.query_params.get('concept', '').strip()
    if not concept:
        return Response({'error': 'concept is required'}, status=status.HTTP_400_BAD_REQUEST)

    data = await orchestrator.get_concept_map(concept=concept, user_id=request.user.pk)
    return Response(data, status=status.HTTP_200_OK)


@async_api_view(['GET'])
@permission_classes([AllowAny])
async def get_course_material(request):
    """
    Serve course material content for a given concept.
    
    Returns the markdown content of the course material file for the requested concept.
    """
    concept = request.query_params.get('concept', '').strip()
    if not concept:
        return Response({'error': 'concept is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Map concepts to course material paths
    concept_to_material_path = {
        # Data Structures
        'arrays': 'data_structures/arrays.md',
        'hash_tables': 'data_structures/hash_tables.md',
        'trees': 'data_structures/trees.md',
        'binary_search_trees': 'data_structures/binary_search_trees.md',
        'heaps': 'data_structures/heaps.md',
        'graphs': 'data_structures/graphs.md',
        'tries': 'data_structures/tries.md',
        
        # Algorithms
        'sorting_algorithms': 'algorithms/sorting.md',
        'searching_algorithms': 'algorithms/searching.md',
        'dynamic_programming': 'algorithms/dynamic_programming.md',
        'greedy_algorithms': 'algorithms/greedy.md',
        'divide_and_conquer': 'algorithms/divide_and_conquer.md',
        'backtracking': 'algorithms/backtracking.md',
        
        # Programming Basics
        'variables': 'programming_basics/variables.md',
        'data_types': 'programming_basics/data_types.md',
        'operators': 'programming_basics/operators.md',
        'conditionals': 'programming_basics/control_flow.md',
        'loops': 'programming_basics/loops.md',
        'functions': 'programming_basics/functions.md',
        'scope': 'programming_basics/scope.md',
        'recursion': 'programming_basics/recursion.md',
        
        # Database Systems
        'database_design': 'database_systems/design.md',
        'sql_basics': 'database_systems/sql.md',
        'normalization': 'database_systems/normalization.md',
        'indexing': 'database_systems/indexing.md',
        'transactions': 'database_systems/transactions.md',
        'acid_properties': 'database_systems/acid.md',
        
        # System Design
        'scalability': 'system_design/scalability.md',
        'load_balancing': 'system_design/load_balancing.md',
        'caching': 'system_design/caching.md',
        'cdn': 'system_design/cdn.md',
        'microservices': 'system_design/microservices.md',
        'api_design': 'system_design/api_design.md',
        'rate_limiting': 'system_design/rate_limiting.md',
        'message_queues': 'system_design/message_queues.md',
        'distributed_systems': 'system_design/distributed_systems.md',
        'database_sharding': 'system_design/database_sharding.md',
        
        # Security
        'authentication': 'security/authentication.md',
        'authorization': 'security/authorization.md',
        'encryption': 'security/encryption.md',
        'hashing': 'security/hashing.md',
        'jwt': 'security/jwt.md',
        'oauth': 'security/oauth.md',
        'ssl_tls': 'security/ssl_tls.md',
        'sql_injection': 'security/sql_injection.md',
        'xss': 'security/xss.md',
        'csrf': 'security/csrf.md',
        
        # Software Engineering
        'solid_principles': 'software_engineering/solid_principles.md',
        'design_patterns': 'software_engineering/design_patterns.md',
        'testing': 'software_engineering/testing.md',
        'debugging': 'software_engineering/debugging.md',
        'code_review': 'software_engineering/code_review.md',
        'version_control': 'software_engineering/version_control.md',
        'documentation': 'software_engineering/documentation.md',
        'refactoring': 'software_engineering/refactoring.md',
        'agile': 'software_engineering/agile.md',
        'sdlc': 'software_engineering/sdlc.md',
        
        # Cloud Computing
        'serverless': 'cloud/serverless.md',
        'lambda': 'cloud/lambda.md',
        'rds': 'cloud/rds.md',
        'cloudformation': 'cloud/cloudformation.md',
        'gcp_basics': 'cloud/gcp.md',
        'azure_basics': 'cloud/azure.md',
        
        # Computer Networks
        'osi_model': 'computer_networks/osi.md',
        'tcp_ip': 'computer_networks/tcp_ip.md',
        'tcp_vs_udp': 'computer_networks/tcp_udp.md',
        'http_https': 'computer_networks/http.md',
        'dns': 'computer_networks/dns.md',
        'subnetting': 'computer_networks/subnetting.md',
        'vpc': 'computer_networks/vpc.md',
        'routing_algorithms': 'computer_networks/routing.md',
        'socket_programming': 'computer_networks/sockets.md',
        'network_security': 'computer_networks/security.md'
    }
    
    # Get the file path for the concept
    file_path = concept_to_material_path.get(concept)
    if not file_path:
        return Response({'error': 'No course material found for this concept'}, status=status.HTTP_404_NOT_FOUND)
    
    # Construct the full file path
    base_path = os.path.join(settings.BASE_DIR, 'data', 'course_materials')
    full_path = os.path.join(base_path, file_path)
    
    try:
        # Read the file content
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return Response({
            'concept': concept,
            'content': content,
            'file_path': file_path
        }, status=status.HTTP_200_OK)
        
    except FileNotFoundError:
        return Response({'error': 'Course material file not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error reading course material for {concept}: {e}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# ── Review and Skip Question API Endpoints ────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_question_for_review(request):
    """
    Add a question to the manual review queue.
    """
    try:
        question_id = request.data.get('question_id')
        if not question_id:
            return Response(
                {'error': 'question_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question = get_object_or_404(Question, id=question_id)
        user = request.user
        
        # Create or get the manual review record
        review_item, created = ManualReviewQueue.objects.get_or_create(
            user=user,
            question=question,
            defaults={'added_at': timezone.now()}
        )
        
        if created:
            logger.info(f"User {user.email} marked question {question_id} for review")
            return Response({
                'success': True,
                'message': 'Question marked for review successfully'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'success': True,
                'message': 'Question already in review queue'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error marking question for review: {e}")
        return Response(
            {'error': 'Failed to mark question for review'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def skip_question(request):
    """
    Log a skip event for a question.
    """
    try:
        question_id = request.data.get('question_id')
        if not question_id:
            return Response(
                {'error': 'question_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question = get_object_or_404(Question, id=question_id)
        user = request.user
        
        # Create or update the skip record
        skip_item, created = SkippedQuestion.objects.get_or_create(
            user=user,
            question=question,
            defaults={'skipped_at': timezone.now(), 'skip_count': 1}
        )
        
        if not created:
            # Increment skip count if already exists
            skip_item.skip_count += 1
            skip_item.save()
        
        logger.info(f"User {user.email} skipped question {question_id} (count: {skip_item.skip_count})")
        return Response({
            'success': True,
            'message': 'Skip logged successfully',
            'skip_count': skip_item.skip_count
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error logging skip: {e}")
        return Response(
            {'error': 'Failed to log skip'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manual_reviews(request):
    """
    Get all questions in the user's manual review queue.
    """
    try:
        user = request.user
        
        # Get all manual review items for the user
        reviews = ManualReviewQueue.objects.filter(user=user).select_related('question').order_by('-added_at')
        
        queue = []
        for review in reviews:
            # Generate mock mastery info as requested by the frontend
            queue.append({
                'id': review.question.id,
                'text': review.question.text,
                'question_text': review.question.text,
                'correct_answer': review.question.correct_answer,
                'concept': review.question.concept,
                'category': review.question.category,
                'sub_category': review.question.sub_category,
                'difficulty': 'medium', # Provide a default difficulty string to match UI colors ('easy', 'medium', 'hard', 'very_hard')
                'bloom_level': review.question.bloom_level,
                'added_at': review.added_at.isoformat(),
                'due_date': review.added_at.isoformat(), # mock for frontend Due Date
                'mastery_level': 0, # mock for frontend Mastery
                'review_streak': 0, # mock for frontend Streak
                'topics': [{'id': 1, 'name': review.question.concept or 'General'}] # mock for frontend badges
            })
            
        return Response({
            'queue': queue,
            'count': len(queue)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting manual reviews: {e}")
        return Response(
            {'error': 'Failed to get manual reviews'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_material(request):
    """
    Get course material for a specific concept.
    Generates a markdown summary via the LLM orchestrator.
    """
    concept = request.GET.get('concept')
    if not concept:
        return Response(
            {'error': 'Missing concept parameter'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        # First, try to serve a local file to save API calls
        import os
        
        # Hardcode the predefined map the frontend used to have or fallback to concept match
        concept_to_path = {
            # Data Structures
            "arrays": "data_structures/arrays.md",
            "hash_tables": "data_structures/hash_tables.md",
            "trees": "data_structures/trees.md",
            "binary_search_trees": "data_structures/binary_search_trees.md",
            "heaps": "data_structures/heaps.md",
            "graphs": "data_structures/graphs.md",
            "tries": "data_structures/tries.md",
            # Algorithms
            "sorting_algorithms": "algorithms/sorting.md",
            "searching_algorithms": "algorithms/searching.md",
            "dynamic_programming": "algorithms/dynamic_programming.md",
            "greedy_algorithms": "algorithms/greedy.md",
            "divide_and_conquer": "algorithms/divide_and_conquer.md",
            "backtracking": "algorithms/backtracking.md",
            # Programming Basics
            "variables": "programming_basics/variables.md",
            "data_types": "programming_basics/data_types.md",
            "operators": "programming_basics/operators.md",
            "conditionals": "programming_basics/control_flow.md",
            "loops": "programming_basics/loops.md",
            "functions": "programming_basics/functions.md",
            "scope": "programming_basics/scope.md",
            "recursion": "programming_basics/recursion.md",
            # Database Systems
            "database_design": "database_systems/design.md",
            "sql_basics": "database_systems/sql.md",
            "normalization": "database_systems/normalization.md",
            "indexing": "database_systems/indexing.md",
            "transactions": "database_systems/transactions.md",
            "acid_properties": "database_systems/acid.md",
            # System Design
            "scalability": "system_design/scalability.md",
            "load_balancing": "system_design/load_balancing.md",
            "caching": "system_design/caching.md",
            "cdn": "system_design/cdn.md",
            "microservices": "system_design/microservices.md",
            "api_design": "system_design/api_design.md",
            "rate_limiting": "system_design/rate_limiting.md",
            "message_queues": "system_design/message_queues.md",
            "distributed_systems": "system_design/distributed_systems.md",
            "database_sharding": "system_design/database_sharding.md",
            # Security
            "authentication": "security/authentication.md",
            "authorization": "security/authorization.md",
            "encryption": "security/encryption.md",
            "hashing": "security/hashing.md",
            "jwt": "security/jwt.md",
            "oauth": "security/oauth.md",
            "ssl_tls": "security/ssl_tls.md",
            "sql_injection": "security/sql_injection.md",
            "xss": "security/xss.md",
            "csrf": "security/csrf.md",
            # Software Engineering
            "solid_principles": "software_engineering/solid_principles.md",
            "design_patterns": "software_engineering/design_patterns.md",
            "testing": "software_engineering/testing.md",
            "debugging": "software_engineering/debugging.md",
            "code_review": "software_engineering/code_review.md",
            "version_control": "software_engineering/version_control.md",
            "documentation": "software_engineering/documentation.md",
            "refactoring": "software_engineering/refactoring.md",
            "agile": "software_engineering/agile.md",
            "sdlc": "software_engineering/sdlc.md",
            # Cloud Computing
            "serverless": "cloud/serverless.md",
            "lambda": "cloud/lambda.md",
            "rds": "cloud/rds.md",
            "cloudformation": "cloud/cloudformation.md",
            "gcp_basics": "cloud/gcp.md",
            "azure_basics": "cloud/azure.md",
            # Computer Networks
            "osi_model": "computer_networks/osi.md",
            "tcp_ip": "computer_networks/tcp_ip.md",
            "tcp_vs_udp": "computer_networks/tcp_udp.md",
            "http_https": "computer_networks/http.md",
            "dns": "computer_networks/dns.md",
            "subnetting": "computer_networks/subnetting.md",
            "vpc": "computer_networks/vpc.md",
            "routing_algorithms": "computer_networks/routing.md",
            "socket_programming": "computer_networks/sockets.md",
            "network_security": "computer_networks/security.md",
        }
        
        # Determine the relative file path to check
        rel_path = concept_to_path.get(concept, f"{concept}.md")
        # Assume course materials live somewhere like `data/course_materials/` relative to BASE_DIR
        base_dir = getattr(settings, 'BASE_DIR', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        file_path = os.path.join(base_dir, 'data', 'course_materials', rel_path)
        
        # Check if the file exists locally
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    material = f.read()
                    return Response({'content': material}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.warning(f"Could not read local file {file_path}: {e}")
        
        # Fallback to LLM generation if local file doesn't exist
        logger.info(f"Local file not found for {concept}, falling back to LLM generation.")

        # We can ask the orchestrator to generate a mini learning module
        prompt = f"Write a comprehensive but concise crash-course markdown learning sheet explaining the computer science concept '{concept}'. Include code examples, time complexity where relevant, and use headers and bullet points. Make it engaging."
        
        # Instantiate legacy ai_service to use its robust _call_llm method
        from tutor.ai_service import ai_service
        from asgiref.sync import async_to_sync
        
        system_prompt = "You are an expert computer science tutor. Generate clean, well-formatted markdown."
        
        material = async_to_sync(ai_service._call_llm)(
            prompt=prompt,
            system_prompt=system_prompt,
            model="llama-3.1-8b-instant",
            temperature=0.5,
            max_tokens=800
        )
        
        if not material:
            raise Exception("LLM returned empty material")
        return Response({'content': material}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching course material for {concept}: {e}")
        # Return fallback text
        fallback = f"# {concept.replace('_', ' ').title()}\n\nSorry, the learning material for this concept is currently offline. Please try again later."
        return Response({'content': fallback}, status=status.HTTP_200_OK)
