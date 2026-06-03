from django.urls import path
from .views import (
    health_check,
    submit_answer, register, login, logout, user_profile,
    get_random_question, get_hint, get_explanation, get_concept_map, get_course_material,
    get_dashboard_stats, get_question_history,
    get_mastery_summary, get_next_question, get_recommended_concepts,
    # Spaced Repetition
    get_review_queue, get_review_stats, skip_question,
    # New Review and Skip APIs
    mark_question_for_review, get_manual_reviews, get_question_by_id, rate_review,
    # Gamification
    get_heatmap_data, get_leaderboard, get_user_stats,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # ── Health (for load balancers / k8s) ──────────────────────────────────
    path('health/',             health_check,           name='health_check'),
    # ── Auth ──────────────────────────────────────────────────────────────
    path('auth/register/',      register,               name='register'),
    path('auth/login/',         login,                  name='login'),
    path('auth/logout/',        logout,                 name='logout'),
    path('auth/profile/',       user_profile,           name='profile'),
    path('auth/token/',         TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),

    # ── Quiz ──────────────────────────────────────────────────────────────
    path('submit-answer/',      submit_answer,          name='submit_answer'),
    path('question/random/',    get_random_question,    name='random_question'),
    path('question/id/<int:question_id>/', get_question_by_id, name='get_question_by_id'),
    path('question/hint/',      get_hint,               name='get_hint'),
    path('question/explanation/', get_explanation,      name='get_explanation'),
    path('question/mark-review/', mark_question_for_review, name='mark_question_for_review'),
    path('question/rate-review/', rate_review,          name='rate_review'),
    path('question/skip/',      skip_question,          name='skip_question'),

    # ── Dashboard ─────────────────────────────────────────────────────────
    path('dashboard/stats/',    get_dashboard_stats,    name='dashboard_stats'),
    path('dashboard/history/',  get_question_history,   name='question_history'),

    # ── Mastery ───────────────────────────────────────────────────────────
    path('mastery/summary/',    get_mastery_summary,    name='mastery_summary'),
    path('mastery/next-question/', get_next_question,   name='next_question'),
    path('mastery/recommended/', get_recommended_concepts, name='recommended_concepts'),
    
    # ── Course Material ───────────────────────────────────────────────────
    path('course/material/',    get_course_material,    name='course_material'),

    # ── Spaced Repetition ─────────────────────────────────────────────────
    path('review/queue/',       get_review_queue,       name='review_queue'),
    path('review/stats/',       get_review_stats,       name='review_stats'),
    path('user/manual-reviews/', get_manual_reviews,    name='get_manual_reviews'),

    # ── Gamification ──────────────────────────────────────────────────────
    path('gamification/me/',         get_user_stats,    name='user_stats'),
    path('gamification/heatmap/',    get_heatmap_data,  name='heatmap_data'),
    path('gamification/leaderboard/', get_leaderboard,  name='leaderboard'),

    # ── Phase 8: Concept Map ──────────────────────────────────────────────────
    path('concept/map/',             get_concept_map,   name='concept_map'),
    path('course/material/',         get_course_material, name='course_material'),
]
