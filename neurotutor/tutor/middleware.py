# tutor/middleware.py
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.decorators import sync_and_async_middleware
from asgiref.sync import iscoroutinefunction, sync_to_async
import time
import asyncio

@sync_and_async_middleware
class AIRateLimitMiddleware:
    """
    Rate limit AI requests to avoid hitting Groq limits (Async Compatible)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Allow async execution if get_response is a coroutine
        if iscoroutinefunction(self.get_response):
            return self.__acall__(request)
            
        # Synchronous logic
        if self._should_limit(request):
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please wait a moment.'},
                status=429
            )
        return self.get_response(request)

    async def __acall__(self, request):
        # Asynchronous logic
        # Wrap the sync limit check. 
        # Note: 'sync_to_async' is needed because cache.get/set are sync.
        should_limit = await sync_to_async(self._should_limit)(request)
        if should_limit:
             return JsonResponse(
                {'error': 'Rate limit exceeded. Please wait a moment.'},
                status=429
            )
        
        response = await self.get_response(request)
        return response

    def _should_limit(self, request):
        if request.path.startswith('/api/') and request.user.is_authenticated:
            # Track AI requests per user
            cache_key = f'ai_requests_{request.user.id}'
            requests = cache.get(cache_key, [])
            
            # Remove requests older than 1 minute
            current_time = time.time()
            requests = [req_time for req_time in requests if current_time - req_time < 60]
            
            # Limit: 10 AI requests per minute per user
            if len(requests) >= 10:
                return True
            
            # Add current request
            requests.append(current_time)
            cache.set(cache_key, requests, 60)
            return False
        return False