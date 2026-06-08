# Updated models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    daily_goal_progress = models.IntegerField(default=0)
    last_daily_goal_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.email} - Lvl {self.level}"

class Question(models.Model):
    text = models.TextField()
    correct_answer = models.TextField()
    concept = models.TextField(blank=True, null=True)
    category = models.CharField(
        max_length=50,
        choices=[
            ('technical', 'Technical'),
            ('behavioral', 'Behavioral'),
            ('system_design', 'System Design'),
            ('coding', 'Coding'),
            ('theoretical', 'Theoretical'),
        ],
        default='theoretical',
        help_text='High-level category for filtering'
    )
    sub_category = models.CharField(
        max_length=100,
        blank=True,
        help_text='Specific topic (e.g., "recursion", "leadership", "scalability")'
    )
    ideal_duration_seconds = models.IntegerField(
        null=True,
        blank=True,
        help_text='Expected time for a good answer (for interview practice)'
    )
    evaluation_rubric = models.JSONField(
        default=dict,
        blank=True,
        help_text='Structured criteria for grading (STAR method, technical depth, etc.)'
    )
    bloom_level = models.TextField(blank=True, null=True)
    difficulty = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        managed = True
        db_table = 'questions'
        ordering = ['-created_at']
        verbose_name_plural = 'Questions'
        indexes = [
            models.Index(fields=['category', 'sub_category']),
            models.Index(fields=['concept', 'bloom_level']),
        ]
    
    def __str__(self):
        return f"{self.concept}: {self.text[:50]}"


class Response(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Fixed
    question = models.ForeignKey(Question, on_delete=models.CASCADE)  # Fixed
    submitted_answer = models.TextField(blank=True, null=True)
    audio_file_path = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text='Path to recorded audio file (S3, local storage, etc.)'
    )
    transcription = models.TextField(
        blank=True,
        help_text='Auto-transcribed text from audio (Whisper API)'
    )
    response_duration_seconds = models.FloatField(
        null=True,
        blank=True,
        help_text='How long user took to answer'
    )
    interview_session = models.ForeignKey(
        'InterviewSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responses',
        help_text='Interview session this response belongs to'
    )
    is_correct = models.BooleanField(blank=True, null=True)
    confidence_score = models.FloatField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)  # Changed

    class Meta:
        managed = True
        db_table = 'responses'
        ordering = ['-timestamp']
        verbose_name_plural = 'Responses'
    
    def __str__(self):
        return f"{self.user.email} - {self.question.id}"


class Mastery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Fixed
    concept = models.TextField(default="general")
    current_level = models.TextField(blank=True, null=True)
    last_updated = models.DateTimeField(default=timezone.now)

    class Meta:
        managed = True
        db_table = 'mastery'
        ordering = ['-last_updated']
        verbose_name_plural = 'Mastery Records'
        unique_together = [['user', 'concept']]  # Prevent duplicates
    
    def __str__(self):
        return f"{self.user.email} - {self.concept}"
