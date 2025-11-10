---
doc_type: architecture
subsystem: general
version: 1.0.0
status: approved
owners: Architecture Team
last_reviewed: 2025-11-10
---

# ADR-0002: Centralized LLM Router Pattern

**Status:** Accepted
**Date:** 2025-11-10
**Decision Makers:** Architecture Team
**Supersedes:** N/A

## Context

As we expand from a single MCP server (Jules Control Room) to multiple MCP servers across different projects, we face duplication challenges:

### Problem Statement

1. **Configuration Duplication**: Each MCP server needs to manage LLM API keys, retry logic, timeout handling, and model selection independently
2. **Observability Gaps**: LLM usage metrics, costs, and performance data scattered across multiple services
3. **Maintenance Burden**: Changes to LLM client logic (new models, updated retry strategies, rate limit handling) require updates across all services
4. **Cost Management**: No centralized visibility or control over LLM API usage and spending
5. **Inconsistent Behavior**: Different services may handle LLM failures, retries, and fallbacks differently

### Current Architecture

```
┌─────────────────┐         ┌─────────────────┐
│ Jules Control   │         │  MCP Server 2   │
│     Room        │         │                 │
│                 │         │                 │
│ ┌─────────────┐ │         │ ┌─────────────┐ │
│ │ LLM Client  │ │         │ │ LLM Client  │ │
│ │ + API Keys  │ │         │ │ + API Keys  │ │
│ │ + Retry     │ │         │ │ + Retry     │ │
│ └──────┬──────┘ │         │ └──────┬──────┘ │
└────────┼────────┘         └────────┼────────┘
         │                           │
         │                           │
         └───────┬───────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Anthropic API │
         │  OpenAI API   │
         └───────────────┘
```

**Issues:**
- Duplicated configuration in each service
- Independent retry logic (inconsistent behavior)
- No centralized cost tracking
- Manual API key rotation across all services

### Deployment Context

All services will be deployed as Docker containers on the same host network, enabling:
- Low-latency inter-service communication
- Simple service discovery via container names
- Network isolation from external access
- Unified orchestration via docker-compose

### Industry Research

Research into 2025 MCP deployment patterns reveals this is an established best practice:

1. **MCP Gateway Pattern** - Docker and other vendors provide centralized routing infrastructure
2. **LLM Router Pattern** - Industry standard for multi-service LLM orchestration
3. **Centralized Hub Pattern** - Most widely adopted MCP deployment architecture
4. **Agent-as-Microservice** - Treating AI agents as domain-focused services with shared infrastructure

## Decision

**We will implement a Centralized LLM Router service that handles all LLM communication for multiple MCP servers.**

### Architecture

```
┌───────────────────────────────────────────────────┐
│          Centralized LLM Router Service           │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Model Selection & Routing Logic            │ │
│  │  - Route to appropriate model based on task │ │
│  │  - Cost optimization (cheap vs expensive)   │ │
│  │  - A/B testing support                      │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Centralized Configuration                  │ │
│  │  - Anthropic API key                        │ │
│  │  - OpenAI API key                           │ │
│  │  - Model preferences & defaults             │ │
│  │  - Retry strategies (exponential backoff)   │ │
│  │  - Timeout configurations                   │ │
│  │  - Rate limit management                    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Observability & Monitoring                 │ │
│  │  - Request/response logging                 │ │
│  │  - Cost tracking per service                │ │
│  │  - Latency metrics                          │ │
│  │  - Error rate monitoring                    │ │
│  │  - Model usage analytics                    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Reliability Features                       │ │
│  │  - Circuit breakers                         │ │
│  │  - Fallback model strategies                │ │
│  │  - Request queuing & load shedding          │ │
│  │  - Health checks                            │ │
│  └─────────────────────────────────────────────┘ │
└────────────────────┬──────────────────────────────┘
                     │ HTTP API (JSON)
                     │ Port 3000
     ┌───────────────┼───────────────┬──────────────┐
     │               │               │              │
┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐   ┌───▼──────┐
│  Jules   │   │   MCP    │   │   MCP    │   │   MCP    │
│ Control  │   │ Server   │   │ Server   │   │ Server   │
│   Room   │   │    #2    │   │    #3    │   │    #N    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
     │               │               │              │
     └───────────────┴───────────────┴──────────────┘
                Docker Network (mcp-network)
                          │
                          ▼
                 ┌─────────────────┐
                 │  Anthropic API  │
                 │   OpenAI API    │
                 │  Other LLM APIs │
                 └─────────────────┘
```

