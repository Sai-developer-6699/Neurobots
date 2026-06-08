from tutor.models import Response, Mastery, Question
from datetime import datetime, timedelta
from typing import Optional, Dict, List

class MasteryService:
    """
    Track and manage user mastery across concepts and Bloom levels
    """
    
    BLOOM_LEVELS = {
        'remember': 1,
        'understand': 2,
        'apply': 3,
        'analyze': 4,
        'evaluate': 5,
        'create': 6
    }
    
    def update_mastery(self, user, concept: str, is_correct: bool) -> 'Mastery':
        """
        Update mastery level based on recent performance
        
        Algorithm:
        - Track last 5 attempts
        - 80%+ accuracy → advance to next Bloom level
        - <40% accuracy → regress to previous level
        - Otherwise maintain current level
        """
        
        # Get or create mastery record
        mastery, created = Mastery.objects.get_or_create(
            user=user,
            concept=concept,
            defaults={'current_level': 'remember'}
        )
        
        # Get recent attempts for this concept
        recent_responses = Response.objects.filter(
            user=user,
            question__concept=concept
        ).order_by('-timestamp')[:5]
        
        if not recent_responses:
            return mastery
        
        # Calculate accuracy
        correct_count = sum(1 for r in recent_responses if r.is_correct)
        total_count = len(recent_responses)
        accuracy = correct_count / total_count
        
        # Current Bloom level as number
        current_level_num = self.BLOOM_LEVELS[mastery.current_level]
        
        # Progression logic
        if accuracy >= 0.8 and total_count >= 3:
            # Advance to next level
            if current_level_num < 6:
                next_level = [k for k, v in self.BLOOM_LEVELS.items() 
                             if v == current_level_num + 1][0]
                mastery.current_level = next_level
                print(f"✓ {user.email} advanced to {next_level} in {concept}")
        
        elif accuracy < 0.4 and total_count >= 3:
            # Regress to previous level
            if current_level_num > 1:
                prev_level = [k for k, v in self.BLOOM_LEVELS.items() 
                             if v == current_level_num - 1][0]
                mastery.current_level = prev_level
                print(f"↓ {user.email} regressed to {prev_level} in {concept}")
        
        # Save and return
        mastery.save()
        return mastery
    
    def get_next_question(self, user, concept: Optional[str] = None) -> Optional['Question']:
        """
        Get next appropriate question based on mastery
        
        Strategy:
        1. If concept specified, use that
        2. Otherwise, pick weakest concept
        3. Find unanswered questions at current Bloom level
        4. If none, find questions at next level (ZPD)
        """
        
        # Determine concept and target level
        if concept:
            try:
                mastery = Mastery.objects.get(user=user, concept=concept)
                target_level = mastery.current_level
            except Mastery.DoesNotExist:
                target_level = 'remember'
        else:
            # Get weakest concept
            masteries = Mastery.objects.filter(user=user)
            
            if masteries:
                # Find concept with lowest Bloom level
                weakest = min(
                    masteries, 
                    key=lambda m: self.BLOOM_LEVELS[m.current_level]
                )
                concept = weakest.concept
                target_level = weakest.current_level
            else:
                # First-time user - start with any concept
                first_question = Question.objects.filter(
                    bloom_level='remember'
                ).order_by('?').first()
                
                if first_question:
                    concept = first_question.concept
                    target_level = 'remember'
                else:
                    return None
        
        # Get questions user has answered correctly
        answered_correctly = Response.objects.filter(
            user=user,
            is_correct=True
        ).values_list('question_id', flat=True)
        
        # Get questions user has skipped
        from tutor.models import SkippedQuestion
        skipped = SkippedQuestion.objects.filter(
            user=user
        ).values_list('question_id', flat=True)
        
        # Combine excluded IDs (union of QuerySets would be evaluated, so doing python set is an option, but we can just use Django exclude chaining)
        # However, passing lists to in__ is easiest. Since we don't have millions of records per user, getting list is fine.
        excluded_ids = list(answered_correctly) + list(skipped)

        # Try to find question at current level
        question = Question.objects.filter(
            concept=concept,
            bloom_level=target_level
        ).exclude(
            id__in=excluded_ids
        ).order_by('?').first()
        
        # If no questions at current level, try next level (ZPD)
        if not question:
            current_num = self.BLOOM_LEVELS[target_level]
            if current_num < 6:
                next_level = [k for k, v in self.BLOOM_LEVELS.items() 
                             if v == current_num + 1][0]
                
                question = Question.objects.filter(
                    concept=concept,
                    bloom_level=next_level
                ).exclude(
                    id__in=excluded_ids
                ).order_by('?').first()
        
        return question
    
    def get_mastery_summary(self, user) -> Dict:
        """
        Get overall mastery statistics for user
        """
        
        masteries = Mastery.objects.filter(user=user)
        
        if not masteries:
            return {
                'total_concepts': 0,
                'average_level': 0,
                'concepts': [],
                'overall_progress': 0
            }
        
        concepts_data = []
        total_level = 0
        
        for mastery in masteries:
            level_num = self.BLOOM_LEVELS[mastery.current_level]
            total_level += level_num
            
            # Get accuracy for this concept
            responses = Response.objects.filter(
                user=user,
                question__concept=mastery.concept
            )
            
            total_attempts = responses.count()
            correct_attempts = responses.filter(is_correct=True).count()
            accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0
            
            concepts_data.append({
                'concept': mastery.concept,
                'current_level': mastery.current_level,
                'level_number': level_num,
                'progress_percentage': (level_num / 6) * 100,
                'accuracy': round(accuracy, 1),
                'total_attempts': total_attempts,
                'last_updated': mastery.last_updated
            })
        
        # Sort by progress (ascending - show weakest first)
        concepts_data.sort(key=lambda x: x['level_number'])
        
        return {
            'total_concepts': len(masteries),
            'average_level': round(total_level / len(masteries), 1),
            'concepts': concepts_data,
            'overall_progress': round((total_level / (len(masteries) * 6)) * 100, 1)
        }
    
    def get_recommended_concepts(self, user, limit: int = 3) -> List[str]:
        """
        Get concepts user should focus on (weakest concepts)
        """
        
        masteries = Mastery.objects.filter(user=user).order_by('current_level')
        
        if not masteries:
            # New user - recommend starting concepts
            return ['functions', 'variables', 'data_types']
        
        # Return weakest concepts
        return [m.concept for m in masteries[:limit]]

# Singleton instance
mastery_service = MasteryService()