# Migration & Rollout Strategy for Phase 8 Multi-Agent System

## Overview

This document outlines the safe, incremental rollout strategy for deploying the multi-agent architecture while maintaining zero downtime and backward compatibility.

## Rollout Philosophy

1. **Zero Breaking Changes**: All existing APIs remain functional
2. **Incremental Deployment**: Deploy in stages with validation at each step
3. **Feature Flags**: Enable/disable new functionality dynamically
4. **Rollback Ready**: Quick rollback path for each deployment stage
5. **Monitoring First**: Comprehensive monitoring before and after each change

## Deployment Stages

### Stage 0: Preparation (Pre-deployment)

#### Database Schema Changes
```sql
-- No breaking changes - all additions are optional
ALTER TABLE tutor_question 
ADD COLUMN IF NOT EXISTS prerequisite_hint TEXT,
ADD COLUMN IF NOT EXISTS agent_latencies JSONB;

-- New tables for agent metrics (can be created safely)
CREATE TABLE IF NOT EXISTS tutor_agentmetrics (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES auth_user(id),
    question_id INTEGER REFERENCES tutor_question(id),
    latency_ms FLOAT,
    success BOOLEAN,
    error_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agentmetrics_agent_user 
ON tutor_agentmetrics(agent_name, user_id);
```

#### Environment Variables
```bash
# Feature flags (default to existing behavior)
ENABLE_MULTI_AGENT_EVALUATION=False
ENABLE_DIFFICULTY_AGENT=False
ENABLE_CONCEPT_MAPPER=False

# Agent configuration
AGENT_TIMEOUT_SECONDS=30
MAX_AGENT_RETRIES=3
ENABLE_AGENT_LOGGING=True

# Groq API settings
GROQ_RATE_LIMIT_REQUESTS_PER_MINUTE=60
GROQ_TIMEOUT_SECONDS=30
```

#### Health Checks
```python
# Add to health_check endpoint
if request.query_params.get('agents'):
    agents_status = {
        'evaluation_agent': await check_agent_health(evaluation_agent),
        'hint_agent': await check_agent_health(hint_agent),
        'concept_mapper': await check_agent_health(concept_mapper),
    }
    payload['agents'] = agents_status
```

### Stage 1: Backend Infrastructure (Low Risk)

#### Deploy Agent Code Only
- **Files**: All agent modules in `tutor/agents/`
- **Database**: Run migrations (additive only)
- **Risk**: Low - no user-facing changes
- **Validation**: 
  - All unit tests pass
  - Agent health checks respond
  - Import tests succeed

#### Verification Commands
```bash
# Backend tests
python manage.py test tutor.agents

# Health checks
curl "http://localhost:8000/health/?agents=1"

# Import validation
python -c "from tutor.agents.orchestrator import orchestrator; print('OK')"
```

### Stage 2: Orchestrator Integration (Medium Risk)

#### Deploy with Feature Flags Off
- **Files**: Updated `ai_service.py`, `views.py`, `urls.py`
- **Feature Flags**: All set to `False`
- **Behavior**: Exactly same as before, using legacy code paths
- **Risk**: Medium - new code deployed but not active

#### Validation
```bash
# Test legacy endpoints still work
curl -X POST http://localhost:8000/api/submit-answer/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_id": 1, "submitted_answer": "test"}'

# Verify no agent calls made
grep -r "evaluation_agent.run" /var/log/django/ | tail -5
```

### Stage 3: Gradual Feature Enablement (High Risk)

#### 3.1: Enable EvaluationAgent Only
```bash
# Set feature flag
ENABLE_MULTI_AGENT_EVALUATION=True
```

- **Impact**: Answer evaluation uses new agent
- **Fallback**: String matching if agent fails
- **Monitoring**: Success rate, latency, fallback usage
- **Rollback**: Set flag to `False`

#### 3.2: Enable ConceptMapperAgent
```bash
# Set feature flag
ENABLE_CONCEPT_MAPPER=True
```

- **Impact**: Concept maps appear in responses
- **Fallback**: Empty concept arrays if agent fails
- **Monitoring**: Concept map generation success rate
- **Rollback**: Set flag to `False`

#### 3.3: Enable DifficultyAgent
```bash
# Set feature flag
ENABLE_DIFFICULTY_AGENT=True
```

- **Impact**: Difficulty recommendations appear
- **Fallback**: No recommendation if agent fails
- **Monitoring**: Recommendation accuracy, user acceptance
- **Rollback**: Set flag to `False`

### Stage 4: Frontend Integration (Medium Risk)

#### Deploy Frontend Components
- **Files**: `DifficultyBadge.jsx`, enhanced `Dashboard.jsx`
- **Backend Integration**: New API responses already available
- **Risk**: Medium - UI changes only
- **Validation**: Component rendering, error handling

#### Feature Flag Integration
```javascript
// Frontend feature flags
const FEATURES = {
  DIFFICULTY_BADGES: process.env.REACT_APP_ENABLE_DIFFICULTY_BADGES === 'true',
  CONCEPT_MAPS: process.env.REACT_APP_ENABLE_CONCEPT_MAPS === 'true',
  AGENT_TERMINAL: process.env.REACT_APP_ENABLE_AGENT_TERMINAL === 'true'
};
```

### Stage 5: Full Rollout (Low Risk)

#### Enable All Features
```bash
# Backend
ENABLE_MULTI_AGENT_EVALUATION=True
ENABLE_DIFFICULTY_AGENT=True
ENABLE_CONCEPT_MAPPER=True

# Frontend
REACT_APP_ENABLE_DIFFICULTY_BADGES=True
REACT_APP_ENABLE_CONCEPT_MAPS=True
REACT_APP_ENABLE_AGENT_TERMINAL=True
```

