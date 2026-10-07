/**
 * An App's runtime log as a `JournalPage`. By default it is the container's stdout and stderr through the Engine API
 * (`docker logs` with timestamps), so it works for any image and any endpoint; lines that are JSON log records (pino,
 * which NocoBase uses) keep their fields.
 */
import {
  sanitizeLog,
  type JournalEntry,
  type JournalPage,
  type JournalQuery,
} from '@nocobase/logging';

import type { DockerApi, LogLine } from './docker-api.js';

const CURSOR_PREFIX = 'd1.';
const PAGE_LIMIT = 500;
const TAIL = 200;
const LEVEL_NAMES: Readonly<Record<number, string>> = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

/** RFC 3339 with up to nine fractional digits, as a fixed-width string that sorts correctly. */
export function normalizeTime(time: string): string {
  const match = /^(.*T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(time);
  if (!match) return time;
  return `${match[1]}.${(match[2] ?? '').padEnd(9, '0').slice(0, 9)}Z`;
}

/** Docker's `since` takes Unix seconds with nanoseconds. */
function toDockerTime(time: string): string | undefined {
  const normalized = normalizeTime(time);
  const match = /^(.*T\d{2}:\d{2}:\d{2})\.(\d{9})Z$/.exec(normalized);
  if (!match) {
    const ms = Date.parse(time);
    return Number.isNaN(ms) ? undefined : String(Math.floor(ms / 1000));
  }
  const seconds = Math.floor(Date.parse(`${match[1]}Z`) / 1000);
  return `${seconds}.${match[2]}`;
}

export function toEntry(line: LogLine): JournalEntry {
  const text = line.text;
  if (text.startsWith('{')) {
    try {
      const record = JSON.parse(text) as Record<string, unknown>;
      if (record && typeof record === 'object') {
        const level = record.level;
        return sanitizeLog({
          ...record,
          time:
            typeof record.time === 'string'
              ? record.time
              : typeof record.time === 'number'
                ? new Date(record.time).toISOString()
                : line.time,
          level:
            typeof level === 'number'
              ? (LEVEL_NAMES[level] ?? level)
              : typeof level === 'string'
                ? level
                : 'info',
          msg: typeof record.msg === 'string' ? record.msg : '',
          stream: line.stream,
        }) as JournalEntry;
      }
    } catch {
      // Not JSON after all; kept as text below.
    }
  }
  return sanitizeLog({
    time: line.time,
    level: line.stream === 'stderr' ? 'warn' : 'info',
    msg: text,
    stream: line.stream,
  }) as JournalEntry;
}

export async function containerLogPage(
  docker: DockerApi,
  containerId: string | null,
  query: JournalQuery,
): Promise<JournalPage> {
  const cursorTime = query.cursor?.startsWith(CURSOR_PREFIX)
    ? query.cursor.slice(CURSOR_PREFIX.length)
    : null;
  if (!containerId)
    return {
      entries: [],
      cursor: query.cursor ?? '',
      hasMore: false,
      available: false,
      reset: false,
    };
  const since = cursorTime ?? query.since;
  const lines = await docker.logs(containerId, {
    since: since ? toDockerTime(since) : undefined,
    until: query.until ? toDockerTime(query.until) : undefined,
    tail: since || query.fromStart ? undefined : TAIL,
  });
  const after = cursorTime ? normalizeTime(cursorTime) : null;
  const entries: JournalEntry[] = [];
  let last = cursorTime;
  let hasMore = false;
  for (const line of lines) {
    if (after && normalizeTime(line.time) <= after) continue;
    if (entries.length >= PAGE_LIMIT) {
      hasMore = true;
      break;
    }
    last = line.time || last;
    const entry = toEntry(line);
    if (query.level && String(entry.level) !== query.level) continue;
    if (
      query.source &&
      entry.stream !== query.source &&
      entry.logger !== query.source
    )
      continue;
    if (
      query.search &&
      !line.text.toLowerCase().includes(query.search.toLowerCase())
    )
      continue;
    entries.push(entry);
  }
  return {
    entries,
    cursor: last ? `${CURSOR_PREFIX}${last}` : (query.cursor ?? ''),
    hasMore,
    available: true,
    reset: Boolean(query.cursor && !cursorTime),
  };
}
