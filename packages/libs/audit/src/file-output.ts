import { once } from 'node:events';
import {
  closeSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  type Stats,
} from 'node:fs';
import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Writable } from 'node:stream';

import { createStream } from 'rotating-file-stream';

const dayMs = 86_400_000;
const maxSegment = 999_999;

type Report = (message: string) => void;

interface Segment {
  readonly file: string;
  size: number;
}

interface OutputStream {
  readonly stream: Writable;
  readonly closed: Promise<void>;
  readonly limit: number;
  active?: Segment;
  opening?: string;
  write?: { segment?: Segment };
  error?: Error;
}

function utcDate(time: Date): string {
  return time.toISOString().slice(0, 10);
}

function isPrivateFile(info: Stats): boolean {
  return (
    info.isFile() &&
    info.nlink === 1 &&
    (process.platform === 'win32' || (info.mode & 0o077) === 0)
  );
}

function assertPrivateFile(info: Stats): void {
  if (!isPrivateFile(info))
    throw new Error('Audit destination must be a private regular file.');
}

function endsWithNewline(file: string, size: number): boolean {
  if (size === 0) return true;
  const handle = openSync(file, 'r');
  try {
    const last = Buffer.alloc(1);
    if (readSync(handle, last, 0, 1, size - 1) !== 1)
      throw new Error('Could not read the audit file tail.');
    return last[0] === 10;
  } finally {
    closeSync(handle);
  }
}

export class FileAuditOutput {
  private readonly reports = new Set<Report>();
  private readonly pattern: RegExp;
  private retentionDays = 0;
  private limit = Number.MAX_SAFE_INTEGER;
  private output?: OutputStream;
  private pending: Promise<unknown> = Promise.resolve();
  private cleanup?: Promise<void>;

  constructor(
    private readonly directory: string,
    private readonly name: string,
  ) {
    this.pattern = new RegExp(
      `^${name}\\.(\\d{4}-\\d{2}-\\d{2})\\.(\\d{6})\\.jsonl$`,
    );
  }

  attach(report: Report, maxFileSizeMB: number, retentionDays: number): void {
    this.reports.add(report);
    this.retentionDays = Math.max(this.retentionDays, retentionDays);
    this.limit = Math.min(
      this.limit,
      Math.max(1, Math.floor(maxFileSizeMB * 1024 ** 2)),
    );
  }

  start(): void {
    this.output ??= this.openStream();
  }

  write(line: Buffer, signal: AbortSignal): Promise<void> {
    // Admit one record at a time. The coordinator bounds the waiting writes
    // and aborts them at the deadline before they can enter the stream.
    return this.run(async () => {
      signal.throwIfAborted();
      if (
        this.output &&
        (this.output.stream.destroyed || this.output.limit !== this.limit)
      )
        await this.stopStream();
      signal.throwIfAborted();
      this.start();
      const output = this.output!;
      const write: NonNullable<OutputStream['write']> = {};
      output.write = write;
      try {
        // During idle rotation the library can queue a write before the next
        // open event. Wait for our file checks before submitting any bytes.
        if (!output.active) await once(output.stream, 'open', { signal });
        const segment = output.active;
        if (!segment)
          throw output.error ?? new Error('Audit segment is not open.');
        signal.throwIfAborted();
        write.segment = segment;
        await new Promise<void>((resolve, reject) => {
          output.stream.write(line, (error) =>
            error ? reject(error) : resolve(),
          );
        });
        if (output.error) throw output.error;
        // The pinned stream ignores FileHandle.write's byte count. Detect a
        // short append before allowing another record into that segment.
        if ((await lstat(segment.file)).size !== segment.size + line.length)
          throw new Error('Audit record was not written in full.');
        segment.size += line.length;
      } catch (error) {
        output.stream.destroy();
        await output.closed;
        throw error;
      } finally {
        output.write = undefined;
      }
    });
  }

  detach(report: Report, onLastClose: () => void): Promise<void> {
    return this.run(async () => {
      if (this.reports.size > 1) {
        this.reports.delete(report);
        return;
      }
      try {
        await this.stopStream();
        await this.cleanup;
      } finally {
        this.reports.delete(report);
        if (this.reports.size === 0) onLastClose();
      }
    });
  }

