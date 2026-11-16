import { Args, Flags, type Command } from '@oclif/core';
import { createReadStream } from 'node:fs';
import { mkdtemp, open, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Parser, type ReadEntry } from 'tar';
import { boundedLogLines, sanitizeLog } from '@nocobase/logging';
import { AppCommand, UsageError } from './lib/command.ts';

const MAX_INPUT = 512 * 1024 * 1024;
const CHUNK_BYTES = 4 * 1024 * 1024;
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
export async function diagnosticsTimeline(
  options: TimelineOptions,
): Promise<TimelineResult> {
  if (options.level && !(options.level in LEVELS))
    throw new UsageError('Unknown minimum log level');
  const input = await stat(options.bundle);
  if (!input.isFile() || input.size > MAX_INPUT)
    throw new UsageError('Diagnostics archive exceeds 512 MiB');
  const temporary = await mkdtemp(
    path.join(
      path.dirname(path.resolve(options.out)),
      '.diagnostics-timeline-',
    ),
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
      for (const row of buffer.sort(compare))
        await handle.writeFile(JSON.stringify(row) + '\n');
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
    if (entry.type === 'Directory' || !/\.(?:log|jsonl)$/.test(entry.path)) {
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
        consuming = consume(entry);
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
      await output.writeFile(text);
      entries++;
      const next = await iterators[index].next();
      heads[index] = next.done ? undefined : (JSON.parse(next.value!) as Row);
    }
    return { file: path.resolve(options.out), entries, omitted };
  } catch (error) {
    if (createdOutput) await rm(options.out, { force: true });
    throw error;
  } finally {
    await output?.close();
    await Promise.allSettled(iterators.map((iterator) => iterator.return(undefined)));
    await rm(temporary, { recursive: true, force: true });
  }
}

export function diagnosticsCommands(): Readonly<Record<string, Command.Class>> {
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
    async run(): Promise<TimelineResult> {
      const { args, flags } = await this.parse(Timeline);
      const result = await diagnosticsTimeline({
        bundle: args.bundle,
        out: flags.out ?? `${args.bundle}.timeline.jsonl`,
        level: flags.level,
        requestId: flags['request-id'],
      });
      this.log(
        `Wrote ${result.entries} entries to ${result.file}; omitted ${result.omitted} invalid records.`,
      );
      return result;
    }
  }
  return { 'diagnostics:timeline': Timeline };
}
