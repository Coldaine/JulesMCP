import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fileStore = new Map<string, Buffer>();
const existingFiles = new Set<string>();

const logEvent = vi.fn();
const logError = vi.fn();

class FakeStatement {
  constructor(private readonly sessions: Map<string, string>) {}

  run(args: unknown[]): void {
    const [id, data] = args as [string, string];
    this.sessions.set(id, data);
  }

  free(): void {}
}

class FakeDatabase {
  private sessions = new Map<string, string>();

  constructor(file?: Uint8Array) {
    if (file && file.length) {
      const decoded = Buffer.from(file).toString('utf8');
      const entries = JSON.parse(decoded) as [string, string][];
      this.sessions = new Map(entries);
    }
  }

  run(_sql: string): void {}

  prepare(): FakeStatement {
    return new FakeStatement(this.sessions);
  }

  exec(_sql: string) {
    if (!this.sessions.size) {
      return [];
    }
    return [
      {
        columns: ['data'],
        values: Array.from(this.sessions.values()).map((value) => [value]),
      },
    ];
  }

  export(): Uint8Array {
    const json = JSON.stringify(Array.from(this.sessions.entries()));
    return new TextEncoder().encode(json);
  }
}

vi.mock('../logging.js', () => ({
  logEvent,
  logError,
}));

vi.mock('sql.js', () => ({
  default: async () => ({
    Database: FakeDatabase,
  }),
}));

vi.mock('node:fs', () => ({
  existsSync: (file: string) => existingFiles.has(file),
}));

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => {}),
  readFile: vi.fn(async (file: string) => {
    const data = fileStore.get(file);
    if (!data) {
      const error = new Error('ENOENT');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      throw error;
    }
    return data;
  }),
  writeFile: vi.fn(async (file: string, data: Buffer | string | Uint8Array) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    existingFiles.add(file);
    fileStore.set(file, buffer);
  }),
}));

const sessionFixture = {
  id: 'sess-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  repo: 'repo/a',
  planStatus: 'pending' as const,
  approval: 'approved' as const,
  participants: ['alice'],
};

describe('persistence', () => {
  const dataDir = path.join(process.cwd(), 'tmp-persistence');
  const dbFile = path.join(dataDir, 'sessions.sqlite');

  beforeEach(() => {
    process.env.PERSIST = '1';
    process.env.DATA_DIR = dataDir;
    fileStore.clear();
    existingFiles.clear();
    logEvent.mockClear();
    logError.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.PERSIST;
    delete process.env.DATA_DIR;
  });

  it('writes sessions to disk and loads them on next import', async () => {
    const { persistSessions } = await import('../persistence.js');

    await persistSessions([sessionFixture]);

    const fsPromises = await import('node:fs/promises');
    expect(fsPromises.mkdir).toHaveBeenCalledWith(dataDir, { recursive: true });
    expect(fsPromises.writeFile).toHaveBeenCalledWith(dbFile, expect.any(Buffer));

    const persisted = fileStore.get(dbFile);
    expect(persisted).toBeDefined();
    const entries = JSON.parse(Buffer.from(persisted!).toString('utf8')) as [string, string][];
    expect(entries).toEqual([[sessionFixture.id, JSON.stringify(sessionFixture)]]);

    vi.resetModules();
    const { loadSessions } = await import('../persistence.js');
    const loaded = await loadSessions();

    expect(loaded).toEqual([sessionFixture]);
  });

  it('logs and swallows read failures', async () => {
    existingFiles.add(dbFile);
    const corrupted = Buffer.from('not-sql');
    fileStore.set(dbFile, corrupted);

    const { loadSessions } = await import('../persistence.js');
    const result = await loadSessions();

    expect(result).toEqual([]);
    expect(logError).toHaveBeenCalled();
    const lastCall = logError.mock.calls.at(-1)?.[0];
    expect(lastCall).toMatchObject({ msg: 'persistence_read_failed' });
  });
});
