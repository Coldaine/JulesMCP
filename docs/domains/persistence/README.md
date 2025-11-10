---
doc_type: domain_overview
domain_code: persistence
version: 1.0.0
status: approved
owners: Backend Team
last_reviewed: 2025-11-10
---

# Persistence Domain

## Purpose

The Persistence domain provides optional data storage capabilities for the Jules Control Room Backend. It implements SQLite-based session delta history storage, enabling audit trails, historical analysis, and offline querying of session changes. This domain is designed to be completely optional and can be enabled/disabled via configuration without affecting core functionality.

## Scope

**In Scope:**
- SQLite database initialization and schema management
- Session delta storage (created, updated, deleted events)
- In-memory database with periodic file snapshots
- Query interface for historical delta retrieval
- Optional activation via `PERSIST=1` environment variable
- Data retention policies and cleanup
- Database file management (`data/sessions.sqlite`)
- Migration support for schema changes

**Out of Scope:**
- Real-time session state storage (handled by Jules API)
- User authentication data storage
- Configuration storage
- Log file persistence (handled by logging system)
- Distributed database replication
- Database backups and disaster recovery
- Multi-database support (PostgreSQL, MySQL, etc.)

## Key Components

### Persistence Module (`backend/src/persistence.ts`)

Primary module managing SQLite database operations.

**Core Exports:**
```typescript
export interface PersistenceStore {
  saveDelta(delta: SessionDelta): Promise<void>;
  getDeltas(sessionId?: string, limit?: number): Promise<SessionDelta[]>;
  cleanup(olderThan: Date): Promise<number>;
  close(): Promise<void>;
}

export function initPersistence(): PersistenceStore | null;
export const persistence: PersistenceStore | null;
```

**Conditional Initialization:**
```typescript
export const persistence = process.env.PERSIST === '1'
  ? initPersistence()
  : null;
```

### Database Schema

**Delta Table:**
```sql
CREATE TABLE IF NOT EXISTS session_deltas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  delta_type TEXT NOT NULL CHECK(delta_type IN ('created', 'updated', 'deleted')),
  before_state TEXT,
  after_state TEXT,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_session_deltas_session_id ON session_deltas(session_id);
CREATE INDEX IF NOT EXISTS idx_session_deltas_timestamp ON session_deltas(timestamp);
CREATE INDEX IF NOT EXISTS idx_session_deltas_created_at ON session_deltas(created_at);
```

**Column Descriptions:**
- `id` - Auto-incrementing primary key
- `session_id` - Jules session ID (indexed)
- `delta_type` - Type of change: 'created', 'updated', or 'deleted'
- `before_state` - JSON snapshot before change (NULL for 'created')
- `after_state` - JSON snapshot after change (NULL for 'deleted')
- `timestamp` - ISO 8601 timestamp from delta
- `created_at` - Database insertion timestamp

### In-Memory Database with Snapshots

**Implementation:**
```typescript
import initSqlJs from 'sql.js';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'sessions.sqlite');
const SNAPSHOT_INTERVAL = 60_000; // 1 minute

let db: Database;

async function initPersistence(): Promise<PersistenceStore> {
  const SQL = await initSqlJs();

  // Load existing database or create new
  let data: Buffer | undefined;
  try {
    data = await fs.readFile(DB_PATH);
  } catch (err) {
    // File doesn't exist, start fresh
  }

  db = new SQL.Database(data);

  // Create schema
  db.run(CREATE_TABLE_SQL);

  // Periodic snapshot to disk
  const snapshotTimer = setInterval(async () => {
    await saveSnapshot();
  }, SNAPSHOT_INTERVAL);

  return {
    saveDelta,
    getDeltas,
    cleanup,
    async close() {
      clearInterval(snapshotTimer);
      await saveSnapshot();
      db.close();
    }
  };
}

async function saveSnapshot(): Promise<void> {
  const data = db.export();
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, data);
  logger.debug('Database snapshot saved');
}
```

### Delta Storage

**Save Delta Function:**
```typescript
async function saveDelta(delta: SessionDelta): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO session_deltas (session_id, delta_type, before_state, after_state, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run([
    delta.sessionId,
    delta.type,
    delta.before ? JSON.stringify(delta.before) : null,
    delta.after ? JSON.stringify(delta.after) : null,
    delta.timestamp
  ]);

  stmt.free();
  logger.debug({ sessionId: delta.sessionId, type: delta.type }, 'Delta saved');
}
```

### Delta Retrieval

