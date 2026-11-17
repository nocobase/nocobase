import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  currentSession,
  serverPath,
  urlFor,
  type Session,
} from './dynamic/session.ts';
import { download, send } from './dynamic/execute.ts';
import { Args, Flags, type Command } from '@oclif/core';
import { createReadStream } from 'node:fs';
import { mkdtemp, open, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Parser, ReadEntry } from 'tar';
import { AppCommand, UsageError } from './lib/command.ts';

const MAX_INPUT = 512 * 1024 * 1024;
const CHUNK_BYTES = 4 * 1024 * 1024;
const WRITE_BYTES = 64 * 1024;

/** Bound pending output and await disk writes before accepting another batch. */
function bufferedWriter(handle: Awaited<ReturnType<typeof open>>) {
  let pending: string[] = [];
  let bytes = 0;
  const flush = async () => {
    if (!bytes) return;
    await handle.writeFile(pending.join(''));
    pending = [];
    bytes = 0;
  };
  return {
    flush,
    async write(text: string) {
      pending.push(text);
      bytes += Buffer.byteLength(text);
      if (bytes >= WRITE_BYTES) await flush();
    },
  };
}
const LEVELS: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};
interface Row {
  time: string;
  source: string;
  [key: string]: unknown;
}
const compare = (a: Row, b: Row) =>
  a.time.localeCompare(b.time) || a.source.localeCompare(b.source);
export interface TimelineOptions {
  bundle: string;
  out: string;
  level?: string;
  requestId?: string;
}
export interface TimelineResult {
  file: string;
  entries: number;
  omitted: number;
}

