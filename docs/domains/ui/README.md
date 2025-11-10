---
doc_type: domain_overview
domain_code: ui
version: 1.0.0
status: approved
owners: Frontend Team
last_reviewed: 2025-11-10
---

# UI Domain

## Purpose

The UI domain provides the user-facing interface for the Jules Control Room Backend. It delivers a real-time dashboard for monitoring and managing Jules AI coding sessions, displaying session status, activity logs, and approval workflows. This domain focuses on creating an intuitive, responsive, and performant single-page application that leverages WebSocket connections for live updates.

## Scope

**In Scope:**
- React-based single-page application (SPA)
- Real-time session status dashboard
- Session creation and configuration interface
- Session approval workflow UI
- Activity log visualization
- WebSocket integration for live updates
- REST API client for initial data load and mutations
- Authentication token management
- Responsive design for desktop and tablet
- Error handling and user feedback

**Out of Scope:**
- Mobile-native applications (iOS, Android)
- Backend server implementation (handled by other domains)
- WebSocket server logic (handled by WebSocket domain)
- Authentication backend (handled by Auth domain)
- Multi-user features (not applicable to personal tool)
- Internationalization (English only for personal tool)

## Key Components

### Application Shell (`frontend/src/App.tsx`)

Root component managing application state and layout.

**Responsibilities:**
- WebSocket connection lifecycle
- Global state management (sessions, connection status)
- Route configuration (if multi-page)
- Error boundary handling

**Key State:**
```typescript
interface AppState {
  sessions: JulesSession[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  error: string | null;
  wsClient: WebSocket | null;
}
```

### Session Dashboard (`frontend/src/components/SessionDashboard.tsx`)

Main dashboard displaying all active sessions.

**Features:**
- Session list with status indicators
- Real-time updates via WebSocket
- Session filtering and sorting
- Quick actions (approve, view details, delete)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Jules Control Room          [●] Connected │
├─────────────────────────────────────────┤
│ [+ New Session]  [Filter ▼]  [Sort ▼]  │
├─────────────────────────────────────────┤
│ Session: owner/repo                     │
│ Branch: main          Status: Pending   │
│ [Approve] [View Details]                │
├─────────────────────────────────────────┤
│ Session: owner/repo2                    │
│ Branch: feature       Status: Active    │
│ [View Details]                          │
└─────────────────────────────────────────┘
```

### Session Detail View (`frontend/src/components/SessionDetail.tsx`)

Detailed view of a single session.

**Sections:**
- Session metadata (repository, branch, created date)
- Plan status and approval state
- Activity log timeline
- Message input for sending commands
- Participant list

**Layout:**
```
┌─────────────────────────────────────────┐
│ ← Back to Dashboard                     │
├─────────────────────────────────────────┤
│ owner/repo (main)                       │
│ Status: In Progress  Approved: Yes      │
├─────────────────────────────────────────┤
│ Activity Log                            │
│ ┌─────────────────────────────────────┐ │
│ │ 12:00 - Plan created                │ │
│ │ 12:05 - Plan approved               │ │
│ │ 12:10 - Execution started           │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Send Message                            │
│ [Text Input........................... ] │
│                              [Send]      │
└─────────────────────────────────────────┘
```

### Session Creation Form (`frontend/src/components/CreateSessionForm.tsx`)

Modal or page for creating new sessions.

**Fields:**
- Repository (text input with validation)
- Branch (text input, optional)
- Description (textarea, optional)

**Validation:**
- Repository format: `owner/repo`
- Branch name: alphanumeric with `-`, `_`, `/`

### WebSocket Client (`frontend/src/services/websocket.ts`)

WebSocket connection manager with reconnection logic.

**Implementation:**
```typescript
export class WSClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  connect(onMessage: (delta: SessionDelta) => void): void {
    this.ws = new WebSocket('ws://localhost:3001', [`bearer.${this.token}`]);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const delta = JSON.parse(event.data);
      onMessage(delta);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(onMessage);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(onMessage: (delta: SessionDelta) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(onMessage);
      }, delay);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### REST API Client (`frontend/src/services/api.ts`)

HTTP client for REST API interactions.