**Query Deltas Function:**
```typescript
async function getDeltas(sessionId?: string, limit = 100): Promise<SessionDelta[]> {
  let sql = 'SELECT * FROM session_deltas';
  const params: any[] = [];

  if (sessionId) {
    sql += ' WHERE session_id = ?';
    params.push(sessionId);
  }

  sql += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const stmt = db.prepare(sql);
  stmt.bind(params);

  const rows: SessionDelta[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push({
      type: row.delta_type as 'created' | 'updated' | 'deleted',
      sessionId: row.session_id as string,
      before: row.before_state ? JSON.parse(row.before_state as string) : undefined,
      after: row.after_state ? JSON.parse(row.after_state as string) : undefined,
      timestamp: row.timestamp as string
    });
  }

  stmt.free();
  return rows;
}
```

### Data Retention and Cleanup

**Cleanup Function:**
```typescript
async function cleanup(olderThan: Date): Promise<number> {
  const stmt = db.prepare(`
    DELETE FROM session_deltas
    WHERE created_at < ?
  `);

  stmt.run([olderThan.toISOString()]);
  const changes = db.getRowsModified();
  stmt.free();

  logger.info({ deleted: changes, olderThan }, 'Cleaned up old deltas');
  return changes;
}
```

**Scheduled Cleanup:**
```typescript
// Run daily cleanup (keep 30 days)
setInterval(() => {
  if (persistence) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    persistence.cleanup(thirtyDaysAgo);
  }
}, 24 * 60 * 60 * 1000); // Daily
```

## Dependencies

### Internal Dependencies
- **WebSocket** (`backend/src/ws.ts`) - Triggers delta storage on broadcast
- **Logging** (`backend/src/logging.ts`) - Structured logging
- **Shared Types** (`shared/types.ts`) - SessionDelta interface

### External Dependencies
- **sql.js** (^1.8.0) - SQLite compiled to WebAssembly
- **fs/promises** (Node.js built-in) - File system operations

## Related Domains

- **[WebSocket Domain](../websocket/README.md)** - Provides deltas to persist
- **[API Domain](../api/README.md)** - Can query historical deltas (future)
- **[Jules Integration Domain](../jules-integration/README.md)** - Source of session data

## Data Flow

### Delta Persistence Flow
```
[WebSocket] → Session Delta Detected
  ↓
[Broadcast to Clients]
  ↓
[persistence.saveDelta()] → If PERSIST=1
  ↓
[SQLite INSERT] → In-Memory Database
  ↓
[Background Snapshot] → Write to data/sessions.sqlite
  ↓
Delta Persisted
```

### Snapshot Flow
```
[Snapshot Timer] (every 60s)
  ↓
[db.export()] → Serialize Database
  ↓
[fs.writeFile()] → Write to Disk
  ↓
data/sessions.sqlite Updated
```

### Query Flow
```
Client Request (GET /api/deltas/:sessionId)
  ↓
[persistence.getDeltas(sessionId)]
  ↓
[SQLite SELECT] → Query with Filters
  ↓
[JSON.parse()] → Deserialize States
  ↓
Return SessionDelta[]
```

### Cleanup Flow
```
[Daily Timer] (00:00 UTC)
  ↓
[persistence.cleanup(30 days ago)]
  ↓
[SQLite DELETE] → Remove Old Rows
  ↓
[saveSnapshot()] → Compact Database
  ↓
Disk Space Reclaimed
```

## Storage Specification

### File Structure
```
data/
  └── sessions.sqlite    # SQLite database file
```

### Database Format
- **Engine:** SQLite 3.x
- **Format:** Binary (SQLite file format)
- **Size:** ~1KB overhead + (deltas × ~500 bytes)
- **Snapshot Frequency:** Every 60 seconds

### Delta Storage Format

**Example Row:**
```
id: 1
session_id: sess_abc123
delta_type: updated
before_state: {"id":"sess_abc123","planStatus":"pending"}
after_state: {"id":"sess_abc123","planStatus":"in_progress"}
timestamp: 2025-11-10T12:00:00Z
created_at: 2025-11-10T12:00:00.123Z
```

**Size Estimates:**
- Created delta: ~300-500 bytes (full session state)
- Updated delta: ~200-800 bytes (before + after states)
- Deleted delta: ~300-500 bytes (final state)

**Capacity:**
- 1000 deltas ≈ 500KB
- 10,000 deltas ≈ 5MB
- 100,000 deltas ≈ 50MB

## Testing

### Test Coverage
- **Location:** `backend/src/__tests__/persistence.test.ts`
- **Framework:** Vitest
- **Coverage Target:** All CRUD operations, cleanup, snapshots

### Key Test Scenarios

1. **Initialization:**
   - Create new database
   - Load existing database
   - Schema migration

