import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createGzip } from 'node:zlib';
import { createLogLineSanitizer, sanitizeLog } from '@nocobase/logging';
import { diagnosticLines } from './diagnostic-lines.ts';
import {
  diagnosticsDates,
  DiagnosticsRequestSchema,
  DIAGNOSTICS_MAX_RECORD,
  RUNNER_ROUTES,
  routePath,
  type DiagnosticsRequest,
  type DiagnosticsFile,
} from '../protocol/index.ts';
import type { ApiClient } from '../lib/http.ts';
import type { RunnerPaths } from '../lib/home.ts';

const levels: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};
export interface DiagnosticsEnvironment {
  version: string;
  tools: readonly { tool: string; version?: string | null }[];
}
/** No configuration, credentials, workspace content, or arbitrary paths are ever read. */
export async function* diagnosticsRecords(
  paths: RunnerPaths,
  input: DiagnosticsRequest,
  environment: DiagnosticsEnvironment,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const request = DiagnosticsRequestSchema.parse(input);
  const dates = new Set(diagnosticsDates(request.window));
  const selected = new Set(request.window.runIds);
  const candidates: { file: string; date: string; selected: boolean }[] = [];
  const summaries: DiagnosticsFile[] = [];
  let truncated = false;
  const check = () => {
    signal?.throwIfAborted();
    if (Date.now() >= Date.parse(request.expiresAt))
      throw new Error('Diagnostics request expired');
  };
  async function names(directory: string): Promise<string[]> {
    try {
      if (!(await lstat(directory)).isDirectory()) return [];
      return (await readdir(directory)).sort();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }
  if (!(await lstat(paths.logsDir).catch(() => undefined))?.isDirectory()) {
    // Still return environment and an empty manifest when this runner has never written logs.
  } else {
    for (const name of await names(paths.logsDir)) {
      const match = /^runner\.(\d{4}-\d{2}-\d{2})\.\d+\.log$/.exec(name);
      if (match && dates.has(match[1]))
        candidates.push({ file: name, date: match[1], selected: false });
    }
    const runs = path.join(paths.logsDir, 'runs');
    for (const date of (await names(runs)).reverse()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      for (const name of await names(path.join(runs, date))) {
        const match = /^([a-zA-Z0-9_-]+)\.(?:log|stderr)$/.exec(name);
        if (!match || (!dates.has(date) && !selected.has(match[1]))) continue;
        const file = `runs/${date}/${name}`;
        // Empty crash sidecars are not sources; they may become useful on a later collection.
        if (
          name.endsWith('.stderr') &&
          !(await lstat(path.join(paths.logsDir, file))).size
        )
          continue;
        candidates.push({ file, date, selected: selected.has(match[1]) });
      }
    }
  }
  candidates.sort(
    (a, b) =>
      Number(b.selected) - Number(a.selected) ||
      b.date.localeCompare(a.date) ||
      b.file.localeCompare(a.file),
  );
  const chosen = candidates.filter((source) => source.selected);
  const ordinary = candidates.filter((source) => !source.selected);
  const files = [...chosen, ...ordinary.slice(0, 64)];
  if (ordinary.length > 64) truncated = true;
  const encode = (value: unknown) => JSON.stringify(sanitizeLog(value)) + '\n';
  const first = encode({
    type: 'environment',
    version: environment.version.slice(0, 100),
    os: os.platform(),
    release: os.release(),
    arch: os.arch(),
    node: process.version,
    tools: environment.tools.slice(0, 30).map((tool) => ({
      tool: tool.tool.slice(0, 50),
      version: tool.version?.slice(0, 100) ?? null,
    })),
  });
  let bytes = Buffer.byteLength(first);
  let scanned = 0;
  yield first;
  // Reserve space for the terminal manifest even when all input was truncated or filtered.
  const logBudget = Math.max(bytes, request.maxBytes - 48 * 1024);
  let manifestBytes = 128;
  let remainingSelected = chosen.length;
  for (const source of files) {
    check();
    const summary: DiagnosticsFile = {
      file: source.file,
      dates: [source.date],
      bytes: 0,
      truncated: false,
      omittedLines: 0,
    };
    // The terminal record's existing byte limit, rather than the ordinary-file count, bounds selected metadata.
    manifestBytes += Buffer.byteLength(JSON.stringify(summary)) + 32;
    if (manifestBytes > 48 * 1024) {
      truncated = true;
      break;
    }
    summaries.push(summary);
    let handle;
    try {
      // Recheck every parent without following symlinks, then open the file itself with O_NOFOLLOW.
      let parent = paths.logsDir;
      for (const segment of source.file.split('/').slice(0, -1)) {
        parent = path.join(parent, segment);
        if (!(await lstat(parent)).isDirectory())
          throw new Error('Unsafe log directory');
      }
      if (!(await lstat(path.join(paths.logsDir, source.file))).isFile()) {
        summary.truncated = truncated = true;
        continue;
      }
      handle = await open(
        path.join(paths.logsDir, source.file),
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size === 0) continue;
      const remaining = Math.max(
        0,
        Math.min(request.maxBytes - scanned, logBudget - bytes),
      );
      // Leave one maximum-size record per remaining selected source when possible, including its failure tail.
      const reserved = source.selected
        ? Math.min(
            remaining / Math.max(1, remainingSelected),
            DIAGNOSTICS_MAX_RECORD,
          ) * Math.max(0, remainingSelected - 1)
        : 0;
      const allowance = Math.max(0, Math.floor(remaining - reserved));
      if (source.selected) remainingSelected--;
      if (allowance <= 512) {
        summary.truncated = truncated = true;
        continue;
      }
      const length = Math.min(stat.size, allowance);
      scanned += length;
      const start = stat.size - length;
      const raw = source.file.endsWith('.stderr');
      const converter = (initialPrivate = false) => {
        const redact = createLogLineSanitizer();
        let privateKey = initialPrivate;
        if (initialPrivate) redact('-----BEGIN PRIVATE KEY-----');
        return (line: string) => {
          let entry: Record<string, unknown>;
          const wasPrivate = privateKey;
          const begins = raw && /-----BEGIN [^-]*PRIVATE KEY-----/.test(line);
          const ends = raw && /-----END [^-]*PRIVATE KEY-----/.test(line);
          if (begins) privateKey = true;
          if (ends) privateKey = false;
          const reset = ends && !wasPrivate && !begins;
          const rawText = raw ? redact(line) : '';
          if (raw)
            entry = {
              time: stat.mtime.toISOString(),
              level: 'error',
              msg: ends ? '[REDACTED]' : rawText,
              runId: path.basename(source.file, '.stderr'),
            };
          else {
            try {
              entry = JSON.parse(line) as Record<string, unknown>;
            } catch {
              return;
            }
          }
          if (
            !entry ||
            typeof entry.msg !== 'string' ||
            !['string', 'number'].includes(typeof entry.level) ||
            !['string', 'number'].includes(typeof entry.time)
          )
            return;
          const time =
            typeof entry.time === 'number'
              ? entry.time
              : Date.parse(String(entry.time));
          if (!Number.isFinite(time)) return;
          const severity =
            typeof entry.level === 'number'
              ? entry.level
              : (levels[String(entry.level)] ?? 0);
          if (
            !source.selected &&
            request.window.level &&
            severity < levels[request.window.level] &&
            !(
              entry.requestId &&
              Number(
                (entry.res as { status?: number })?.status ?? entry.status,
              ) >= 400
            )
          )
            return;
          const record = encode({ type: 'log', file: source.file, entry });
          return {
            record,
            size: Buffer.byteLength(record),
            privateKey: wasPrivate,
            reset,
          };
        };
      };
      // Keep only offsets and sizes, never log payloads. Re-read the chosen suffix once, in original order.
      let queue: { offset: number; size: number; privateKey: boolean }[] = [];
      let head = 0;
      let kept = 0;
      const convert = converter();
      for await (const line of diagnosticLines(handle, start, stat.size)) {
        check();
        if (line.text === null) {
          summary.omittedLines++;
          summary.truncated = true;
          continue;
        }
        const item = convert(line.text);
        if (!item) continue;
        if (item.reset) {
          summary.omittedLines += queue.length - head;
          queue = [];
          head = 0;
          kept = 0;
        }
        if (item.size > DIAGNOSTICS_MAX_RECORD || item.size > allowance - 512) {
          summary.omittedLines++;
          summary.truncated = true;
          continue;
        }
        queue.push({
          offset: line.offset,
          size: item.size,
          privateKey: item.privateKey,
        });
        kept += item.size;
        while (kept > allowance - 512) {
          kept -= queue[head++].size;
          summary.omittedLines++;
          summary.truncated = true;
        }
        if (head > 8192) {
          queue = queue.slice(head);
          head = 0;
        }
      }
      summary.truncated ||= start > 0;
      truncated ||= summary.truncated;
      if (summary.truncated) {
        const note = encode({
          type: 'log',
          file: source.file,
          entry: {
            time: stat.mtime.toISOString(),
            level: 'warn',
            msg: 'Earlier or oversized log content omitted; retained the available tail.',
            truncated: true,
          },
        });
        summary.bytes += Buffer.byteLength(note);
        bytes += Buffer.byteLength(note);
        yield note;
      }
      if (queue[head]) {
        const emit = converter(queue[head].privateKey);
        for await (const line of diagnosticLines(
          handle,
          queue[head].offset,
          stat.size,
        )) {
          check();
          if (line.text === null) continue;
          const item = emit(line.text);
          if (
            !item ||
            item.size > DIAGNOSTICS_MAX_RECORD ||
            item.size > allowance - 512 ||
            bytes + item.size > logBudget
          )
            continue;
          summary.bytes += item.size;
          bytes += item.size;
          yield item.record;
        }
      }
    } catch (error) {
      check();
      if (
        !['ENOENT', 'ELOOP'].includes(
          (error as NodeJS.ErrnoException).code ?? '',
        )
      )
        throw error;
      summary.truncated = truncated = true;
    } finally {
      await handle?.close();
    }
  }
  yield JSON.stringify({
    type: 'manifest',
    files: summaries.map((file) => sanitizeLog(file)),
    truncated,
  }) + '\n';
}

export async function uploadDiagnostics(
  client: ApiClient,
  paths: RunnerPaths,
  request: DiagnosticsRequest,
  environment: DiagnosticsEnvironment,
  signal?: AbortSignal,
): Promise<void> {
  const source = Readable.from(
    diagnosticsRecords(paths, request, environment, signal),
  );
  const compressed = source.pipe(createGzip());
  source.on('error', (error) => compressed.destroy(error));
  try {
    await client.upload(
      routePath(RUNNER_ROUTES.diagnostics, { requestId: request.requestId }),
      compressed,
      {
        signal,
        timeoutMs: Math.max(1, Date.parse(request.expiresAt) - Date.now()),
      },
    );
  } finally {
    source.destroy();
    compressed.destroy();
  }
}