/** External sort: bounded chunks on local disk, one bounded head per merge source. No server session is loaded. */
export async function logsTimeline(
  options: TimelineOptions,
): Promise<TimelineResult> {
  const { Parser } = await import('tar');
  const { boundedLogLines, sanitizeLog } = await import('@nocobase/logging');
  if (options.level && !(options.level in LEVELS))
    throw new UsageError('Unknown minimum log level');
  const input = await stat(options.bundle);
  if (!input.isFile() || input.size > MAX_INPUT)
    throw new UsageError('Diagnostics archive exceeds 512 MiB');
  const temporary = await mkdtemp(
    path.join(path.dirname(path.resolve(options.out)), '.logs-timeline-'),
  );
  const chunks: string[] = [];
  const iterators: AsyncGenerator<string | null>[] = [];
  let output: Awaited<ReturnType<typeof open>> | undefined;
  let buffer: Row[] = [];
  let bufferBytes = 0;
  let declared = 0;
  let entries = 0;
  let omitted = 0;
  let createdOutput = false;
  const flush = async () => {
    if (!buffer.length) return;
    if (chunks.length >= 256) throw new UsageError('Too many timeline chunks');
    const file = path.join(temporary, `${chunks.length}.jsonl`);
    const handle = await open(file, 'wx', 0o600);
    try {
      const writer = bufferedWriter(handle);
      for (const row of buffer.sort(compare))
        await writer.write(JSON.stringify(row) + '\n');
      await writer.flush();
    } finally {
      await handle.close();
    }
    chunks.push(file);
    buffer = [];
    bufferBytes = 0;
  };
  let parser: Parser;
  let consuming = Promise.resolve();
  const consume = async (entry: ReadEntry) => {
    // Entries are never extracted. Reject links, special files and unsafe names even for this read-only operation.
    if (
      !['File', 'OldFile', 'Directory'].includes(entry.type) ||
      entry.path.length > 240 ||
      entry.path.startsWith('/') ||
      entry.path.includes('\\') ||
      entry.path.split('/').includes('..')
    )
      throw new UsageError('Unsafe diagnostics archive entry');
    declared += entry.size;
    if (!Number.isSafeInteger(declared) || declared > MAX_INPUT)
      throw new UsageError('Expanded diagnostics archive exceeds 512 MiB');
    if (
      entry.type === 'Directory' ||
      !/\.(?:log|jsonl|stderr)$/.test(entry.path) ||
      /(?:^|\/)(?:run\.json|events\.jsonl)$/.test(entry.path)
    ) {
      entry.resume();
      return;
    }
    for await (const line of boundedLogLines(entry, 64 * 1024)) {
      if (line === null) {
        omitted++;
        continue;
      }
      let value: Record<string, unknown>;
      try {
        value = JSON.parse(line) as Record<string, unknown>;
      } catch {
        omitted++;
        continue;
      }
      if (
        !value ||
        typeof value !== 'object' ||
        !['string', 'number'].includes(typeof value.time)
      ) {
        omitted++;
        continue;
      }
      const time =
        typeof value.time === 'number'
          ? value.time
          : Date.parse(String(value.time));
      if (!Number.isFinite(time)) {
        omitted++;
        continue;
      }
      const severity =
        typeof value.level === 'number'
          ? value.level
          : (LEVELS[String(value.level)] ?? 0);
      if (options.level && severity < LEVELS[options.level]) continue;
      if (options.requestId && value.requestId !== options.requestId) continue;
      const row = {
        ...(sanitizeLog(value) as Record<string, unknown>),
        time: new Date(time).toISOString(),
        source: String(sanitizeLog(entry.path)),
      };
      buffer.push(row);
      bufferBytes += Buffer.byteLength(JSON.stringify(row)) + 1;
      if (bufferBytes >= CHUNK_BYTES) await flush();
    }
  };
  try {
    parser = new Parser({
      strict: true,
      maxMetaEntrySize: 64 * 1024,
      onReadEntry(entry) {
        consuming = consuming.then(() => consume(entry));
        void consuming.catch((error: unknown) =>
          parser.abort(
            error instanceof Error ? error : new Error(String(error)),
          ),
        );
      },
    });
    await pipeline(
      createReadStream(options.bundle, { highWaterMark: 32 * 1024 }),
      parser,
    );
    await consuming;
    await flush();
    output = await open(options.out, 'wx', 0o600);
    createdOutput = true;
    const writer = bufferedWriter(output);
    const heads: (Row | undefined)[] = [];
    for (const file of chunks) {
      const iterator = boundedLogLines(
        createReadStream(file, { highWaterMark: 32 * 1024 }),
        128 * 1024,
      );
      iterators.push(iterator);
      const next = await iterator.next();
      heads.push(next.done ? undefined : (JSON.parse(next.value!) as Row));
    }
    let written = 0;
    for (;;) {
      let index = -1;
      for (let i = 0; i < heads.length; i++)
        if (heads[i] && (index < 0 || compare(heads[i]!, heads[index]!) < 0))
          index = i;
      if (index < 0) break;
      const text = JSON.stringify(heads[index]) + '\n';
      written += Buffer.byteLength(text);
      if (written > MAX_INPUT)
        throw new UsageError('Timeline output exceeds 512 MiB');
      await writer.write(text);
      entries++;
      const next = await iterators[index].next();
      heads[index] = next.done ? undefined : (JSON.parse(next.value!) as Row);
    }
    await writer.flush();
    return { file: path.resolve(options.out), entries, omitted };
  } catch (error) {
    if (createdOutput) await rm(options.out, { force: true });
    throw error;
  } finally {
    await output?.close();
    await Promise.allSettled(
      iterators.map((iterator) => iterator.return(undefined)),
    );
    await rm(temporary, { recursive: true, force: true });
  }
}