2. **Delta Storage:**
   - Save created delta
   - Save updated delta
   - Save deleted delta
   - Concurrent writes

3. **Delta Retrieval:**
   - Get all deltas
   - Get deltas for specific session
   - Pagination with limit
   - Order by timestamp

4. **Cleanup:**
   - Delete old deltas
   - Verify retention period
   - Check row count after cleanup

5. **Snapshots:**
   - Periodic snapshot saving
   - Snapshot on close
   - File persistence

6. **Conditional Activation:**
   - PERSIST=1 enables storage
   - PERSIST=0 disables storage
   - Undefined PERSIST disables storage

### Test Examples

```typescript
describe('Persistence', () => {
  beforeEach(() => {
    process.env.PERSIST = '1';
  });

  it('saves and retrieves delta', async () => {
    const store = initPersistence();

    const delta: SessionDelta = {
      type: 'created',
      sessionId: 'sess_123',
      after: { id: 'sess_123', /* ... */ },
      timestamp: new Date().toISOString()
    };

    await store.saveDelta(delta);

    const deltas = await store.getDeltas('sess_123');
    expect(deltas).toHaveLength(1);
    expect(deltas[0].sessionId).toBe('sess_123');
  });

  it('filters deltas by session ID', async () => {
    const store = initPersistence();

    await store.saveDelta({ type: 'created', sessionId: 'sess_1', /* ... */ });
    await store.saveDelta({ type: 'created', sessionId: 'sess_2', /* ... */ });

    const deltas = await store.getDeltas('sess_1');
    expect(deltas).toHaveLength(1);
    expect(deltas[0].sessionId).toBe('sess_1');
  });

  it('cleans up old deltas', async () => {
    const store = initPersistence();

    // Insert old delta (manually set created_at)
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    // ... insert with old date

    const deleted = await store.cleanup(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    expect(deleted).toBeGreaterThan(0);
  });

  it('persists to disk on snapshot', async () => {
    const store = initPersistence();

    await store.saveDelta({ /* ... */ });
    await saveSnapshot(); // Trigger manual snapshot

    const data = await fs.readFile(DB_PATH);
    expect(data.length).toBeGreaterThan(0);
  });
});
```

## Configuration

### Environment Variables
- **PERSIST** - Enable persistence (set to '1' to enable, default: disabled)
- **DB_PATH** - Database file path (default: `data/sessions.sqlite`)
- **SNAPSHOT_INTERVAL** - Snapshot frequency in ms (default: 60000)
- **RETENTION_DAYS** - Days to retain deltas (default: 30)

### Example Configuration
```bash
# .env
PERSIST=1
DB_PATH=./data/sessions.sqlite
SNAPSHOT_INTERVAL=60000
RETENTION_DAYS=30
```

### Runtime Configuration
```typescript
// backend/src/persistence.ts
const config = {
  enabled: process.env.PERSIST === '1',
  dbPath: process.env.DB_PATH || 'data/sessions.sqlite',
  snapshotInterval: parseInt(process.env.SNAPSHOT_INTERVAL || '60000'),
  retentionDays: parseInt(process.env.RETENTION_DAYS || '30')
};
```

## Monitoring & Observability

### Logging

**Delta Saved:**
```json
{
  "level": "debug",
  "time": "2025-11-10T12:00:00.000Z",
  "msg": "Delta saved",
  "sessionId": "sess_abc123",
  "type": "updated"
}
```

**Snapshot Saved:**
```json
{
  "level": "debug",
  "time": "2025-11-10T12:01:00.000Z",
  "msg": "Database snapshot saved",
  "dbPath": "data/sessions.sqlite",
  "size": 512000
}
```

**Cleanup Completed:**
```json
{
  "level": "info",
  "time": "2025-11-10T00:00:00.000Z",
  "msg": "Cleaned up old deltas",
  "deleted": 1543,
  "olderThan": "2025-10-11T00:00:00.000Z"
}
```

### Metrics to Track
- Delta insertion rate (per second)
- Database file size
- Snapshot duration
- Cleanup frequency and deleted count
- Query latency (p50, p95, p99)
- Disk space usage

### Health Checks
```typescript
export function getStats() {
  if (!persistence) return null;

  return {
    enabled: true,
    dbPath: DB_PATH,
    fileSize: fs.statSync(DB_PATH).size,
    deltaCount: db.exec('SELECT COUNT(*) FROM session_deltas')[0].values[0][0]
  };
}
```

## Performance Considerations

### In-Memory Performance
- All queries execute in memory (fast)
- No disk I/O on reads (only snapshots)
- Typical query: <1ms