**Functions:**
```typescript
export async function createSession(input: CreateSessionInput): Promise<JulesSession>;
export async function listSessions(): Promise<JulesSession[]>;
export async function getSession(id: string): Promise<JulesSession>;
export async function getActivities(id: string): Promise<SessionActivity[]>;
export async function approveSession(id: string, approved: boolean, feedback?: string): Promise<JulesSession>;
export async function sendMessage(id: string, content: string): Promise<void>;
```

**Implementation:**
```typescript
const API_BASE = 'http://localhost:3001/api';
const token = localStorage.getItem('auth_token');

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(response.status, error.error, error.message);
  }

  return response.json();
}
```

### State Management

**Option 1: React Context + Hooks**
```typescript
interface SessionContextValue {
  sessions: JulesSession[];
  addSession: (session: JulesSession) => void;
  updateSession: (delta: SessionDelta) => void;
  removeSession: (id: string) => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
}
```

**Option 2: Zustand**
```typescript
import create from 'zustand';

interface SessionStore {
  sessions: JulesSession[];
  addSession: (session: JulesSession) => void;
  updateSession: (delta: SessionDelta) => void;
  removeSession: (id: string) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (delta) => set((state) => ({
    sessions: state.sessions.map(s =>
      s.id === delta.sessionId ? { ...s, ...delta.after } : s
    )
  })),
  removeSession: (id) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== id)
  }))
}));
```

## Dependencies

### Internal Dependencies
- **Backend API** - REST endpoints for data operations
- **Backend WebSocket** - Real-time delta broadcasting

### External Dependencies
- **react** (^18.2.0) - UI framework
- **react-dom** (^18.2.0) - DOM rendering
- **typescript** (^5.0.0) - Type safety
- **vite** (^4.4.0) - Build tool and dev server
- **tailwindcss** (^3.3.0) - CSS framework (optional)
- **zustand** or **react-query** - State management (optional)

## Related Domains

- **[API Domain](../api/README.md)** - Provides REST endpoints consumed by UI
- **[WebSocket Domain](../websocket/README.md)** - Provides real-time delta streaming
- **[Auth Domain](../auth/README.md)** - Validates authentication tokens

## Data Flow

### Initial Load Flow
```
User Opens UI
  ↓
[Load Auth Token from localStorage]
  ↓
[REST API: GET /sessions]
  ↓
[Render Session List]
  ↓
[Establish WebSocket Connection]
  ↓
UI Ready (Listening for Deltas)
```

### Real-Time Update Flow
```
Backend Detects Session Change
  ↓
[WebSocket Broadcast Delta]
  ↓
UI Receives WebSocket Message
  ↓
[Parse SessionDelta]
  ↓
[Update State]
  ├─ Created → Add to List
  ├─ Updated → Merge Changes
  └─ Deleted → Remove from List
  ↓
UI Re-Renders (React)
```

### Session Creation Flow
```
User Fills Form
  ↓
[Validate Input]
  ↓
[REST API: POST /sessions]
  ↓
[Receive New Session]
  ↓
[Add to Local State]
  ↓
[Close Form, Show Success]
  ↓
(WebSocket will broadcast same session to other clients)
```

### Session Approval Flow
```
User Clicks "Approve" Button
  ↓
[REST API: POST /sessions/:id/approve]
  ↓
[Receive Updated Session]
  ↓
[Update Local State]
  ↓
UI Shows "Approved" Status
  ↓
(WebSocket broadcasts update to other clients)
```

## User Interface Specification

### Color Scheme

**Status Colors:**
- **Pending:** Yellow (`#FFC107`)
- **In Progress:** Blue (`#2196F3`)
- **Succeeded:** Green (`#4CAF50`)
- **Failed:** Red (`#F44336`)
- **Approved:** Green (`#4CAF50`)
- **Rejected:** Red (`#F44336`)

**Connection Status:**
- **Connected:** Green indicator
- **Connecting:** Yellow pulsing indicator
- **Disconnected:** Red indicator

### Typography
- **Headings:** Inter, sans-serif, bold
- **Body:** Inter, sans-serif, regular
- **Code/IDs:** JetBrains Mono, monospace