export interface LogsExportSource {
  name: string;
  status:
    | 'complete'
    | 'truncated'
    | 'offline'
    | 'timeout'
    | 'unsupported'
    | 'failed'
    | 'capacity'
    | 'too_large';
  bytes?: number;
}
const SourceSchema: z.ZodType<LogsExportSource> = z.object({
  name: z.string().max(200),
  status: z.enum([
    'complete',
    'truncated',
    'offline',
    'timeout',
    'unsupported',
    'failed',
    'capacity',
    'too_large',
  ]),
  bytes: z.number().int().nonnegative().optional(),
});
const ManifestSchema = z.object({ sources: z.array(SourceSchema) });
export interface LogsExportOptions {
  days?: number;
  since?: string;
  until?: string;
  appLog?: boolean;
  requestLog?: boolean;
  runners?: string[];
  issues?: string[];
  level?: string;
  out: string;
}
export interface LogsExportResult {
  file: string;
  bytes: number;
  sources: LogsExportSource[];
}
/** Local calendar dates are converted to exclusive UTC instants, including DST transitions. */
export function logsExportInput(
  options: LogsExportOptions,
  now: Date = new Date(),
): Record<string, unknown> {
  if (options.days !== undefined && (options.since || options.until))
    throw new UsageError('Use --days or --since/--until, not both');
  if (Boolean(options.since) !== Boolean(options.until))
    throw new UsageError('--since and --until must be used together');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new UsageError('Dates must use YYYY-MM-DD');
    const [year, month, day] = value.split('-').map(Number);
    const result = new Date(year, month - 1, day);
    if (
      result.getFullYear() !== year ||
      result.getMonth() !== month - 1 ||
      result.getDate() !== day
    )
      throw new UsageError('Invalid calendar date');
    return result;
  };
  const days = options.days ?? 1;
  if (!Number.isSafeInteger(days) || days < 1)
    throw new UsageError('Select a positive whole number of days');
  const since = options.since
    ? date(options.since)
    : new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - days + 1,
      );
  const last = options.until ? date(options.until) : today;
  if (!Number.isFinite(since.getTime()) || !Number.isFinite(last.getTime()))
    throw new UsageError('Invalid calendar date range');
  if (last > today) throw new UsageError('Future dates cannot be exported');
  if (since > last)
    throw new UsageError('The first date must not follow the last date');
  const until = new Date(
    last.getFullYear(),
    last.getMonth(),
    last.getDate() + 1,
  );
  const selectedServerLogs = options.appLog || options.requestLog;
  return {
    exportId: randomUUID(),
    since: since.toISOString(),
    until: until.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    appLog: selectedServerLogs ? Boolean(options.appLog) : true,
    requestLog: selectedServerLogs ? Boolean(options.requestLog) : true,
    ...(options.runners === undefined ? {} : { runners: options.runners }),
    ...(options.issues === undefined ? {} : { issues: options.issues }),
    ...(options.level ? { level: options.level } : {}),
  };
}
/** Read only bounded manifest metadata, never extract the archive or buffer log entries. */
async function exportManifest(
  bundle: string,
): Promise<z.infer<typeof ManifestSchema>> {
  const { Parser } = await import('tar');
  let result: z.infer<typeof ManifestSchema> | undefined;
  let consuming = Promise.resolve();
  let expanded = 0;
  const parser = new Parser({
    strict: true,
    maxMetaEntrySize: 64 * 1024,
    onReadEntry(entry) {
      consuming = consuming.then(async () => {
        expanded += entry.size;
        if (
          expanded > MAX_INPUT ||
          !['File', 'OldFile', 'Directory'].includes(entry.type) ||
          entry.path.startsWith('/') ||
          entry.path.includes('\\') ||
          entry.path.split('/').includes('..')
        )
          throw new UsageError('Invalid logs archive');
        if (entry.path !== 'manifest.json') {
          entry.resume();
          return;
        }
        if (result || entry.size > 2 * 1024 * 1024)
          throw new UsageError('Invalid logs manifest');
        const chunks: Buffer[] = [];
        for await (const chunk of entry) chunks.push(Buffer.from(chunk));
        result = ManifestSchema.parse(
          JSON.parse(Buffer.concat(chunks).toString('utf8')),
        );
      });
      void consuming.catch((error) =>
        parser.abort(error instanceof Error ? error : new Error(String(error))),
      );
    },
  });
  await pipeline(createReadStream(bundle), parser);
  await consuming;
  if (!result) throw new UsageError('The export did not contain manifest.json');
  return result;
}
/** Use the authorized API document's logsExport operation, preserving the server's base path and credential scope. */
export async function logsExport(
  options: LogsExportOptions,
  session: Session,
  fetcher: typeof fetch = fetch,
): Promise<LogsExportResult> {
  const input = logsExportInput(options);
  const document = await send(
    urlFor(session.server, serverPath(session.server, '/api/swagger')),
    { headers: session.headers, redirect: 'error' },
    { fetch: fetcher },
  );
  const api = z
    .object({ paths: z.record(z.string(), z.record(z.string(), z.unknown())) })
    .parse(document);
  let route: string | undefined;
  for (const [name, methods] of Object.entries(api.paths)) {
    if (
      z.object({ operationId: z.string().optional() }).safeParse(methods.post)
        .data?.operationId === 'logsExport'
    )
      route = name;
  }
  if (
    !route ||
    !route.startsWith('/') ||
    route.startsWith('//') ||
    route.includes('?') ||
    route.includes('#')
  )
    throw new UsageError('This server does not support logs export');
  const base = new URL(session.server).pathname.replace(/\/$/, '');
  if (base && !route.startsWith(`${base}/`))
    route = serverPath(session.server, route);
  const saved = await download(
    urlFor(session.server, route),
    {
      method: 'POST',
      headers: {
        ...session.headers,
        'content-type': 'application/json',
        accept: 'application/gzip',
      },
      body: JSON.stringify(input),
      redirect: 'error',
    },
    options.out,
    { fetch: fetcher },
  );
  const manifest = await exportManifest(saved.data.path);
  return {
    file: saved.data.path,
    bytes: saved.data.size,
    sources: manifest.sources,
  };
}
const sizeText = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function logsCommands(): Readonly<Record<string, Command.Class>> {
  class Timeline extends AppCommand {
    static override summary =
      'Merge a diagnostics archive into a local JSONL timeline without connecting to a server.';
    static override args = {
      bundle: Args.string({
        required: true,
        description: 'The diagnostics tar.gz archive.',
      }),
    };
    static override flags = {
      out: Flags.string({
        description: 'Destination JSONL file (must not exist).',
      }),
      level: Flags.string({
        options: Object.keys(LEVELS),
        description: 'Minimum log level.',
      }),
      'request-id': Flags.string({
        description: 'Include only this request ID.',
      }),
    };
    async run(): Promise<{ data: TimelineResult }> {
      const { args, flags } = await this.parse(Timeline);
      const result = await logsTimeline({
        bundle: args.bundle,
        out: flags.out ?? `${args.bundle}.timeline.jsonl`,
        level: flags.level,
        requestId: flags['request-id'],
      });
      this.log(
        `Merged ${result.entries.toLocaleString('en-US')} records into ${result.file}`,
      );
      return { data: result };
    }
  }
  class Export extends AppCommand {
    static override summary =
      'Export Studio and runner logs to a local archive.';
    static override flags = {
      days: Flags.integer({
        description:
          'Include this many local calendar days; the server enforces retention.',
        min: 1,
      }),
      since: Flags.string({
        description: 'First local date (YYYY-MM-DD), inclusive.',
      }),
      until: Flags.string({
        description: 'Last local date (YYYY-MM-DD), inclusive.',
      }),
      'app-log': Flags.boolean({
        description: 'Include application logs (both server logs by default).',
      }),
      'request-log': Flags.boolean({
        description: 'Include request logs (both server logs by default).',
      }),
      runner: Flags.string({
        multiple: true,
        description: 'Include this runner name; repeat to select more.',
      }),
      issue: Flags.string({
        multiple: true,
        description:
          'Include only these issues’ run logs; repeat to select more.',
      }),
      level: Flags.string({
        options: Object.keys(LEVELS),
        description: 'Minimum log level.',
      }),
      out: Flags.string({
        required: true,
        description: 'Destination tar.gz file.',
      }),
    };
    async run(): Promise<{ data: LogsExportResult }> {
      const { flags } = await this.parse(Export);
      const options = {
        days: flags.days,
        since: flags.since,
        until: flags.until,
        appLog: flags['app-log'],
        requestLog: flags['request-log'],
        runners: flags.runner,
        issues: flags.issue,
        level: flags.level,
        out: flags.out,
      };
      logsExportInput(options);
      const session = await currentSession();
      if (!session)
        throw new UsageError(
          `Not signed in. Run \`${this.bin} login\` first.`,
          3,
        );
      const result = await logsExport(options, session);
      const width = Math.max(
        ...result.sources.map((source) => source.name.length),
        12,
      );
      for (const source of result.sources)
        this.log(
          `${source.name.padEnd(width)}  ${source.status.padEnd(11)}${source.bytes === undefined ? '' : sizeText(source.bytes).padStart(10)}`,
        );
      this.log(`Saved ${result.file} (${sizeText(result.bytes)})`);
      return { data: result };
    }
  }
  return { 'logs:timeline': Timeline, 'logs:export': Export };
}