### Key Characteristics

**What the Router IS:**
- ✅ Lightweight routing service for LLM requests
- ✅ Centralized configuration management
- ✅ Observability and monitoring hub
- ✅ Reliability layer (retries, fallbacks, circuit breakers)
- ✅ Cost optimization and tracking

**What the Router is NOT:**
- ❌ Full API gateway with business logic
- ❌ Database or shared state manager
- ❌ MCP protocol handler (services remain independent)
- ❌ Session manager or authentication provider
- ❌ General-purpose message bus

### API Design

**Simple, focused HTTP API:**

```http
POST /v1/chat
Content-Type: application/json

{
  "prompt": "Write a function to calculate fibonacci",
  "context": {
    "service": "jules-control-room",
    "sessionId": "session-123",
    "taskType": "code-generation"
  },
  "preferences": {
    "model": "auto",           // or specific: "claude-3-5-sonnet"
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

**Response:**

```http
200 OK
Content-Type: application/json

{
  "content": "def fibonacci(n): ...",
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "inputTokens": 15,
    "outputTokens": 150,
    "cost": 0.00045
  },
  "metadata": {
    "latencyMs": 1250,
    "provider": "anthropic"
  }
}
```

### Deployment Configuration

**Docker Compose Structure:**

```yaml
version: '3.8'

networks:
  mcp-network:
    driver: bridge

services:
  llm-router:
    build: ./llm-router
    container_name: llm-router
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LOG_LEVEL=info
      - DEFAULT_MODEL=claude-3-5-sonnet-20241022
    ports:
      - "3000:3000"
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  jules-control-room:
    build: ./JulesMCP
    container_name: jules-control-room
    environment:
      - LLM_ROUTER_URL=http://llm-router:3000
      - LOCAL_TOKEN=${LOCAL_TOKEN}
    depends_on:
      llm-router:
        condition: service_healthy
    ports:
      - "3001:3001"
    networks:
      - mcp-network

  # Additional MCP servers follow same pattern
