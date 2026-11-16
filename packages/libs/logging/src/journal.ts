import {
  constants,
  closeSync,
  fstatSync,
  mkdirSync,
  openSync,
  writeSync,
} from 'node:fs';
import { lstat, open, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface JournalEntry {
  time: string;
  level: string | number;
  msg: string;
  [key: string]: unknown;
}
export interface JournalPolicy {
  enabled?: boolean;
  retentionDays?: number;
  maxSizeMB?: number;
}
export interface JournalQuery {
  cursor?: string;
  level?: string;
  source?: string;
  search?: string;
  since?: string;
  until?: string;
  fromStart?: boolean;
}
export interface JournalPage {
  entries: JournalEntry[];
  cursor: string;
  hasMore: boolean;
  available: boolean;
  reset: boolean;
}
const MAX_READ = 256 * 1024;
const MAX_LINE = 32 * 1024;
const SECRET =
  /password|secret|token|authorization|cookie|api.?key|access.?key|private.?key|client.?secret|credentials/i;

/** Sanitize at the persistence boundary, including nested errors and free text. */
export function sanitizeLog(value: unknown, depth: number = 0): unknown {
  if (depth > 8) return '[TRUNCATED]';
  if (typeof value === 'string') {
    // Bound every parser and matcher before scanning untrusted process output.
    const text = value.slice(0, MAX_LINE);
    const urlCredentials =
      value.length > MAX_LINE
        ? /\b([a-z][a-z0-9+.-]{0,31}:\/\/)[^\s/:@]+:[^\s/@]+(?:@|$)/gi
        : /\b([a-z][a-z0-9+.-]{0,31}:\/\/)[^\s/:@]+:[^\s/@]+@/gi;
    // Parse structured text before free-text matching, including escaped JSON strings.
    if (/^\s*[[{]/.test(text)) {
      try {
        return JSON.stringify(sanitizeLog(JSON.parse(text), depth + 1));
      } catch {
        // Legacy output need not be JSON.
      }
    }
    return text
      .replace(
        /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g,
        '[REDACTED]',
      )
      .replace(/((?:Bearer|Basic)\s+)[^\s"'\\,;]+/gi, '$1[REDACTED]')
      .replace(urlCredentials, '$1[REDACTED]@')
      .replace(
        /((?:password|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|authorization|cookie|credentials)[\w-]{0,64}(?:\\?["'])?\s*[=:]\s*)(?:"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)|[^\r\n,;&}]+)/gi,
        '$1[REDACTED]',
      )
      .replace(
        /\b(?:sk-[a-zA-Z0-9_-]+|gh[pousr]_[a-zA-Z0-9_]+|github_pat_[a-zA-Z0-9_]+|glpat-[a-zA-Z0-9_-]+|xox[baprs]-[a-zA-Z0-9-]+|npm_[a-zA-Z0-9_]+|fg(?:[kro]|reg|dl)_[a-zA-Z0-9_-]+)/g,
        '[REDACTED]',
      );
  }
  if (value instanceof Error)
    return sanitizeLog(
      {
        type: value.name,
        message: value.message,
        stack: value.stack,
        cause: value.cause,
        ...(value instanceof AggregateError ? { errors: value.errors } : {}),
      },
      depth + 1,
    );
  if (Array.isArray(value))
    return value.slice(0, 100).map((item) => sanitizeLog(item, depth + 1));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 100)
        .map(([key, item]) => [
          key,
          SECRET.test(key) ? '[REDACTED]' : sanitizeLog(item, depth + 1),
        ]),
    );
  return value;
}

export function validateJournalPolicy(policy: JournalPolicy): void {
  for (const key of ['retentionDays', 'maxSizeMB'] as const) {
    const value = policy[key];
    if (value !== undefined && (!Number.isFinite(value) || value <= 0))
      throw new Error(`logging.${key} must be positive`);
  }
}

function boundedText(value: unknown, bytes: number): unknown {
  if (typeof value !== 'string')
    return typeof value === 'number' || typeof value === 'boolean'
      ? value
      : undefined;
  // JSON escaping can expand each UTF-16 code unit to six bytes.
  return value.slice(0, Math.floor(bytes / 6));
}

function compactError(value: unknown, depth: number = 0): unknown {
  if (!value || typeof value !== 'object' || depth > 2)
    return boundedText(value, 1024);
  const error = value as Record<string, unknown>;
  return {
    type: boundedText(error.type, 256),
    code: boundedText(error.code, 256),
    message: boundedText(error.message, 2048),
    stack: boundedText(error.stack, 4096),
    cause: depth < 2 ? compactError(error.cause, depth + 1) : undefined,
  };
}

/** Keep correlation and failure details when optional payloads exceed the line budget. */
function serializeEntry(entry: JournalEntry): string {
  const sanitized = sanitizeLog(entry) as JournalEntry;
  const line = JSON.stringify(sanitized) + '\n';
  if (Buffer.byteLength(line) <= MAX_LINE) return line;
  const compact: Record<string, unknown> = {
    time: boundedText(sanitized.time, 512),
    level: boundedText(sanitized.level, 256),
    msg: boundedText(sanitized.msg, 4096),
    truncated: true,
  };
  for (const key of [
    'logger',
    'service',
    'appId',
    'deploymentId',
    'runtimeId',
    'requestId',
    'workflowId',
    'executionId',
    'nodeId',
    'nodeKey',
    'phase',
    'sequence',
  ]) {
    const value = sanitized[key];
    if (typeof value === 'string' || typeof value === 'number')
      compact[key] = boundedText(value, 512);
  }
  compact.err = compactError(sanitized.err);
  return JSON.stringify(compact) + '\n';
}

/** One complete append per entry. No file descriptor survives a write or rotation. */
export function appendJournal(
  file: string,
  entry: JournalEntry,
  maxSizeMB: number = 50,
): void {
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const fd = openSync(
    file,
    constants.O_CREAT |
      constants.O_APPEND |
      constants.O_WRONLY |
      constants.O_NOFOLLOW,
    0o600,
  );
  try {
    const stats = fstatSync(fd);
    if (!stats.isFile())
      throw new Error('Log destination must be a regular file');
    const limit = maxSizeMB * 1024 * 1024;
    if (stats.size >= limit) return;
    let line = serializeEntry(entry);
    if (stats.size + Buffer.byteLength(line) >= limit) {
      const marker = JSON.stringify({
        time: entry.time,
        level: 'warn',
        msg: 'Log size limit reached; subsequent entries are omitted.',
        truncated: true,
      });
      line =
        marker +
        ' '.repeat(
          Math.max(
            0,
            Math.ceil(limit - stats.size) - Buffer.byteLength(marker) - 1,
          ),
        ) +
        '\n';
    }
    writeSync(fd, line);
  } finally {
    closeSync(fd);
  }
}

export async function pruneJournals(
  directory: string,
  policy: JournalPolicy,
  protectedFile?: string | readonly string[],
  options: { recursive?: boolean } = {},
): Promise<void> {
  validateJournalPolicy(policy);
  const files = await listFiles(directory, options.recursive);
  let total = files.reduce((sum, file) => sum + file.size, 0);
  const expiry = Date.now() - (policy.retentionDays ?? 7) * 86400000;
  for (const file of files.sort((a, b) => a.modified - b.modified)) {
    const protectedNames =
      typeof protectedFile === 'string'
        ? [protectedFile]
        : (protectedFile ?? []);
    if (
      protectedNames.some(
        (name) =>
          path.resolve(directory, name) === path.resolve(directory, file.name),
      )
    )
      continue;
    if (
      file.modified < expiry ||
      total > (policy.maxSizeMB ?? 500) * 1024 * 1024
    ) {
      await unlink(path.join(directory, file.name)).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
        },
      );
      total -= file.size;
    }
  }
}

interface LogFile {
  name: string;
  size: number;
  inode: number;
  modified: number;
}
async function listFiles(
  directory: string,
  recursive = false,
): Promise<LogFile[]> {
  try {
    if ((await lstat(directory)).isSymbolicLink())
      throw new Error('Symbolic log directories are not allowed');
    const entries = await readdir(directory, { withFileTypes: true });
    const files: LogFile[] = [];
    for (const entry of entries) {
      if (
        recursive &&
        entry.isDirectory() &&
        /^(?:runs|\d{4}-\d{2}-\d{2})$/.test(entry.name)
      ) {
        for (const file of await listFiles(
          path.join(directory, entry.name),
          true,
        ))
          files.push({ ...file, name: path.join(entry.name, file.name) });
      }
      if (
        !entry.isFile() ||
        !/^[a-zA-Z0-9_.-]+\.(?:log(?:\.\d+)?|stderr)$/.test(entry.name)
      )
        continue;
      const stats = await lstat(path.join(directory, entry.name));
      if (stats.isFile())
        files.push({
          name: entry.name,
          size: stats.size,
          inode: stats.ino,
          modified: stats.mtimeMs,
        });
    }
    return files.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

interface ReadPosition {
  inode: number;
  offset: number;
  pending: JournalEntry[];
  discardPartial?: boolean;
}
interface ReadState {
  positions: Map<string, ReadPosition>;
}
interface CachedRead {
  scope: string;
  state: ReadState;
  expires: number;
  bytes: number;
}
// Cursors stay small regardless of the number of files. Keep immutable checkpoints
// so retries and concurrent requests with the same cursor return the same records.
const reads = new Map<string, CachedRead>();
const CURSOR_TTL = 5 * 60 * 1000;
const MAX_CURSORS = 128;
const MAX_CURSOR_BYTES = 64 * 1024 * 1024;
let cursorBytes = 0;

function forgetRead(cursor: string, cached: CachedRead): void {
  reads.delete(cursor);
  cursorBytes -= cached.bytes;
}

function saveRead(scope: string, state: ReadState): string {
  const bytes = Buffer.byteLength(JSON.stringify([...state.positions]));
  if (bytes > MAX_CURSOR_BYTES)
    throw new Error(
      'Too many log sources to read within the journal memory limit',
    );
  for (const [cursor, cached] of reads) {
    if (
      cached.expires < Date.now() ||
      reads.size >= MAX_CURSORS ||
      cursorBytes + bytes > MAX_CURSOR_BYTES
    )
      forgetRead(cursor, cached);
  }
  const cursor = `j1.${randomUUID()}`;
  reads.set(cursor, { scope, state, expires: Date.now() + CURSOR_TTL, bytes });
  cursorBytes += bytes;
  return cursor;
}

function parseEntry(
  line: string,
  logId: string,
  query: JournalQuery,
): JournalEntry | undefined {
  try {
    const item = JSON.parse(line) as JournalEntry;
    if (
      !item ||
      typeof item.msg !== 'string' ||
      !['string', 'number'].includes(typeof item.level)
    )
      return;
    const timestamp =
      typeof item.time === 'number' ? item.time : Date.parse(item.time);
    if (!Number.isFinite(timestamp)) return;
    item.time = new Date(timestamp).toISOString();
    item.logId = logId;
    const levels: Record<string, number> = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60,
    };
    if (
      query.level &&
      String(item.level) !== query.level &&
      levels[query.level] !== item.level
    )
      return;
    if (query.source && item.logger !== query.source) return;
    if (query.since && item.time < query.since) return;
    if (query.until && item.time > query.until) return;
    if (
      query.search &&
      !line.toLowerCase().includes(query.search.toLowerCase())
    )
      return;
    return sanitizeLog(item) as JournalEntry;
  } catch {
    // Skip malformed and non-JSON legacy lines.
    return;
  }
}

interface ReadBudget {
  remaining: number;
  reset: boolean;
}

/** Read ahead only until this file has a candidate for the time-ordered merge. */
async function fillPosition(
  directory: string,
  file: LogFile,
  position: ReadPosition,
  query: JournalQuery,
  budget: ReadBudget,
): Promise<'ready' | 'waiting' | 'blocked'> {
  if (position.pending.length || position.offset >= file.size) return 'ready';
  if (!budget.remaining) return 'blocked';
  let fd;
  try {
    fd = await open(
      path.join(directory, file.name),
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    const stats = await fd.stat();
    if (!stats.isFile() || stats.ino !== file.inode || stats.size < file.size) {
      budget.reset = true;
      position.offset = file.size;
      return 'waiting';
    }
    while (!position.pending.length && position.offset < file.size) {
      if (!budget.remaining) return 'blocked';
      const length = Math.min(
        MAX_LINE,
        budget.remaining,
        file.size - position.offset,
      );
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await fd.read(buffer, 0, length, position.offset);
      budget.remaining -= bytesRead;
      if (!bytesRead) return 'waiting';
      const chunk = buffer.subarray(0, bytesRead);
      const end = chunk.lastIndexOf(10);
      if (end < 0) {
        if (bytesRead === MAX_LINE) {
          // Skip an oversized legacy line without consuming its suffix as JSON.
          position.offset += bytesRead;
          position.discardPartial = true;
          budget.reset = true;
          continue;
        }
        if (position.offset + bytesRead >= file.size) return 'waiting';
        budget.remaining = 0;
        return 'blocked';
      }
      let start = 0;
      if (position.discardPartial) {
        start = chunk.indexOf(10) + 1;
        position.discardPartial = false;
      }
      let lineOffset = position.offset + start;
      for (const line of chunk
        .subarray(start, end)
        .toString('utf8')
        .split('\n')) {
        const item = parseEntry(
          line,
          `${file.name}:${file.inode}:${lineOffset}`,
          query,
        );
        if (item) position.pending.push(item);
        lineOffset += Buffer.byteLength(line) + 1;
      }
      position.offset += end + 1;
    }
    return 'ready';
  } catch (error) {
    if (
      ['ENOENT', 'ELOOP'].includes((error as NodeJS.ErrnoException).code ?? '')
    ) {
      budget.reset = true;
      position.offset = file.size;
      return 'waiting';
    }
    throw error;
  } finally {
    await fd?.close();
  }
}

/** Merge source streams chronologically with bounded scans and short, scoped cursors. */
export async function readJournal(
  directory: string,
  query: JournalQuery = {},
  filename?: string,
): Promise<JournalPage> {
  const scope = JSON.stringify([
    path.resolve(directory),
    filename,
    query.level,
    query.source,
    query.search,
    query.since,
    query.until,
  ]);
  if (query.cursor && !/^j1\.[a-f0-9-]{36}$/.test(query.cursor))
    throw new Error('Invalid log cursor');
  const cached = query.cursor ? reads.get(query.cursor) : undefined;
  if (cached && cached.scope !== scope) throw new Error('Invalid log cursor');
  const previous =
    cached && cached.expires >= Date.now() ? cached.state : undefined;
  if (cached && !previous) forgetRead(query.cursor!, cached);
  const files = (await listFiles(directory)).filter(
    (file) => !filename || file.name === filename,
  );
  const budget: ReadBudget = {
    remaining: MAX_READ,
    reset: Boolean(query.cursor && !previous),
  };
  const state: ReadState = { positions: new Map() };
  const names = new Set(files.map((file) => file.name));
  if (
    previous &&
    [...previous.positions.keys()].some((name) => !names.has(name))
  )
    budget.reset = true;
  const latest = new Set(
    files
      .slice()
      .sort((a, b) => b.modified - a.modified)
      .slice(0, 4)
      .map((file) => file.name),
  );
  for (const file of files) {
    const prior = previous?.positions.get(file.name);
    if (prior?.inode === file.inode && prior.offset <= file.size) {
      state.positions.set(file.name, { ...prior, pending: [...prior.pending] });
      continue;
    }
    if (prior) budget.reset = true;
    const offset =
      !previous && !query.fromStart
        ? latest.has(file.name)
          ? Math.max(0, file.size - MAX_READ / 4)
          : file.size
        : 0;
    state.positions.set(file.name, {
      inode: file.inode,
      offset,
      pending: [],
      discardPartial: offset > 0 && offset < file.size,
    });
  }
  const entries: JournalEntry[] = [];
  const waiting = new Set<string>();
  let emittedBytes = 0;
  while (true) {
    let blocked = false;
    for (const file of files) {
      if (waiting.has(file.name)) continue;
      const readiness = await fillPosition(
        directory,
        file,
        state.positions.get(file.name)!,
        query,
        budget,
      );
      if (readiness === 'waiting') waiting.add(file.name);
      if (readiness === 'blocked') {
        blocked = true;
        break;
      }
    }
    // Never emit a later source before an unread source has supplied its head.
    if (blocked) break;
    let earliest: ReadPosition | undefined;
    for (const position of state.positions.values()) {
      if (!position.pending.length) continue;
      const candidate = position.pending[0];
      const current = earliest?.pending[0];
      if (
        !current ||
        candidate.time < current.time ||
        (candidate.time === current.time &&
          String(candidate.logId) < String(current.logId))
      )
        earliest = position;
    }
    if (!earliest) break;
    const entry = earliest.pending[0];
    const bytes = Buffer.byteLength(JSON.stringify(entry)) + 1;
    if (entries.length && emittedBytes + bytes > MAX_READ) break;
    earliest.pending.shift();
    entries.push(entry);
    emittedBytes += bytes;
  }
  return {
    entries,
    cursor: saveRead(scope, state),
    hasMore: files.some((file) => {
      const position = state.positions.get(file.name)!;
      return (
        position.pending.length > 0 ||
        (!waiting.has(file.name) && position.offset < file.size)
      );
    }),
    available: files.length > 0,
    reset: budget.reset,
  };
}