class ManualReviewQueue(models.Model):
    """
    Stores questions that users explicitly mark for manual review.
    Records are automatically deleted when the user answers the question correctly.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='manual_reviews')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='manual_reviews')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        managed = True
        db_table = 'manual_review_queue'
        verbose_name_plural = 'Manual Review Queue'
        unique_together = [('user', 'question')]
        indexes = [
            models.Index(fields=['user', '-added_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} marked Q{self.question.id} for review"


class SkippedQuestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    skipped_at = models.DateTimeField(auto_now_add=True)
    skip_count = models.PositiveIntegerField(default=1)            # allow multiple skips → increment
    # optional: last_skip_reason = models.CharField(max_length=60, blank=True)

    class Meta:
        managed = True
        db_table = 'skipped_questions'
        verbose_name_plural = 'Skipped Questions'
        unique_together = [('user', 'question')]
        
    def __str__(self):
        return f"{self.user.email} skipped {self.question.id}"


class UserQuestionInteraction(models.Model):   # Core SRS/learning fields combined with skip/review flags
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # Core SRS/learning fields
    last_seen        = models.DateTimeField(null=True, blank=True)
    next_review_due  = models.DateTimeField(null=True, blank=True, db_index=True)
    ease_factor      = models.FloatField(default=2.5)
    interval_days    = models.FloatField(default=1.0)
    review_count     = models.PositiveIntegerField(default=0)
    correct_count    = models.PositiveIntegerField(default=0)
    streak           = models.PositiveIntegerField(default=0)
    
    # NEW flags that replace the need for separate tables in many cases
    wants_manual_review = models.BooleanField(default=False, db_index=True)
    is_skipped          = models.BooleanField(default=False)      # or use a small integer for skip streak
    
    class Meta:
        managed = True
        db_table = 'user_question_interactions'
        verbose_name_plural = 'User Question Interactions'
        unique_together = [('user', 'question')]
        indexes = [
            models.Index(fields=['user', 'next_review_due']),
            models.Index(fields=['user', 'wants_manual_review']),
        ]
        
    def __str__(self):
        return f"{self.user.email} -> Q{self.question.id} (Review: {self.wants_manual_review})"


class SpacedRepetitionQueue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    review_time = models.DateTimeField()
    status = models.CharField(max_length=50, default='pending')
    
    # SM-2 Fields
    ease_factor = models.FloatField(default=2.5)
    repetition_count = models.IntegerField(default=0)
    last_interval = models.IntegerField(default=1)  # days
    last_quality = models.IntegerField(default=0)  # 0-5

    class Meta:
        managed = True
        db_table = 'spaced_repetition_queue'
        ordering = ['review_time']
        verbose_name_plural = 'Spaced Repetition Queue'
        indexes = [
            models.Index(fields=['user', 'review_time', 'status']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.question.id}"


class LearningEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Fixed
    event_type = models.CharField(max_length=100,default="unknown")  # Changed
    payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)  # Changed

    class Meta:
        managed = True
        db_table = 'learning_events'
        ordering = ['-created_at']
        verbose_name_plural = 'Learning Events'
    
    def __str__(self):
        return f"{self.user.email} - {self.event_type}"


class VoiceDeliveryMetrics(models.Model):
    """
    Voice and delivery quality metrics
    Only populated for voice-based responses
    Linked 1:1 with Response
    """
    response = models.OneToOneField(Response, on_delete=models.CASCADE, related_name='voice_metrics')
    
    # Speech characteristics
    speech_rate_wpm = models.FloatField(null=True, blank=True, help_text='Words per minute (ideal: 120-150)')
    clarity_score = models.FloatField(null=True, blank=True, help_text='Pronunciation clarity (0-100, from speech recognition confidence)')
    
    # Filler words
    filler_words_count = models.IntegerField(default=0, help_text='Count of um, uh, like, you know, etc.')
    filler_words_list = models.JSONField(default=list, blank=True, help_text='Detected filler words with timestamps')
    
    # Tone analysis
    tone_analysis = models.JSONField(default=dict, blank=True, help_text='Emotion/tone scores')
    
    # Pauses and pacing
    pause_count = models.IntegerField(default=0, help_text='Number of significant pauses (>1 second)')
    average_pause_duration = models.FloatField(null=True, blank=True, help_text='Average pause length in seconds')
    
    # Volume/energy
    volume_variance = models.FloatField(null=True, blank=True, help_text='Variance in volume (monotone vs dynamic)')
    
    # AI-generated feedback
    delivery_feedback = models.TextField(blank=True, help_text='Real-time feedback on delivery quality')
    overall_delivery_score = models.FloatField(null=True, blank=True, help_text='Composite score (0-100) for delivery quality')
    
    # Metadata
    analyzed_at = models.DateTimeField(auto_now_add=True)
    analysis_model = models.CharField(max_length=100, blank=True, help_text='Which AI model analyzed this')
    
    class Meta:
        managed = True
        db_table = 'voice_delivery_metrics'
        ordering = ['-analyzed_at']
        verbose_name_plural = 'Voice Delivery Metrics'

    def __str__(self):
        return f"Voice Metrics - Res. {self.response.id}"


class InterviewSession(models.Model):
    """
    Groups multiple questions/responses into one interview practice session
    Useful for tracking overall interview performance
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interview_sessions')
    
    # Session metadata
    session_type = models.CharField(
        max_length=50,
        choices=[
            ('technical', 'Technical Interview'),
            ('behavioral', 'Behavioral Interview'),
            ('mock_full', 'Full Mock Interview'),
            ('quick_practice', 'Quick Practice'),
        ],
        default='quick_practice'
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True, help_text='Total session duration')
    
    # Performance summary
    questions_attempted = models.IntegerField(default=0)
    questions_correct = models.IntegerField(default=0)
    average_response_time = models.FloatField(null=True, blank=True, help_text='Average time per question in seconds')
    
    # Voice metrics (aggregated)
    average_clarity_score = models.FloatField(null=True, blank=True)
    average_delivery_score = models.FloatField(null=True, blank=True)
    total_filler_words = models.IntegerField(default=0)
    
    # Overall assessment
    session_feedback = models.TextField(blank=True, help_text='AI-generated overall session feedback')
    session_score = models.FloatField(null=True, blank=True, help_text='Overall session score (0-100)')
    
    # Recommendations
    strengths = models.JSONField(default=list, blank=True, help_text='Identified strengths from this session')
    areas_for_improvement = models.JSONField(default=list, blank=True, help_text='Areas to focus on')
    
    class Meta:
        managed = True
        db_table = 'interview_sessions'
        ordering = ['-started_at']
        verbose_name_plural = 'Interview Sessions'
        indexes = [
            models.Index(fields=['user', '-started_at']),
        ]

    def __str__(self):
        return f"Session {self.id} - {self.user.email}"