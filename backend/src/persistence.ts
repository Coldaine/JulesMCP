import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import initSqlJs, { type Database } from 'sql.js';

import { logError, logEvent } from './logging.js';

import type { JulesSession, SessionDelta } from '@shared/types';


export const persistenceEnabled = process.env.PERSIST === '1';
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sessions.sqlite');

let dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (!persistenceEnabled) {
    throw new Error('persistence_disabled');
  }
  if (!dbPromise) {
    dbPromise = init();
  }
  return dbPromise;
}

async function init(): Promise<Database> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const wasmPath = resolveWasm();
    const SQL = await initSqlJs({
      locateFile: () => wasmPath,
    });
    let db: Database;
    if (existsSync(DB_FILE)) {
      const file = await readFile(DB_FILE);
      db = new SQL.Database(file);
    } else {
      db = new SQL.Database();
    }
    db.run(
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    );
    logEvent({ msg: 'persistence_ready', driver: 'sql.js', path: DB_FILE });
    return db;
  } catch (error) {
    logError({ msg: 'persistence_init_failed', err: error as Error });
    throw error;
  }
}

type PersistInput = SessionDelta | JulesSession;
function isDelta(item: PersistInput): item is SessionDelta {
  return typeof (item as SessionDelta).change === 'string';
}

export async function persistSessions(items: PersistInput[]): Promise<void> {
  if (!persistenceEnabled || !items.length) {
    return;
  }
  const db = await getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO sessions (id, data, updated_at) VALUES (?, ?, ?)');
  const remove = db.prepare('DELETE FROM sessions WHERE id = ?');
  try {
    db.run('BEGIN TRANSACTION');
    let mutated = false;
    for (const item of items) {
      if (isDelta(item)) {
        const delta = item;
        if (delta.current) {
          upsert.run([delta.current.id, JSON.stringify(delta.current), delta.current.updatedAt]);
          mutated = true;
        }
        if (!delta.current && delta.change === 'deleted') {
          remove.run([delta.id]);
          mutated = true;
        }
      } else {
        const session = item as JulesSession;
        upsert.run([session.id, JSON.stringify(session), session.updatedAt]);
        mutated = true;
      }
    }
    db.run('COMMIT');
    if (mutated) {
      await flush(db);
    }
  } catch (error) {
    db.run('ROLLBACK');
    logError({ msg: 'persistence_write_failed', err: error as Error });
  } finally {
    upsert.free();
    remove.free();
  }
}

export async function loadSessions(): Promise<JulesSession[]> {
  if (!persistenceEnabled) {
    return [];
  }
  try {
    const db = await getDb();
    const result = db.exec('SELECT data FROM sessions');
    if (!result.length) {
      return [];
    }
    const rows = result[0].values as string[][];
    return rows.map(([data]) => JSON.parse(data) as JulesSession);
  } catch (error) {
    logError({ msg: 'persistence_read_failed', err: error as Error });
    return [];
  }
}

async function flush(db: Database): Promise<void> {
  const data = db.export();
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_FILE, Buffer.from(data));
}

function resolveWasm(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
}