### Snapshot Impact
- Snapshot operation: ~10-50ms for 1MB database
- Runs asynchronously (non-blocking)
- Configurable frequency (default: 60s)

### Scalability Limits
- Recommended max: 100,000 deltas (~50MB)
- Beyond limit: Consider archival or pruning
- Query performance degrades linearly

### Optimization Strategies
1. **Index Usage:**
   - Indexes on `session_id`, `timestamp`, `created_at`
   - Speeds up filtered queries

2. **Batch Inserts:**
   - Use transactions for multiple deltas
   - Reduces snapshot overhead

3. **Compression:**
   - Compress JSON states before storage
   - Reduces storage by ~60%

## Security Considerations

### File Permissions
- Database file owned by application user
- Permissions: 0600 (read/write owner only)
- Directory permissions: 0700

### Data Exposure
- No sensitive data in deltas (session IDs, statuses)
- No authentication tokens stored
- No personally identifiable information (PII)

### Access Control
- No direct SQL injection risk (parameterized queries)
- No external database connections
- File-based access only

### Backup Security
- Database files should be encrypted at rest
- Backup rotation with retention policies
- Secure deletion of old backups

## Future Enhancements

### Planned Features

1. **Query API:**
   - REST endpoint for historical queries
   - GraphQL interface for complex queries
   - Export to CSV/JSON

2. **Compression:**
   - Gzip JSON states
   - Reduce storage by ~60%
   - Transparent decompression

3. **Archival:**
   - Move old deltas to cold storage
   - S3/Glacier integration
   - Query across archive

4. **Analytics:**
   - Session duration statistics
   - Approval rate metrics
   - Activity heatmaps

5. **Migration Support:**
   - Schema versioning
   - Automatic migrations
   - Rollback capability

### Potential Database Backends

**PostgreSQL:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function saveDelta(delta: SessionDelta): Promise<void> {
  await pool.query(
    'INSERT INTO session_deltas (session_id, delta_type, before_state, after_state, timestamp) VALUES ($1, $2, $3, $4, $5)',
    [delta.sessionId, delta.type, JSON.stringify(delta.before), JSON.stringify(delta.after), delta.timestamp]
  );
}
```

**Redis (Time-Series):**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function saveDelta(delta: SessionDelta): Promise<void> {
  await redis.zadd(
    `deltas:${delta.sessionId}`,
    Date.parse(delta.timestamp),
    JSON.stringify(delta)
  );
}
```

## Migration Strategy

### From SQLite to PostgreSQL

**Step 1: Export Data**
```typescript
const deltas = await persistence.getDeltas();
await fs.writeFile('deltas-export.json', JSON.stringify(deltas));
```

**Step 2: Import to PostgreSQL**
```typescript
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const deltas = JSON.parse(await fs.readFile('deltas-export.json', 'utf-8'));

for (const delta of deltas) {
  await pool.query(
    'INSERT INTO session_deltas (...) VALUES (...)',
    [/* ... */]
  );
}
```

**Step 3: Update Configuration**
```bash
# .env
PERSIST=1
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@localhost/julesdb
```

## Troubleshooting

### Common Issues

**Issue:** Database file not found
- **Cause:** `data/` directory doesn't exist
- **Solution:** Create directory or configure writable path

**Issue:** High memory usage
- **Cause:** In-memory database too large
- **Solution:** Reduce retention period, archive old data

**Issue:** Snapshot failures
- **Cause:** Disk full or permission denied
- **Solution:** Check disk space, verify file permissions

**Issue:** Query performance degradation
- **Cause:** Too many deltas, missing indexes
- **Solution:** Run cleanup, verify indexes exist

### Debug Commands

**Check Database Size:**
```bash
ls -lh data/sessions.sqlite
```

**Query Delta Count:**
```typescript
const count = db.exec('SELECT COUNT(*) FROM session_deltas')[0].values[0][0];
console.log('Delta count:', count);
```

**Manual Cleanup:**
```typescript
const deleted = await persistence.cleanup(new Date('2025-01-01'));
console.log('Deleted:', deleted);
```

**Force Snapshot:**
```typescript
await saveSnapshot();
console.log('Snapshot saved');
```

## Change Log

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0.0   | 2025-11-10 | Initial domain overview documentation        |

## Additional Resources

- **[SQLite Documentation](https://www.sqlite.org/docs.html)** - Official SQLite reference
- **[sql.js Documentation](https://sql.js.org/)** - SQLite in WebAssembly
- **[Database Testing Guide](../../guides/testing/database-testing.md)** - Testing strategies for persistence
- **[Data Retention Policies](../../standards/data-retention.md)** - Organizational data policies
