from collections import Counter
import logging
from ..services.rag_service import RAGService
# Note: Import CourseContentGenerator inside method to avoid circular imports if needed

logger = logging.getLogger(__name__)

class AdaptiveService:
    """
    Adaptive Learning Service:
    - Tracks student performance gaps.
    - Triggers auto-generation of missing content.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AdaptiveService, cls).__new__(cls)
            cls._instance.gap_tracker = Counter() # (user_id, concept) -> failure_count
            cls._instance.rag_service = RAGService()
        return cls._instance
    
    def track_failure(self, user, concept: str, question_text: str):
        """
        Record a failure for a specific concept.
        If threshold reached, checking implementation.
        """
        key = (user.id, concept)
        self.gap_tracker[key] += 1
        
        count = self.gap_tracker[key]
        if count >= 3: # Threshold
            self._handle_learning_gap(user, concept)
            
    def _handle_learning_gap(self, user, concept: str):
        """
        Gap detected! Check if we have content, if not, generate it.
        """
        logger.info(f"[GAP] Learning Gap Detected: {concept}")
        
        # Create Learning Event
        from ..models import LearningEvent
        LearningEvent.objects.create(
            user=user,
            event_type='concept_gap_detected',
            payload={'concept': concept, 'reason': '3 consecutive failures'}
        )
        
        # 1. Check RAG
        results = self.rag_service.search(concept, n_results=1)
        
        # Simple heuristic: If no results or very low relevance (placeholder for now)
        if not results:
            logger.info(f"[MISSING] Missing content for {concept}. Triggering Auto-Generation...")
            
            # Log event for content generation trigger
            LearningEvent.objects.create(
                user=user,
                event_type='adaptive_content_generated', # Triggered
                payload={'concept': concept, 'status': 'triggered'}
            )
            
            # In a real async system, we would push this to a queue (Celery/Redis).
            # Here, we'll just log it for the prototype, or we could run the generator.
            # Due to the complexity of invoking the heavy generator in the request loop,
            # we will flag it.
            return True
            
        logger.info(f"[EXISTS] Content exists for {concept}. Recommending review.")
        return False
        
    def get_remedial_content(self, concept: str) -> str:
        """Get content to help the student immediately"""
        results = self.rag_service.search(concept, n_results=1)
        if results:
            return results[0]
        return "No specific remedial content available yet."

adaptive_service = AdaptiveService()