```

### Implementation Phases

**Phase 1: Standalone Service (Weeks 1-2)**
- Create new `llm-router` repository
- Implement core routing logic
- Basic model selection (Anthropic Claude, OpenAI GPT)
- Retry logic with exponential backoff
- Health check endpoint
- Structured logging

**Phase 2: Integration (Weeks 3-4)**
- Update Jules Control Room to use router
- Add observability (cost tracking, latency metrics)
- Docker Compose multi-service setup
- Testing and validation

**Phase 3: Enhanced Features (Weeks 5-8)**
- Circuit breakers and fallback strategies
- Advanced model routing (task-based selection)
- Cost optimization rules
- Monitoring dashboard (optional)

**Phase 4: Additional Services (Ongoing)**
- Integrate new MCP servers as they're built
- Refine routing logic based on usage patterns
- Add new LLM providers as needed

## Consequences

### Positive Consequences

1. **Zero Configuration Duplication**
   - API keys managed in one place
   - Single update point for retry logic, timeouts, model preferences
   - Consistent behavior across all services

2. **Centralized Observability**
   - Complete visibility into LLM usage across all projects
   - Cost tracking and budget alerts
   - Performance metrics (latency, error rates)
   - Easy to identify which services are heavy LLM users

3. **Cost Optimization**
   - Intelligent routing to cheaper models when appropriate
   - Usage caps and budget enforcement
   - A/B testing of models without changing service code

4. **Improved Reliability**
   - Centralized retry logic (exponential backoff)
   - Circuit breakers prevent cascading failures
   - Fallback to alternative models if primary unavailable
   - Request queuing during rate limits

5. **Faster Development of New Services**
   - New MCP servers just need to know router URL
   - No need to implement LLM client logic
   - Instant access to all configured models

6. **Security Benefits**
   - API keys stored in single service only
   - Easier to rotate credentials (one place)
   - Network isolation (only router talks to external APIs)

7. **Future-Proof Architecture**
   - Easy to add new LLM providers
   - Can implement advanced features (caching, prompt optimization)
   - Path to multi-tenancy if needed later

### Negative Consequences

1. **Single Point of Failure**
   - If router is down, all services lose LLM capability
   - **Mitigation:** Health checks, auto-restart, high availability in future
   - **Mitigation:** Local fallback mode in services (degraded operation)

2. **Network Hop Latency**
   - Additional ~1-10ms latency for intra-container communication
   - **Mitigation:** Negligible compared to LLM API latency (500-5000ms)
   - **Mitigation:** Same-host deployment keeps latency minimal

3. **Initial Development Effort**
   - Need to build router service (2-3 weeks)
   - Migration effort for existing services
   - **Benefit:** Pays off quickly with 2+ services

4. **Operational Complexity**
   - One more service to monitor and maintain
   - **Mitigation:** Simple, focused service with clear responsibilities
   - **Mitigation:** Comprehensive health checks and monitoring

5. **Learning Curve**
   - Team needs to understand router API
   - **Mitigation:** Simple HTTP API, well-documented
   - **Mitigation:** Consistent with REST patterns already in use

### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Router service failure | High | Low | Auto-restart, health checks, local fallback mode |
| Network latency issues | Low | Low | Same-host deployment, monitoring alerts |
| API key compromise | High | Low | Single point to rotate, audit logs, network isolation |
| Scaling bottleneck | Medium | Low | Async processing, request queuing, horizontal scaling path |
| Over-engineering for needs | Medium | Medium | Start simple, iterate based on real usage |

## Alternatives Considered

### Alternative 1: Shared Library/Package
**Approach:** Create npm package with LLM client logic, imported by each service

**Pros:**
- No additional service to run
- No network latency
- Simple to implement

**Cons:**
- Still duplicates configuration (API keys in each service)
- No centralized observability
- Updates require redeploying all services
- No centralized rate limit management

**Verdict:** ❌ Rejected - Doesn't solve configuration duplication problem

### Alternative 2: Keep Status Quo (Duplicate Everything)
**Approach:** Each service manages its own LLM clients independently

**Pros:**
- No new infrastructure
- Complete service independence

**Cons:**
- Configuration duplication (API keys, retry logic)
- Impossible to track total costs
- Inconsistent behavior across services
- High maintenance burden

**Verdict:** ❌ Rejected - Doesn't scale with multiple projects

### Alternative 3: Full MCP Gateway (Docker/FastMCP Cloud)
**Approach:** Use enterprise MCP gateway with full protocol handling

**Pros:**
- Production-proven solution
- Enterprise features (multi-tenancy, advanced auth)
- Comprehensive tooling

**Cons:**
- Over-engineered for personal projects
- Steeper learning curve
- Higher operational complexity
- May constrain architectural flexibility

**Verdict:** ⏸️ Deferred - Consider when scaling to 5+ services or multi-user needs

### Alternative 4: Service Mesh (Istio/Linkerd)
**Approach:** Use service mesh for all inter-service communication

**Pros:**
- Handles routing, observability, security holistically
- Industry-standard solution

**Cons:**
- Massive over-engineering for localhost deployment
- High complexity and operational overhead
- Kubernetes typically required
- Not specific to LLM routing needs

**Verdict:** ❌ Rejected - Wrong tool for the job

## Decision Rationale

The centralized LLM router pattern is chosen because:

1. **Solves Core Problem**: Eliminates configuration duplication and provides centralized observability
2. **Right-Sized**: Focused service, not over-engineered for personal use
3. **Industry-Aligned**: Matches 2025 best practices for MCP deployments
4. **Future-Proof**: Clear path to scale (can evolve to full gateway if needed)
5. **Low Risk**: Simple HTTP service, easy to implement and maintain
6. **Quick Payoff**: Benefits evident with just 2 services

## Related Decisions

- **ADR-0001**: MCP Framework Selection (FastMCP 2.0) - Complementary, router supports all frameworks
- **Future ADR**: If we need multi-tenancy, will revisit full MCP Gateway approach

## References

- [Docker MCP Gateway Documentation](https://www.docker.com/blog/build-ai-agents-with-docker-compose/)
- [MCP Deployment Patterns (2025)](https://abvijaykumar.medium.com/model-context-protocol-deep-dive-part-3-2-3-hands-on-deployment-patterns-3c2c45e65efb)
- [LLM Router Best Practices](https://arize.com/blog/best-practices-for-building-an-ai-agent-router/)
- [MCP Production Best Practices](https://thenewstack.io/15-best-practices-for-building-mcp-servers-in-production/)

## Review Schedule

- **Next Review:** 2026-02-10 (3 months after 2 services integrated)
- **Trigger for Earlier Review:** Scaling to 5+ services, multi-user requirements, performance issues

---

**Status:** Accepted
**Last Updated:** 2025-11-10
**Authors:** Architecture Team
**Reviewers:** Development Team