### Layout Breakpoints
- **Desktop:** ≥1024px (full layout)
- **Tablet:** 768px-1023px (responsive adjustments)
- **Mobile:** <768px (not optimized, basic functionality)

## Testing

### Test Coverage
- **Location:** `frontend/src/__tests__/`
- **Framework:** Vitest + React Testing Library
- **Coverage Target:** ≥80% for components, 100% for services

### Key Test Scenarios

1. **Component Rendering:**
   - Session dashboard displays sessions
   - Session detail shows activity log
   - Create form validates input

2. **WebSocket Integration:**
   - Connection established on mount
   - Deltas update UI state
   - Reconnection on disconnect

3. **REST API Calls:**
   - Create session success/error
   - Approve session success/error
   - List sessions initial load

4. **User Interactions:**
   - Click approve button
   - Submit create form
   - Navigate between views

5. **Error Handling:**
   - Network errors display message
   - Validation errors show inline
   - WebSocket disconnect notification

### Test Examples

```typescript
describe('SessionDashboard', () => {
  it('renders session list', () => {
    const sessions = [
      { id: 'sess_1', repository: 'owner/repo', planStatus: 'pending', /* ... */ }
    ];

    render(<SessionDashboard sessions={sessions} />);

    expect(screen.getByText('owner/repo')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('updates session on WebSocket delta', async () => {
    const { rerender } = render(<SessionDashboard sessions={[]} />);

    // Simulate WebSocket message
    const delta: SessionDelta = {
      type: 'created',
      sessionId: 'sess_1',
      after: { id: 'sess_1', repository: 'owner/repo', /* ... */ },
      timestamp: new Date().toISOString()
    };

    act(() => {
      handleWebSocketMessage(delta);
    });

    expect(screen.getByText('owner/repo')).toBeInTheDocument();
  });
});

describe('WSClient', () => {
  it('connects with authentication token', () => {
    const client = new WSClient('test-token');
    const onMessage = vi.fn();

    client.connect(onMessage);

    expect(WebSocket).toHaveBeenCalledWith(
      'ws://localhost:3001',
      ['bearer.test-token']
    );
  });

  it('reconnects on disconnect', async () => {
    const client = new WSClient('test-token');
    const onMessage = vi.fn();

    client.connect(onMessage);

    // Simulate disconnect
    const ws = WebSocket.mock.instances[0];
    ws.onclose();

    await waitFor(() => {
      expect(WebSocket).toHaveBeenCalledTimes(2); // Initial + reconnect
    });
  });
});
```

## Configuration

### Environment Variables

**Development (`.env.development`):**
```bash
VITE_API_BASE=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

**Production (`.env.production`):**
```bash
VITE_API_BASE=https://jules-control.example.com/api
VITE_WS_URL=wss://jules-control.example.com
```

### Build Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
});
```

## Monitoring & Observability

### Client-Side Logging

**Console Logging (Development):**
```typescript
console.log('[WS] Connected');
console.log('[API] Creating session:', input);
console.error('[API] Request failed:', error);
```

**Production Logging:**
- Send errors to backend endpoint
- User analytics (optional)
- Performance metrics (Core Web Vitals)

### Error Tracking

**Error Boundary:**
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React error:', error, errorInfo);
    // Send to backend logging endpoint
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({ error: error.message, stack: error.stack })
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Performance Monitoring

**Metrics to Track:**
- Time to first render
- WebSocket connection latency
- API request duration
- UI interaction responsiveness

**Implementation:**
```typescript
// Performance mark
performance.mark('sessions-load-start');

await fetchSessions();

performance.mark('sessions-load-end');
performance.measure('sessions-load', 'sessions-load-start', 'sessions-load-end');

const measure = performance.getEntriesByName('sessions-load')[0];
console.log('Sessions loaded in', measure.duration, 'ms');
```

## Performance Considerations

### React Optimization

**Memoization:**
```typescript
const SessionCard = React.memo(({ session }: { session: JulesSession }) => {
  return (
    <div>
      <h3>{session.repository}</h3>
      <p>{session.planStatus}</p>
    </div>
  );
});
```

