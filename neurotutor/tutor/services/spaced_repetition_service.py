from datetime import datetime, timedelta
from django.utils import timezone
from tutor.models import SpacedRepetitionQueue, Question
from typing import Optional, Dict, List
import logging

logger = logging.getLogger(__name__)

class SpacedRepetitionService:
    """
    SuperMemo-2 (SM-2) algorithm implementation
    
    Quality ratings:
    5 - Perfect recall, effortless
    4 - Correct after hesitation
    3 - Correct with difficulty
    2 - Incorrect, but remembered seeing it
    1 - Incorrect, vague memory
    0 - Complete blackout
    """
    
    MIN_EF = 1.3  # Minimum ease factor
    
    def calculate_sm2(
        self,
        quality: int,  # 0-5
        repetition: int,
        ease_factor: float,
        last_interval: int
    ) -> Dict:
        """
        Calculate next review parameters using SM-2
        
        Returns:
            {
                'ease_factor': float,
                'repetition': int,
                'interval': int (days),
                'next_review': datetime
            }
        """
        
        # Validate quality
        if not 0 <= quality <= 5:
            raise ValueError("Quality must be 0-5")
        
        # Update ease factor
        # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ef = max(self.MIN_EF, new_ef)
        
        # Calculate interval
        if quality < 3:
            # Failed - reset repetition and start over
            new_repetition = 0
            new_interval = 1
        else:
            # Passed - continue
            new_repetition = repetition + 1
            
            if new_repetition == 1:
                new_interval = 1
            elif new_repetition == 2:
                new_interval = 6
            else:
                new_interval = int(last_interval * new_ef)
        
        # Calculate next review date
        next_review = timezone.now() + timedelta(days=new_interval)
        
        return {
            'ease_factor': round(new_ef, 2),
            'repetition': new_repetition,
            'interval': new_interval,
            'next_review': next_review
        }
    
    def schedule_review(self, user, question: Question, quality: int):
        """
        Schedule or update a review for a question
        """
        try:
            # Get or create queue item
            queue_item, created = SpacedRepetitionQueue.objects.get_or_create(
                user=user,
                question=question,
                defaults={
                    'ease_factor': 2.5,
                    'repetition_count': 0,
                    'last_interval': 1,
                    'last_quality': quality,
                    'review_time': timezone.now() + timedelta(days=1),
                    'status': 'pending'
                }
            )
            
            if not created:
                # Update existing
                sm2_result = self.calculate_sm2(
                    quality=quality,
                    repetition=queue_item.repetition_count,
                    ease_factor=queue_item.ease_factor,
                    last_interval=queue_item.last_interval
                )
                
                queue_item.ease_factor = sm2_result['ease_factor']
                queue_item.repetition_count = sm2_result['repetition']
                queue_item.last_interval = sm2_result['interval']
                queue_item.last_quality = quality
                queue_item.review_time = sm2_result['next_review']
                queue_item.status = 'pending'
                queue_item.save()
            
            logger.info(f"Scheduled review for user {user.id} question {question.id} (Quality: {quality})")
            return queue_item
            
        except Exception as e:
            logger.error(f"Error scheduling review: {e}")
            return None
    
    def get_due_reviews(self, user, limit: int = 20) -> List[SpacedRepetitionQueue]:
        """Get questions due for review"""
        return list(SpacedRepetitionQueue.objects.filter(
            user=user,
            review_time__lte=timezone.now(),
            status='pending'
        ).select_related('question').order_by('review_time')[:limit])
    
    def get_review_stats(self, user) -> Dict:
        """Get user's review statistics"""
        from django.db.models import Avg
        
        all_reviews = SpacedRepetitionQueue.objects.filter(user=user)
        
        due_today = all_reviews.filter(
            review_time__lte=timezone.now(),
            status='pending'
        ).count()

        # Simple "reviewed today" approximation: 
        # In a real system, we'd log each review event separately.
        # Here we just track the queue state.
        
        avg_ef = all_reviews.aggregate(
            avg_ef=Avg('ease_factor')
        )['avg_ef'] or 2.5
        
        return {
            'total_cards': all_reviews.count(),
            'due_today': due_today,
            'average_ease': round(avg_ef, 2)
        }

# Singleton
spaced_repetition_service = SpacedRepetitionService()
