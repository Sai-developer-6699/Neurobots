from django.utils import timezone
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from tutor.models import UserProfile, LearningEvent
import math
import logging

logger = logging.getLogger(__name__)

class GamificationService:
    """
    Handles XP, Levels, Streaks, and Leaderboards.
    """
    
    XP_PER_QUESTION = 10
    XP_DAILY_GOAL = 50
    DAILY_GOAL_TARGET = 5 # questions per day

    def get_or_create_profile(self, user):
        profile, created = UserProfile.objects.get_or_create(user=user)
        return profile

    def calculate_level(self, xp):
        # Formula: Level = floor(0.1 * sqrt(XP)) + 1
        # Example: 100 XP -> 0.1 * 10 = 1 -> Lvl 2
        # Example: 1000 XP -> 0.1 * 31.6 = 3.1 -> Lvl 4
        if xp <= 0: return 1
        return math.floor(0.1 * math.sqrt(xp)) + 1

    def update_user_stats(self, user, xp_gain=0):
        """
        Updates XP, Level, Streak, and Daily Goal. Returns updated stats.
        """
        profile = self.get_or_create_profile(user)
        today = timezone.now().date()

        # 1. Update XP & Level
        if xp_gain > 0:
            profile.xp += xp_gain
            new_level = self.calculate_level(profile.xp)
            if new_level > profile.level:
                logger.info(f"User {user.email} leveled up to {new_level}!")
            profile.level = new_level

        # 2. Update Streak (Idempotent — only fires once per day)
        if profile.last_activity_date != today:
            if profile.last_activity_date == today - timezone.timedelta(days=1):
                profile.streak_days += 1
            elif profile.last_activity_date is None or profile.last_activity_date < today - timezone.timedelta(days=1):
                profile.streak_days = 1
            profile.last_activity_date = today

        # 3. Reset daily goal counter if it's a new day (fires regardless of xp_gain)
        if profile.last_daily_goal_date != today:
            profile.daily_goal_progress = 0
            profile.last_daily_goal_date = today

        # 4. Increment daily goal (only if not yet completed, to prevent overflow)
        goal_completed = False
        if xp_gain > 0 and profile.daily_goal_progress < self.DAILY_GOAL_TARGET:
            profile.daily_goal_progress += 1
            # Award bonus XP exactly once when target is hit
            if profile.daily_goal_progress == self.DAILY_GOAL_TARGET:
                profile.xp += self.XP_DAILY_GOAL
                profile.level = self.calculate_level(profile.xp)
                goal_completed = True
                logger.info(f"User {user.email} hit daily goal! +{self.XP_DAILY_GOAL} bonus XP")

        profile.save()

        return {
            'xp':                   profile.xp,
            'level':                profile.level,
            'streak_days':          profile.streak_days,
            'daily_goal_progress':  profile.daily_goal_progress,
            'goal_target':          self.DAILY_GOAL_TARGET,
            'goal_completed':       goal_completed,
        }


    def get_heatmap_data(self, user):
        """
        Returns { "YYYY-MM-DD": count } for the last 365 days.
        Counts answer_submitted events (actual learning activity).
        """
        cutoff = timezone.now() - timezone.timedelta(days=365)
        events = (
            LearningEvent.objects
            .filter(
                user=user,
                created_at__gte=cutoff,
                event_type__in=['answer_submitted', 'answer_evaluated']
            )
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        data = {}
        for entry in events:
            date_str = entry['date'].strftime('%Y-%m-%d')
            data[date_str] = entry['count']

        return data

    def get_leaderboard(self, limit=5):
        """
        Returns top users by XP
        """
        return UserProfile.objects.select_related('user').order_by('-xp')[:limit]

gamification_service = GamificationService()