**Virtual Scrolling:**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={sessions.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <SessionCard session={sessions[index]} />
    </div>
  )}
</FixedSizeList>
```

### Bundle Size Optimization

**Code Splitting:**
```typescript
const SessionDetail = React.lazy(() => import('./components/SessionDetail'));

<Suspense fallback={<Loading />}>
  <SessionDetail sessionId={id} />
</Suspense>
```

**Tree Shaking:**
- Import only used functions: `import { useState } from 'react'`
- Avoid barrel imports: `import { Button } from './components/Button'` (not `./components`)

### Caching Strategy

**API Response Caching:**
```typescript
// Use React Query for automatic caching
import { useQuery } from 'react-query';

function useSession(id: string) {
  return useQuery(['session', id], () => getSession(id), {
    staleTime: 30_000, // 30s
    cacheTime: 300_000 // 5m
  });
}
```

## Security Considerations

### Token Storage
- Store auth token in `localStorage`
- Clear token on logout
- No sensitive data in localStorage besides token

### XSS Prevention
- React automatically escapes strings
- Sanitize HTML if using `dangerouslySetInnerHTML`
- Validate user input on client and server

### HTTPS/WSS in Production
- Always use HTTPS in production
- Always use WSS (WebSocket Secure) in production
- Enforce secure context for sensitive operations

## Future Enhancements

### Planned Features

1. **Advanced Filtering:**
   - Filter by repository, status, date range
   - Save filter presets
   - Search by session ID or description

2. **Notifications:**
   - Browser notifications for session events
   - Notification preferences
   - Sound alerts

3. **Dark Mode:**
   - System preference detection
   - Manual toggle
   - Persistent preference

4. **Activity Log Export:**
   - Export to CSV, JSON
   - Date range selection
   - Filtered export

5. **Keyboard Shortcuts:**
   - Navigate sessions (j/k)
   - Quick approve (a)
   - Quick create (c)
   - Help modal (?)

### UI/UX Improvements

**Session Timeline:**
```
[Created] ─────> [Pending] ─────> [Approved] ─────> [In Progress] ─────> [Succeeded]
```

**Activity Log Grouping:**
```
Today
  12:00 - Session created
  12:05 - Plan approved

Yesterday
  10:30 - Execution completed
  10:31 - Session closed
```

**Session Statistics:**
```
┌─────────────────────────────────────────┐
│ Total Sessions: 127                     │
│ Active: 3   Pending: 1   Completed: 123 │
│ Avg Duration: 15m   Success Rate: 94%   │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Common Issues

**Issue:** WebSocket connection fails
- **Cause:** Backend not running or incorrect URL
- **Solution:** Verify backend is running, check VITE_WS_URL

**Issue:** Authentication errors
- **Cause:** Missing or invalid token
- **Solution:** Check localStorage for `auth_token`, verify token validity

**Issue:** UI not updating on session changes
- **Cause:** WebSocket disconnected or state not updating
- **Solution:** Check browser console for WS errors, verify delta handling

**Issue:** Blank page on load
- **Cause:** JavaScript error or build issue
- **Solution:** Check browser console, rebuild with `npm run build`

### Debug Tools

**React DevTools:**
- Install React DevTools browser extension
- Inspect component props and state
- Profile performance

**Network Tab:**
- Monitor API requests
- Check WebSocket connection
- Verify request/response payloads

**Console Commands:**
```javascript
// Check WebSocket connection
window.wsClient.readyState // 1 = OPEN

// Inspect current state
window.__REACT_DEVTOOLS_GLOBAL_HOOK__

// Force reconnect
window.wsClient.disconnect();
window.wsClient.connect();
```

## Change Log

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-10 | Initial domain overview documentation        |

## Additional Resources

- **[React Documentation](https://react.dev/)** - Official React reference
- **[Vite Documentation](https://vitejs.dev/)** - Build tool documentation
- **[WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)** - MDN WebSocket reference
- **[React Testing Library](https://testing-library.com/react)** - Testing documentation
- **[Frontend Testing Guide](../../guides/testing/frontend-testing.md)** - Testing strategies for UI
- **[Component Design Patterns](../../guides/patterns/react-patterns.md)** - React best practices