  private run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.catch(() => undefined);
    return result;
  }

  private async stopStream(): Promise<void> {
    const output = this.output;
    if (!output) return;
    output.stream.end();
    await output.closed;
    this.output = undefined;
  }

  private report(message: string): void {
    for (const report of this.reports) report(message);
  }

  private openStream(): OutputStream {
    let day: string | undefined;
    let offset = 0;
    let lastOpened: number | undefined;
    let number = 0;
    const limit = this.limit;
    let probed = false;
    const stream = createStream(
      (args) => {
        if (!args) return `${this.name}.jsonl`;
        const date = utcDate(args.time);
        // createStream probes distinct names before it schedules the open.
        if (!probed) return `${this.name}.${date}.${args.index}.jsonl`;
        if (realpathSync.native(this.directory) !== this.directory)
          throw new Error('Audit directory must remain at its resolved path.');
        if (date !== day) {
          offset = this.firstSegment(date, lastOpened === undefined);
          day = date;
        } else if (args.index === 1 && lastOpened !== undefined) {
          offset = lastOpened + 1;
        }
        number = offset + args.index - 1;
        if (number > maxSegment)
          throw new Error('Audit segment sequence is exhausted for this date.');
        const file = `${this.name}.${date}.${String(number).padStart(6, '0')}.jsonl`;
        output.opening = path.join(this.directory, file);
        return file;
      },
      {
        path: this.directory,
        mode: 0o600,
        size: `${limit}B`,
        immutable: true,
        interval: '1d',
        intervalBoundary: true,
        intervalUTC: true,
      },
    );
    // Read standard events through Node's Writable types. The library's
    // event overloads omit close and error with this workspace's Node types.
    const writable: Writable = stream;
    const closed = new Promise<void>((resolve) =>
      writable.once('close', resolve),
    );
    const output: OutputStream = { stream: writable, closed, limit };
    probed = true;

    stream.on('rotation', () => {
      output.active = undefined;
    });
    stream.on('open', (file) => {
      try {
        const info = lstatSync(file);
        assertPrivateFile(info);
        // Immutable rotation opens with a zero size counter. Only the initial
        // open can resume a populated segment.
        if (lastOpened !== undefined && info.size > 0)
          throw new Error('Audit rotation selected a populated segment.');
        const segment = { file, size: info.size };
        output.active = segment;
        output.opening = undefined;
        lastOpened = number;
        this.scheduleCleanup();
      } catch (error) {
        // Initial open is emitted outside the library's rejection handler.
        // Destroy through Writable so the handle closes and writes settle.
        output.error =
          error instanceof Error ? error : new Error(String(error));
        stream.destroy(output.error);
      }
    });
    writable.on('error', (error) => {
      output.error = error;
      if (!output.write) this.report('Could not open or rotate audit files.');
    });
    stream.on('warning', () =>
      this.report('Audit file stream reported a warning.'),
    );
    return output;
  }

  private firstSegment(date: string, resume: boolean): number {
    let highest = -1;
    for (const name of readdirSync(this.directory)) {
      const match = this.pattern.exec(name);
      if (match?.[1] === date) highest = Math.max(highest, Number(match[2]));
    }
    if (highest < 0 || !resume) return highest + 1;

    const file = path.join(
      this.directory,
      `${this.name}.${date}.${String(highest).padStart(6, '0')}.jsonl`,
    );
    const info = lstatSync(file);
    assertPrivateFile(info);
    if (endsWithNewline(file, info.size)) return highest;
    this.report('Audit file ends with an incomplete line.');
    return highest + 1;
  }

  private scheduleCleanup(): void {
    this.cleanup ??= this.pruneArchives()
      .catch(() => this.report('Could not clean up audit files.'))
      .finally(() => {
        this.cleanup = undefined;
      });
  }

  private async pruneArchives(): Promise<void> {
    const files = await readdir(this.directory);
    for (const name of files) {
      const match = this.pattern.exec(name);
      if (!match) continue;
      const date = match[1];
      const parsed = new Date(date);
      if (!Number.isFinite(parsed.getTime()) || utcDate(parsed) !== date)
        continue;
      if (date === utcDate(new Date())) continue;
      const file = path.join(this.directory, name);
      try {
        const info = await lstat(file);
        if (
          isPrivateFile(info) &&
          Date.now() - info.mtimeMs > this.retentionDays * dayMs &&
          date !== utcDate(new Date()) &&
          file !== this.output?.opening &&
          file !== this.output?.active?.file &&
          file !== this.output?.write?.segment?.file
        )
          // Unlink in the same turn as the final active-file check.
          unlinkSync(file);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !('code' in error) ||
          error.code !== 'ENOENT'
        )
          this.report('Could not clean up audit files.');
      }
    }
  }
}
