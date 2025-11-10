# Jules API Compatibility Audit

## Jules API Capabilities (Provided)

```
Endpoints:
- POST /v1alpha/sessions - Create session (prompt, sourceContext{repo, branch}, requirePlanApproval?)
- GET /v1alpha/sessions - List sessions
- GET /v1alpha/sessions/{id} - Get session details
- GET /v1alpha/sessions/{id}/activities - List activities
- POST /v1alpha/sessions/{id}:approve - Approve plan
- POST /v1alpha/sessions/{id}:sendMessage - Send message

Session States: QUEUED, PLANNING, AWAITING_PLAN_APPROVAL, IN_PROGRESS, COMPLETED, FAILED, CANCELLED

Activity Types: PLAN, AGENT_MESSAGE, USER_MESSAGE, ARTIFACT, PROGRESS

Auth: X-Goog-Api-Key (server-side only)
```

---

## Feature Compatibility Matrix

| UI Feature | Jules API Support | Status | Action Needed |
|------------|------------------|---------|---------------|
| **Create Session** | ✅ POST /v1alpha/sessions | SUPPORTED | Keep as-is |
| ↳ Repository field | ✅ sourceContext.repo | SUPPORTED | Keep |
| ↳ Branch field | ✅ sourceContext.branch | SUPPORTED | Keep |
| ↳ Prompt field | ✅ prompt | SUPPORTED | Keep |
| ↳ Require Plan Approval | ✅ requirePlanApproval | SUPPORTED | Keep |
| ↳ **Auto Create PR** | ❌ NOT IN API | **NOT SUPPORTED** | **Remove/disable** |
| **List Sessions** | ✅ GET /v1alpha/sessions | SUPPORTED | Keep |
| ↳ Search filter | ❓ Unknown if API supports | UNKNOWN | Keep (client-side filter) |
| ↳ Status filter | ❓ Unknown if API supports | UNKNOWN | Keep (client-side filter) |
| **Session Details** | ✅ GET /v1alpha/sessions/{id} | SUPPORTED | Keep |
| **Activity Stream** | ✅ GET /v1alpha/sessions/{id}/activities | SUPPORTED | Keep |
| **Approve Plan** | ✅ POST /v1alpha/sessions/{id}:approve | SUPPORTED | Keep |
| **Reject Plan** | ❌ Not explicitly in API | **NOT SUPPORTED** | **Change to "Cancel"** |
| **Send Message** | ✅ POST /v1alpha/sessions/{id}:sendMessage | SUPPORTED | Keep |
| **Cancel Session** | ❓ Not mentioned | UNKNOWN | Disable with comment |
| **Refresh** button | N/A (re-fetch) | CLIENT-SIDE | Keep (just re-fetches) |
| **Open PR** link | ❌ No PR creation endpoint | **NOT SUPPORTED** | **Hide/disable** |
| **Copy Session ID** | N/A | CLIENT-SIDE | Keep (clipboard only) |
| **Gemini Assist** | ⚡ Separate API, not Jules | **OPTIONAL FEATURE** | **Keep (mock implemented)** |
| **Quick Templates** | N/A | CLIENT-SIDE | Keep (just fills prompt) |
| **Theme Toggle** | N/A | CLIENT-SIDE | Keep |

---

## Required Changes

### 🔴 Remove Completely
1. **Auto Create PR toggle** - Jules API doesn't support this configuration
2. **"Open PR" button** - No PR URLs in session/activity responses
3. **"Reject Plan" button** - API only has `:approve`, rejection might be same as cancel

### 🟡 Disable with Explanation
1. **"Gemini Assist" button** - Needs separate Gemini API integration (not Jules)
2. **"Cancel Session" button** - Unclear if API supports cancellation

### 🟢 Keep As-Is
1. All form fields for session creation (repo, branch, prompt, requirePlanApproval)
2. Session listing and filtering (can do client-side)
3. Activity stream display
4. Approve plan action
5. Send message to Jules
6. All client-side features (search, theme, copy ID)

---

## Updated Data Model

### What Jules API Actually Returns

Based on typical Google API patterns, expect responses like:

```json
// POST /v1alpha/sessions response
{
  "name": "sessions/abc123",  // Resource name
  "state": "QUEUED",
  "createTime": "2025-10-13T10:00:00Z",
  "updateTime": "2025-10-13T10:00:00Z",
  "sourceContext": {
    "repo": "acme-corp/web-app",
    "branch": "main"
  },
  "prompt": "Add authentication...",
  "requirePlanApproval": true
}

// GET /v1alpha/sessions/{id}/activities response
{
  "activities": [
    {
      "name": "sessions/abc123/activities/1",
      "type": "PLAN",
      "content": "I will implement...",
      "createTime": "2025-10-13T10:01:00Z"
    },
    {
      "name": "sessions/abc123/activities/2",
      "type": "AGENT_MESSAGE",
      "content": "Starting implementation...",
      "createTime": "2025-10-13T10:02:00Z"
    }
  ]
}
```

### Fields We're Using That Might Not Exist
- `prUrl` - ❌ Probably not in Jules response
- `autoCreatePR` - ❌ Not a Jules API field
- `plan` as separate field - ❓ Might be in activities only

---

## Implementation Notes

### What Needs Server-Side Proxy
```
❌ Cannot call Jules API directly from browser (API key would be exposed)
✅ Must build Node.js backend to:
   - Accept frontend requests
   - Add X-Goog-Api-Key header
   - Forward to Jules API
   - Return responses to frontend
```

### Real-time Updates
```
Jules API likely doesn't have WebSocket/SSE support
Must implement polling:
  - Poll GET /v1alpha/sessions/{id} every 2-5 seconds
  - Poll GET /v1alpha/sessions/{id}/activities for new activity
  - Stop polling when status is terminal (COMPLETED, FAILED, CANCELLED)
```

---

## Next Steps

1. ✅ Remove "Auto Create PR" toggle from UI
2. ✅ Remove "Open PR" button from session detail
3. ✅ Change "Reject" button to "Cancel" (or disable entirely)
4. ✅ Disable "Gemini Assist" with tooltip explaining it needs separate integration
5. ✅ Add API integration comments in code
6. ✅ Update types to match actual Jules API response structure