#### Remove Legacy Code (Optional)
- **Timeline**: 2 weeks after full rollout
- **Files**: Deprecated methods in `ai_service.py`
- **Process**: Comment out, monitor, then delete

## Monitoring & Validation

### Key Metrics Dashboard

#### Agent Performance
- **Success Rate**: Target >95% per agent
- **Latency**: p95 < 2s for EvaluationAgent
- **Fallback Rate**: Target <5% for all agents
- **Error Rate**: Target <1% for all agents

#### User Experience
- **API Response Time**: p95 < 3s for submit-answer
- **Error Rate**: Target <2% for all endpoints
- **User Satisfaction**: Monitor feedback patterns

#### System Health
- **Database Performance**: Query times <100ms
- **Memory Usage**: No memory leaks in agent processes
- **CPU Usage**: <70% average per server

### Automated Alerts

```yaml
# Prometheus alerts
groups:
  - name: agent_alerts
    rules:
      - alert: AgentHighFailureRate
        expr: agent_success_rate < 0.95
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent {{ $labels.agent_name }} failure rate > 5%"
      
      - alert: AgentHighLatency
        expr: agent_latency_p95 > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent {{ $labels.agent_name }} p95 latency > 2s"
      
      - alert: HighFallbackRate
        expr: agent_fallback_rate > 0.05
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Agent fallback rate > 5%"
```

## Rollback Procedures

### Immediate Rollback (<5 minutes)

#### Feature Flag Rollback
```bash
# Disable all agents immediately
ENABLE_MULTI_AGENT_EVALUATION=False
ENABLE_DIFFICULTY_AGENT=False
ENABLE_CONCEPT_MAPPER=False

# Restart application servers
systemctl restart gunicorn
```

#### Code Rollback
```bash
# Git rollback to previous tag
git checkout v1.7.0-stable

# Redeploy
./deploy.sh production
```

### Database Rollback
```sql
-- No rollback needed - all schema changes are additive
-- To disable new features:
UPDATE tutor_question SET prerequisite_hint = NULL WHERE prerequisite_hint IS NOT NULL;
```

### Frontend Rollback
```bash
# Serve previous build
cp -r /var/www/html/previous/* /var/www/html/current/
systemctl reload nginx
```

## Testing Strategy

### Pre-deployment Testing

#### Unit Tests
```bash
# Agent tests
python manage.py test tutor.agents.tests

# Integration tests
python manage.py test tutor.tests.test_agents_integration

# Performance tests
python benchmarks/bench_agents.py
```

#### Load Testing
```bash
# Simulate production load
locust -f tests/load_test.py --host=http://staging.example.com
```

#### Canary Testing
- Deploy to 1 server first
- Route 5% of traffic to canary
- Monitor for 30 minutes
- Gradually increase traffic

### Post-deployment Testing

#### Smoke Tests
```bash
# API health check
curl -f http://localhost:8000/health/

# Agent functionality
curl -X POST http://localhost:8000/api/submit-answer/ \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"question_id": 1, "submitted_answer": "test"}'

# Frontend loading
curl -f http://localhost:3000/
```

#### Regression Tests
```bash
# Full test suite
python manage.py test

# Frontend tests
cd ../neurotutor-ui && npm test
```

## Communication Plan

### Pre-deployment
- **24 hours**: Internal team notification
- **2 hours**: Status page update (maintenance window)
- **30 minutes**: Slack announcement

### During Deployment
- **Real-time**: Deployment status in Slack
- **Automated**: Alert monitoring team on issues
- **Manual**: Standby engineer for quick rollback

### Post-deployment
- **Immediate**: Success announcement
- **1 hour**: Performance metrics shared
- **24 hours**: Post-mortem of any issues

## Risk Mitigation

### Technical Risks
1. **LLM API Outage**: Fallback to string matching
2. **Database Issues**: Read-only mode for critical operations
3. **High Latency**: Circuit breakers disable slow agents
4. **Memory Leaks**: Process restarts every 24 hours

### Business Risks
1. **User Experience Degradation**: Feature flags for instant rollback
2. **Data Loss**: Read-only deployments first
3. **Extended Downtime**: Blue-green deployment strategy

### Operational Risks
1. **Team Unavailability**: Detailed runbooks for all procedures
2. **Monitoring Gaps**: Multiple monitoring systems
3. **Communication Failures**: Automated notifications

## Timeline

| Day | Activity | Risk Level |
|------|----------|------------|
| -7 | Preparation & testing | Low |
| -3 | Database migrations | Low |
| -2 | Stage 1: Backend infrastructure | Low |
| -1 | Stage 2: Orchestrator integration | Medium |
| 0 | Stage 3: Feature enablement | High |
| 0 | Stage 4: Frontend integration | Medium |
| +1 | Stage 5: Full rollout | Low |
| +7 | Legacy code cleanup | Low |
| +14 | Performance optimization | Low |

## Success Criteria

### Technical Success
- [ ] All agents operational with >95% success rate
- [ ] API latency p95 < 3 seconds
- [ ] Zero downtime during deployment
- [ ] All monitoring systems operational

### Business Success
- [ ] No increase in user error rates
- [ ] Positive feedback on new features
- [ ] No degradation in learning outcomes
- [ ] System scales to current user load

### Operational Success
- [ ] Team can deploy and rollback confidently
- [ ] Documentation complete and accurate
- [ ] Monitoring provides actionable insights
- [ ] Support team trained on new features

## Conclusion

This rollout strategy ensures a safe, incremental deployment of the multi-agent system with minimal risk to users and maximum visibility into system performance. The combination of feature flags, comprehensive monitoring, and clear rollback procedures provides multiple safety nets throughout the deployment process.
