---
doc_type: research
subsystem: general
version: 1.0.0
status: approved
owners: Research Team
last_reviewed: 2025-11-10
---

# Jules Control Room UI and Backend Merge Plan

## Executive Summary

This document outlines the recommended approach for merging the Jules Control Room UI (frontend) repository with the Jules Control Room backend repository into a unified application.

## Repository Overview

### UI Repository
- A React 18 + TypeScript application built with Tailwind CSS and shadcn/ui components
- Complete UX validation prototype for managing Jules AI coding sessions
- Uses mock data to simulate API responses
- Includes comprehensive documentation on backend integration requirements

### Backend Repository
- A secure Express.js backend designed to proxy Jules API calls
- Implements authentication, rate limiting, and real-time WebSocket updates
- Provides REST API endpoints for session management
- Production-ready with security and observability features

## Data Model Comparison

### Status Enums
- **UI**: `QUEUED | PLANNING | AWAITING_PLAN_APPROVAL | IN_PROGRESS | COMPLETED | FAILED | CANCELLED`
- **Backend**: `pending | in_progress | succeeded | failed`

### Activity Types
- **UI**: `AGENT_MESSAGE | PLAN | ARTIFACT | PROGRESS | USER_MESSAGE | APPROVAL | REJECTION`
- **Backend**: `user | system | jules` with generic `type: string`

### Session Structure
- **UI**: Includes `requirePlanApproval`, `autoCreatePR`, `plan` fields
- **Backend**: Includes `planStatus`, `approval`, `participants` fields

## Integration Plan

### Phase 1: Frontend Integration
1. **Replace Mock Data**
   - Remove `mockSessions` and `mockActivities` from UI
   - Implement API client to call backend endpoints
   - Add loading and error states to UI components

2. **API Client Implementation**
   ```typescript
   // Example API client
   const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
   
   export async function createSession(data) {
     const response = await fetch(`${API_BASE}/api/sessions`, {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${localStorage.getItem('token')}` 
       },
       body: JSON.stringify(data),
     });
     return response.json();
   }
   ```

3. **Data Mapping**
   - Create mapping functions to convert between UI and backend data models
   - Handle status mapping: backend `succeeded` → UI `COMPLETED`

### Phase 2: Backend Enhancements
1. **Static File Serving**
   - Configure Express to serve UI static files from `backend/public`
   - Set up proper MIME types and caching headers

2. **Endpoint Alignment**
   - Ensure all expected endpoints match UI requirements
   - Add any missing endpoints identified during integration
   - Optimize response formats for UI needs

3. **WebSocket Integration**
   - Connect UI to backend's WebSocket for real-time updates
   - Implement proper connection handling and reconnection logic

### Phase 3: Complete Integration
1. **Build Pipeline**
   - Set up build process to compile UI and place static files in `backend/public`
   - Configure development environment for full-stack development

2. **Authentication Alignment**
   - Standardize on backend's bearer token authentication
   - Implement auth in UI and ensure proper header forwarding

3. **Production Deployment**
   - Create unified Docker image containing both UI and backend
   - Configure environment variables for different deployment environments

## Addressing Key Challenges

### 1. Data Model Mismatch
**Challenge**: Different status enums and activity types between frontend and backend
**Solution**: Implement mapping layers in the API response transformation
```typescript
// Example mapping function
function mapBackendStatusToUI(backendStatus: string): string {
  switch(backendStatus) {
    case 'pending': return 'QUEUED';
    case 'in_progress': return 'IN_PROGRESS';
    case 'succeeded': return 'COMPLETED';
    case 'failed': return 'FAILED';
    default: return 'QUEUED';
  }
}
```

### 2. Approval Flow Differences
**Challenge**: UI has detailed plan approval flow but backend has simpler approval state
**Solution**: Enhance backend to support plan-specific approval states or adapt UI to use existing backend approval model

### 3. Real-time Updates
**Challenge**: UI designed for SSE/WebSocket but requires connection to backend's existing WebSocket
**Solution**: Connect UI to backend's WebSocket endpoint at `/ws` for session delta updates

### 4. Static File Serving
**Challenge**: UI is separate React app but needs to be integrated with backend
**Solution**: Build UI to static files and serve from backend's public directory with proper routing fallbacks

## Technical Architecture

### Directory Structure After Merge
```
jules-control-room/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── auth.ts
│   │   └── ...
│   ├── public/          # UI static files deployed here
│   └── ...
├── shared/
├── docs/
└── docs/merge/          # This document and others
    └── mergeplanOne.md
```

### Development Workflow
1. **Development**: Run UI dev server and backend server separately
2. **Production Build**: Build UI to static files, then start backend to serve them
3. **Docker**: Single container with both UI and backend

## Implementation Steps

### Frontend Integration
- Remove all mock data from UI
- Implement API client for all backend endpoints
- Create data mapping utilities
- Add loading and error states to UI
- Test API connections in development environment

### Backend Configuration
- Configure static file serving
- Optimize API responses for UI consumption
- Ensure WebSocket connectivity with UI
- Add any missing endpoints needed by UI

### Full Integration
- Set up unified build process
- Implement authentication in UI
- Test end-to-end functionality
- Create unified Docker configuration
- Document development and deployment workflows

## Success Metrics

1. **Functional**: UI successfully connects to all backend endpoints
2. **Performance**: API responses are reasonable and efficient
3. **Usability**: Real-time updates work through WebSocket connection
4. **Deployment**: Single container deployment works correctly
5. **Maintainability**: Code organization remains clear and logical

## Risks and Mitigation

1. **API Incompatibility**: Thorough testing during Phase 1
2. **Performance Issues**: Monitor API response times throughout integration
3. **Authentication Problems**: Implement auth early in the process
4. **Static File Serving**: Test various browser scenarios and routing

## Conclusion

The frontend and backend repositories are well-architected and complementary, making for a strong candidate for integration. The merge will create a complete Jules Control Room application with modern UI and robust backend infrastructure. The key success factors will be proper data mapping and maintaining clean separation of concerns during integration.