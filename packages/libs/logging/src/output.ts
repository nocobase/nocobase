import { Writable } from 'node:stream';
import { lstatSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  appendJournal,
  appendPrivateJournalLine,
  assertJournalDirectory,
  pruneJournals,
  sanitizeLog,
  serializeJournalEntry,
  validateJournalPolicy,
  type JournalEntry,
  type JournalPolicy,
} from './journal.js';

export interface FileLogOptions extends JournalPolicy {
  retentionOnly?: boolean;
  directory?: string;
  name?: string;
  maxFileSizeMB?: number;
  maxTotalSizeMB?: number;
}
export interface LoggerFileOptions {
  directory?: string;
  enabled?: boolean;
  name?: string;
}
export interface ConsoleLogOptions {
  enabled?: boolean;
  pretty?: boolean;
  /**
   * Color level labels in pretty output. Defaults to writing color only to a terminal, so piped or
   * captured output stays plain; `NO_COLOR` disables it and `FORCE_COLOR` requests it.
   */
  color?: boolean;
  /**
   * Where console records go. Defaults to `stdout`, where a server's supervisor collects them. A command-line run sets
   * `stderr`, so that records an application logs while a command runs never mix with the command's own result on
   * stdout — a `--json` document in particular.
   */
  stream?: 'stdout' | 'stderr';
}
export interface LogOutputOptions {
  file?: FileLogOptions;
  console?: ConsoleLogOptions;
}
const reported = new Set<string>();
/** Logging failures must not recursively log or change application results. */
export function reportLoggingFailure(message: string, error?: unknown): void {
  if (reported.has(message)) return;
  reported.add(message);
  try {
    process.stderr.write(
      `${message}${error === undefined ? '' : `: ${JSON.stringify(sanitizeLog(error))}`}\n`,
    );
  } catch {
    // No further output is possible when stderr itself is unavailable.
  }
}
export function normalizeFileOptions(
  file: FileLogOptions = {},
): FileLogOptions {
  if (file.maxSizeMB !== undefined)
    reportLoggingFailure(
      'logging.file.maxSizeMB is deprecated; use maxTotalSizeMB',
    );
  const normalized = {
    ...file,
    name: file.name ?? 'app',
    maxTotalSizeMB: file.maxSizeMB ?? file.maxTotalSizeMB ?? 500,
    maxFileSizeMB:
      file.maxFileSizeMB ??
      Math.min(10, (file.maxSizeMB ?? file.maxTotalSizeMB ?? 500) / 2),
    retentionDays: file.retentionDays ?? 7,
  };
  validateJournalPolicy({
    retentionDays: normalized.retentionDays,
    maxSizeMB: normalized.maxTotalSizeMB,
  });
  validateJournalPolicy({ maxSizeMB: normalized.maxFileSizeMB });
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized.name))
    throw new Error('Invalid log file name');
  if (normalized.maxFileSizeMB > normalized.maxTotalSizeMB)
    throw new Error(
      'logging.file.maxFileSizeMB must not exceed maxTotalSizeMB',
    );
  return normalized;
}
/** Level colors match the pino-pretty palette developers saw before console.pretty replaced it. */
const levelColors: Readonly<Record<string, readonly [string, string]>> = {
  TRACE: ['\u001b[90m', '\u001b[39m'],
  DEBUG: ['\u001b[34m', '\u001b[39m'],
  INFO: ['\u001b[32m', '\u001b[39m'],
  WARN: ['\u001b[33m', '\u001b[39m'],
  ERROR: ['\u001b[31m', '\u001b[39m'],
  FATAL: ['\u001b[41m\u001b[37m', '\u001b[39m\u001b[49m'],
};
/** An escape only helps a terminal, and the environment can override that guess. */
function resolveConsoleColor(
  configured: boolean | undefined,
  stream: NodeJS.WriteStream,
): boolean {
  if (configured !== undefined) return configured;
  const forced = process.env.FORCE_COLOR;
  // Node itself lets FORCE_COLOR override NO_COLOR, and warns that it does.
  if (forced !== undefined) return forced !== '0' && forced !== 'false';
  if (process.env.NO_COLOR) return false;
  return stream.isTTY === true;
}
function prettyEntry(entry: JournalEntry, color: boolean): string {
  const {
    time,
    level,
    logger,
    msg,
    err,
    pid: _pid,
    hostname: _hostname,
    service: _service,
    appId,
    runtimeId: _runtimeId,
    deploymentId: _deploymentId,
    durationMs,
    ...fields
  } = entry;
  const names: Record<number, string> = {
    10: 'TRACE',
    20: 'DEBUG',
    30: 'INFO',
    40: 'WARN',
    50: 'ERROR',
    60: 'FATAL',
  };
  const label =
    typeof level === 'number'
      ? (names[level] ?? String(level))
      : level.toUpperCase();
  const palette = color ? levelColors[label] : undefined;
  const shown = palette ? `${palette[0]}${label}${palette[1]}` : label;
  const name = typeof logger === 'string' ? logger : 'system';
  const scope = typeof appId === 'string' ? `${appId}/${name}` : name;
  if (fields.app === appId) delete fields.app;
  // The completion message already contains the method, path and status.
  // Keep failure and debug context, and retain every field in the journal.
  if (name === 'request' && label === 'INFO') {
    delete fields.req;
    delete fields.res;
    delete fields.requestId;
  }
  const details = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(' ');
  const date = new Date(time);
  const clock = Number.isNaN(date.getTime())
    ? time
    : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
  return `${clock} ${shown} [${scope}] ${msg}${typeof durationMs === 'number' ? ` ${durationMs}ms` : ''}${details ? ` ${details}` : ''}${err ? `\n${JSON.stringify(err, null, 2)}` : ''}\n`;
}
interface LogSegment {
  date: string;
  part: number;
  filename: string;
}

