# Error Handling & Fallbacks Strategy

## Overview

This document outlines the comprehensive error handling strategy for the multi-agent architecture in Phase 8. The system is designed to be resilient and provide graceful degradation when components fail.

## Agent-Level Error Handling

### 1. EvaluationAgent
- **Primary Failure**: LLM API timeout or error
- **Fallback**: Exact string matching between user answer and correct answer
- **User Experience**: Transparent - user sees "correct" or "incorrect" with confidence 1.0 or 0.0
- **Logging**: All failures logged with `evaluation_method: 'emergency_fallback'`

### 2. HintAgent
- **Primary Failure**: LLM unable to generate hint
- **Fallback**: Predefined hint templates based on attempt count
- **User Experience**: Generic but helpful hints like "Try breaking down the problem"
- **Logging**: Failed attempts logged, fallback usage tracked

### 3. ExplanationAgent
- **Primary Failure**: LLM fails to generate explanation
- **Fallback**: Static message "Unable to generate explanation. Please try again."
- **User Experience**: Clear error message, no partial explanations
- **Logging**: Failure logged with error details

### 4. DifficultyAgent
- **Primary Failure**: Insufficient data or algorithm error
- **Fallback**: Returns None (no recommendation)
- **User Experience**: No difficulty badge shown, normal flow continues
- **Logging**: Failure logged, but no user impact

### 5. ConceptMapperAgent
- **Primary Failure**: Concept graph traversal error
- **Fallback**: Empty arrays for prerequisites/successors/related
- **User Experience**: Concept map shows current concept only
- **Logging**: Failure logged, minimal user impact

## Orchestrator-Level Error Handling

### Parallel Execution Isolation
```python
# Stage 2 agents run in parallel with exception isolation
stage2_results = await asyncio.gather(*tasks, return_exceptions=True)

for label, result in zip(task_labels, stage2_results):
    if isinstance(result, Exception):
        logger.warning(f"[orchestrator] {label} raised exception: {result!r}")
        continue  # Skip failed agent, continue with others
```

### Error Propagation Rules
1. **EvaluationAgent failure**: Triggers emergency fallback, always returns a result
2. **Stage 2 agent failures**: Logged and skipped, do not fail the entire orchestration
3. **Total orchestration failure**: Only occurs if EvaluationAgent fallback also fails (extremely rare)

## API-Level Error Handling

### Response Structure
All API responses include error information:
```json
{
  "success": true,
  "data": {...},
  "error": null,
  "fallback_used": false,
  "agent_latencies": {...}
}
```

### HTTP Status Codes
- **200**: Success (including fallback scenarios)
- **400**: Bad request (missing parameters)
- **403**: Rate limit exceeded or insufficient attempts
- **404**: Question not found
- **429**: Rate limit exceeded
- **500**: Server error (database, critical system failure)

### Rate Limiting
- **Submit answers**: 120/hour per user
- **Hints**: 10/hour per user  
- **Explanations**: 5/hour per user
- **Concept maps**: No limit (fast, no LLM)

## Frontend Error Handling

### User-Facing Messages
- **Network errors**: "Connection lost. Please check your internet."
- **Rate limits**: "Too many requests. Please wait a moment."
- **Server errors**: "Something went wrong. Please try again."
- **Fallback scenarios**: No indication to user (transparent)

### Component Resilience
- **DifficultyBadge**: Auto-dismisses after 5 seconds, manual dismiss available
- **ConceptMap**: Shows minimal data if API fails
- **Hint/Explanation**: Shows loading states, graceful fallback messages

## Database Error Handling

### Connection Failures
- **Health check**: `/health/?db=1` tests database connectivity
- **Graceful degradation**: Read-only mode if database writes fail
- **Retry logic**: Built into Django ORM for transient failures

### Data Integrity
- **Mastery updates**: Wrapped in transactions
- **Response logging**: Async, non-blocking failures don't affect user flow
- **Gamification stats**: Best-effort updates, failures logged

## Monitoring & Alerting

### Log Levels
- **DEBUG**: Detailed agent execution flow
- **INFO**: Normal operation, agent latencies
- **WARNING**: Agent failures, fallback usage
- **ERROR**: Critical system failures, database issues

### Key Metrics to Monitor
1. **Agent failure rates** per agent type
2. **Fallback usage frequency** (should be <5%)
3. **API response times** (p95 < 2s)
4. **Rate limit hit rates**
5. **Database connection errors**

### Alert Conditions
- Agent failure rate >10% for any agent
- Fallback usage >20% 
- API response time p95 >5s
- Database connection failures
- Groq API quota exhaustion

## Testing Error Scenarios

### Unit Tests
- Mock LLM failures for each agent
- Test fallback mechanisms
- Verify error logging
- Test partial failure scenarios

### Integration Tests
- Simulate network timeouts
- Test rate limiting
- Database connection failures
- End-to-end fallback flows

### Chaos Testing
- Random agent failures
- Network latency injection
- Database connection drops
- LLM API throttling

## Recovery Procedures

### Automatic Recovery
- **Retry logic**: Built into LLM calls (3 retries with exponential backoff)
- **Circuit breakers**: Disable failing agents after repeated failures
- **Graceful degradation**: Continue with reduced functionality

### Manual Recovery
- **Agent restart**: Deploy updated agent code
- **Configuration changes**: Adjust timeouts, retry counts
- **Database maintenance**: Fix connection issues
- **LLM provider issues**: Switch to backup provider or adjust quotas

## User Communication Strategy

### Proactive Messages
- **Scheduled maintenance**: Banner 24 hours in advance
- **Known issues**: Status page updates
- **Feature degradation**: Clear messaging about reduced functionality

### Reactive Messages  
- **Immediate failures**: Clear error messages with next steps
- **Rate limits**: Exact wait times
- **Fallback usage**: Transparent when appropriate (e.g., "Using simplified evaluation")

## Configuration

### Environment Variables
```bash
# Agent timeouts (seconds)
EVALUATION_TIMEOUT=30
HINT_TIMEOUT=20
EXPLANATION_TIMEOUT=30

# Retry settings
MAX_RETRIES=3
RETRY_DELAY_BASE=1

# Fallback thresholds
FALLBACK_THRESHOLD_PERCENT=20
AGENT_FAILURE_ALERT_THRESHOLD=10
```

### Feature Flags
```python
# Enable/disable specific agents
ENABLE_HINT_AGENT=True
ENABLE_DIFFICULTY_AGENT=True
ENABLE_CONCEPT_MAPPER=True

# Fallback behavior
USE_EMERGENCY_FALLBACK=True
LOG_FALLBACK_USAGE=True
```

This comprehensive error handling strategy ensures the system remains functional and provides a good user experience even when individual components fail.
