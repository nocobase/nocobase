import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createGzip } from 'node:zlib';
import { boundedLogLines, sanitizeLog } from '@nocobase/logging';
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
  const files: { file: string; date: string }[] = [];
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
        files.push({ file: name, date: match[1] });
    }
    const runs = path.join(paths.logsDir, 'runs');
    for (const date of await names(runs)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      for (const name of await names(path.join(runs, date))) {
        const match = /^([a-zA-Z0-9_-]+)\.log$/.exec(name);
        if (match && (dates.has(date) || selected.has(match[1])))
          files.push({ file: `runs/${date}/${name}`, date });
        if (files.length >= 256) break;
      }
      if (files.length >= 256) break;
    }
  }
  const encode = (value: unknown) => JSON.stringify(sanitizeLog(value)) + '\n';
  const first = encode({
    type: 'environment',
    version: environment.version.slice(0, 100),
    os: os.platform(),
    release: os.release(),
    arch: os.arch(),
    node: process.version,
    tools: environment.tools
      .slice(0, 30)
      .map((tool) => ({
        tool: tool.tool.slice(0, 50),
        version: tool.version?.slice(0, 100) ?? null,
      })),
  });
  let bytes = Buffer.byteLength(first);
  let scanned = 0;
  yield first;
  // Reserve space for the terminal manifest even when all input was truncated or filtered.
  const logBudget = Math.max(bytes, request.maxBytes - 48 * 1024);
  if (files.length > 64) truncated = true;
  for (const source of files.slice(0, 64)) {
    check();
    const summary: DiagnosticsFile = {
      file: source.file,
      dates: [source.date],
      bytes: 0,
      truncated: false,
      omittedLines: 0,
    };
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
      handle = await open(
        path.join(paths.logsDir, source.file),
        constants.O_RDONLY | constants.O_NOFOLLOW,
      );
      const stat = await handle.stat();
      if (!stat.isFile() || stat.size === 0) continue;
      const remaining = Math.max(0, request.maxBytes - scanned);
      if (!remaining || bytes >= logBudget) {
        summary.truncated = truncated = true;
        continue;
      }
      const length = Math.min(stat.size, remaining);
      scanned += length;
      const stream = handle.createReadStream({
        start: 0,
        end: length - 1,
        autoClose: false,
        highWaterMark: 32 * 1024,
      });
      for await (const line of boundedLogLines(
        stream,
        32 * 1024,
        length === stat.size,
      )) {
        check();
        if (line === null) {
          summary.omittedLines++;
          summary.truncated = truncated = true;
          continue;
        }
        let entry: Record<string, unknown>;
        try {
          entry = JSON.parse(line) as Record<string, unknown>;
        } catch {
          summary.omittedLines++;
          summary.truncated = truncated = true;
          continue;
        }
        if (
          !entry ||
          typeof entry.msg !== 'string' ||
          !['string', 'number'].includes(typeof entry.level) ||
          !['string', 'number'].includes(typeof entry.time)
        ) {
          summary.omittedLines++;
          summary.truncated = truncated = true;
          continue;
        }
        const severity =
          typeof entry.level === 'number'
            ? entry.level
            : (levels[String(entry.level)] ?? 0);
        if (
          request.window.level &&
          severity < levels[request.window.level] &&
          !(
            entry.requestId &&
            Number(
              (entry.res as { status?: number })?.status ?? entry.status,
            ) >= 400
          )
        )
          continue;
        const record = encode({ type: 'log', file: source.file, entry });
        const size = Buffer.byteLength(record);
        if (bytes + size > logBudget || size > DIAGNOSTICS_MAX_RECORD) {
          summary.truncated = truncated = true;
          break;
        }
        bytes += size;
        summary.bytes += size;
        yield record;
      }
      if (length < stat.size) summary.truncated = truncated = true;
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
  yield encode({ type: 'manifest', files: summaries, truncated });
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