function selectLogSegment(
  directory: string,
  name: string,
  extension: '.log' | '.jsonl',
  maxBytes: number,
  bytes: number,
  active?: LogSegment,
): LogSegment {
  const date = new Date().toISOString().slice(0, 10);
  const prefix = `${name}.${date}.`;
  let part = 0;
  if (active?.date === date) {
    part = active.part;
  } else {
    try {
      for (const existing of readdirSync(directory)) {
        if (!existing.startsWith(prefix) || !existing.endsWith(extension))
          continue;
        const suffix = existing.slice(prefix.length, -extension.length);
        const index = Number(suffix);
        const validPart =
          extension === '.jsonl'
            ? journalPart.test(suffix)
            : /^\d+$/.test(suffix);
        if (validPart && Number.isSafeInteger(index))
          part = Math.max(part, index);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  for (;;) {
    const filename = path.join(
      directory,
      `${prefix}${String(part).padStart(6, '0')}${extension}`,
    );
    const stats =
      extension === '.jsonl'
        ? lstatSync(filename, { throwIfNoEntry: false })
        : statSync(filename, { throwIfNoEntry: false });
    if (extension === '.jsonl' && stats && !stats.isFile())
      throw new Error('Log destination must be a regular file');
    // A record larger than the limit gets its own segment.
    if (
      !stats?.size ||
      (stats.size < maxBytes && stats.size + bytes <= maxBytes)
    )
      return { date, part, filename };
    if (part === Number.MAX_SAFE_INTEGER)
      throw new Error('Log segment number exhausted');
    part++;
  }
}

const cleanupInterval = 60_000;
const bytesPerMB = 1024 * 1024;
const journalPart = /^(?:\d{6}|[1-9]\d{6,})$/;

export interface JsonLinesLogOptions {
  /** Existing canonical directory for a single writer process. */
  directory: string;
  name: string;
  maxFileSizeMB: number;
  retentionDays: number;
  onCleanupError?: (error: unknown) => void;
}

export interface JsonLinesLogOutput {
  /** Append one serialized record with its trailing newline. Throws on I/O failure. */
  writeLine(line: string): void;
  /** Await scheduled retention work and release this output. */
  close(): Promise<void>;
}

interface JsonLinesTarget {
  references: number;
  retentionDays: number;
  maxFileSizeMB: number;
  active?: LogSegment;
  lastCleanup?: number;
  cleanup?: Promise<void>;
  cleanupRequested: boolean;
}

const jsonLinesTargets = new Map<string, JsonLinesTarget>();

/** Use the rolling journal with caller-serialized records and target-scoped retention. */
export function createJsonLinesLogOutput(
  options: JsonLinesLogOptions,
): JsonLinesLogOutput {
  const { name, directory } = options;
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid log file name');
  validateJournalPolicy({
    retentionDays: options.retentionDays,
    maxSizeMB: options.maxFileSizeMB,
  });
  const key = path.join(directory, name);
  const state = jsonLinesTargets.get(key) ?? {
    references: 0,
    retentionDays: options.retentionDays,
    maxFileSizeMB: options.maxFileSizeMB,
    cleanupRequested: false,
  };
  // Share segment selection and honor the longest retention and smallest size limit
  // registered for the target until the last writer closes.
  state.references++;
  state.retentionDays = Math.max(state.retentionDays, options.retentionDays);
  state.maxFileSizeMB = Math.min(state.maxFileSizeMB, options.maxFileSizeMB);
  jsonLinesTargets.set(key, state);
  const archive = new RegExp(
    `^${name}\\.(\\d{4}-\\d{2}-\\d{2})\\.(\\d+)\\.jsonl$`,
  );
  const scope = {
    matches(filename: string) {
      const match = archive.exec(filename);
      if (
        !match ||
        !journalPart.test(match[2]) ||
        !Number.isSafeInteger(Number(match[2]))
      )
        return false;
      const date = new Date(match[1]);
      return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().startsWith(match[1])
      );
    },
    isActive(filename: string) {
      return (
        !!state.active && path.basename(state.active.filename) === filename
      );
    },
  };
  let closing: Promise<void> | undefined;
  return {
    writeLine(line) {
      if (closing) throw new Error('Log output is closed');
      if (
        line.length < 2 ||
        !line.endsWith('\n') ||
        /[\r\n]/.test(line.slice(0, -1))
      )
        throw new Error('Log output requires one complete line');
      assertJournalDirectory(directory);
      const segment = selectLogSegment(
        directory,
        name,
        '.jsonl',
        state.maxFileSizeMB * bytesPerMB,
        Buffer.byteLength(line),
        state.active,
      );
      appendPrivateJournalLine(segment.filename, line);
      const rotated = state.active?.filename !== segment.filename;
      state.active = segment;
      const now = Date.now();
      if (!rotated && now - (state.lastCleanup ?? -Infinity) < cleanupInterval)
        return;
      state.lastCleanup = now;
      state.cleanupRequested = true;
      state.cleanup ??= Promise.resolve()
        .then(async () => {
          do {
            state.cleanupRequested = false;
            try {
              await pruneJournals(directory, state, undefined, {
                scope,
                retentionOnly: true,
              });
            } catch (error) {
              if (options.onCleanupError) options.onCleanupError(error);
              else reportLoggingFailure('Log cleanup failed', error);
            }
          } while (state.cleanupRequested);
        })
        .catch((error: unknown) =>
          reportLoggingFailure('Log cleanup reporting failed', error),
        )
        .finally(() => {
          state.cleanup = undefined;
        });
    },
    close() {
      return (closing ??= (state.cleanup ?? Promise.resolve()).then(() => {
        if (--state.references === 0) jsonLinesTargets.delete(key);
      }));
    },
  };
}

interface DirectoryWriter {
  references: number;
  cleanup: Promise<void>;
  lastCleanup: number;
  lastFile?: string;
  files: Map<string, LogSegment>;
}
const directories = new Map<string, DirectoryWriter>();
/** Shared across named loggers and hosted lifecycle writers in the same process. */
export function createLogOutput(
  options: LogOutputOptions,
): Writable & { writeEntry(entry: JournalEntry): void } {
  const file = normalizeFileOptions(options.file);
  const consoleStream =
    options.console?.stream === 'stderr' ? process.stderr : process.stdout;
  const color =
    options.console?.pretty === true &&
    resolveConsoleColor(options.console.color, consoleStream);
  const directory =
    file.enabled !== false && file.directory
      ? path.resolve(file.directory)
      : undefined;
  let manager: DirectoryWriter | undefined;
  if (directory) {
    manager = directories.get(directory) ?? {
      references: 0,
      cleanup: Promise.resolve(),
      lastCleanup: 0,
      files: new Map(),
    };
    manager.references++;
    directories.set(directory, manager);
  }
  let filename: string | undefined;
  const writeEntry = (entry: JournalEntry) => {
    try {
      let line: string | undefined;
      if (directory && manager) {
        try {
          const owner = manager;
          let rotated = false;
          appendJournal((serialized) => {
            line = serialized;
            const name = file.name!;
            const bytes = Buffer.byteLength(serialized);
            const segment = selectLogSegment(
              directory,
              name,
              '.log',
              file.maxFileSizeMB! * bytesPerMB,
              bytes,
              owner.files.get(name),
            );
            rotated = filename !== segment.filename;
            filename = segment.filename;
            owner.files.set(name, segment);
            owner.lastFile = path.basename(filename);
            return {
              file: filename,
              maxSizeMB: Math.max(
                file.maxFileSizeMB!,
                bytes / bytesPerMB + 0.001,
              ),
            };
          }, entry);
          if (rotated || Date.now() - manager.lastCleanup > cleanupInterval) {
            manager.lastCleanup = Date.now();
            const owner = manager;
            manager.cleanup = manager.cleanup
              .then(() =>
                pruneJournals(
                  directory,
                  {
                    retentionDays: file.retentionDays,
                    maxSizeMB: file.maxTotalSizeMB,
                  },
                  owner.lastFile,
                  { retentionOnly: file.retentionOnly },
                ),
              )
              .catch((error: unknown) =>
                reportLoggingFailure('Log cleanup failed', error),
              );
          }
        } catch (error) {
          reportLoggingFailure('Log file output failed', error);
        }
      }
      if (options.console?.enabled) {
        line ??= serializeJournalEntry(entry);
        consoleStream.write(
          options.console.pretty
            ? prettyEntry(JSON.parse(line) as JournalEntry, color)
            : line,
        );
      }
    } catch (error) {
      reportLoggingFailure('Log output failed', error);
    }
  };
  return Object.assign(
    new Writable({
      write(chunk: Buffer, _encoding, done) {
        try {
          writeEntry(JSON.parse(chunk.toString('utf8')) as JournalEntry);
        } catch (error) {
          reportLoggingFailure('Log output failed', error);
        }
        done();
      },
      final(done) {
        const pending = manager?.cleanup ?? Promise.resolve();
        void pending.finally(() => {
          if (manager && --manager.references === 0 && directory)
            directories.delete(directory);
          done();
        });
      },
    }),
    { writeEntry },
  );
}
