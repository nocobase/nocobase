// Runs a job's command in its own process group, streaming its output to the job's log in chunks (a build can print
// tens of thousands of lines; each event carries up to 16 KiB of whole lines, sent at least every 250 ms), and stops
// the whole group when the job is aborted: SIGTERM, then SIGKILL after a grace period.
import { spawn } from 'node:child_process';

import { killGroup } from '../supervisor.ts';
import type { JobStream } from './types.ts';

const CHUNK_BYTES = 16 * 1024;
const FLUSH_MS = 250;

/**
 * Collects a stream's text and hands it on in whole lines, at most `CHUNK_BYTES` at a time. `partial` marks a piece that
 * ends inside a line (a line longer than a chunk, or one still being written after a whole interval), whose rest comes
 * in the next piece; the job worker's redactor holds its unfinished end back until then.
 */
export class LineChunker {
  private buffer = '';
  private timer: NodeJS.Timeout | undefined;
  private readonly emit: (text: string, partial: boolean) => void;

  constructor(emit: (text: string, partial: boolean) => void) {
    this.emit = emit;
  }

  write(text: string): void {
    this.buffer += text;
    while (Buffer.byteLength(this.buffer) >= CHUNK_BYTES) {
      const cut = this.buffer.lastIndexOf('\n', CHUNK_BYTES);
      const at = cut > 0 ? cut + 1 : CHUNK_BYTES;
      this.send(this.buffer.slice(0, at));
      this.buffer = this.buffer.slice(at);
    }
    if (this.buffer !== '' && this.timer === undefined) {
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.flush(false);
      }, FLUSH_MS);
      this.timer.unref();
    }
  }

  /** Sends what is buffered: whole lines, or everything when `all` (the stream ended). */
  flush(all = true): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    const cut = all ? this.buffer.length : this.buffer.lastIndexOf('\n') + 1;
    // A line still being written waits for its end, unless it has waited a whole interval already.
    const at = cut > 0 ? cut : this.buffer.length;
    if (at === 0) return;
    this.send(this.buffer.slice(0, at), all);
    this.buffer = this.buffer.slice(at);
  }

  private send(text: string, ended = false): void {
    const complete = text.endsWith('\n');
    const trimmed = complete ? text.slice(0, -1) : text;
    if (trimmed !== '') this.emit(trimmed, !complete && !ended);
  }
}

export interface CommandOptions {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Record<string, string>;
  readonly signal: AbortSignal;
  /** `partial`: the text ends inside a line that continues in the next call. */
  readonly log: (stream: JobStream, text: string, partial?: boolean) => void;
  /** Told the process group once it exists, and `undefined` once it is gone. */
  readonly onGroup?: (pgid: number | undefined) => void;
  /** SIGTERM to SIGKILL. */
  readonly killGraceMs?: number;
  /** Written to the command's standard input, which is then closed; without it the command has no input. */
  readonly stdin?: string;
}

export interface CommandOutcome {
  /** The exit code; null when a signal ended it. */
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  /** The command was stopped because `signal` aborted. */
  readonly aborted: boolean;
  /** The last lines it wrote to stderr, for a failure's detail. */
  readonly stderrTail: string;
}

export function runCommand(options: CommandOptions): Promise<CommandOutcome> {
  return new Promise((resolve, reject) => {
    if (options.signal.aborted) {
      resolve({ exitCode: null, signal: null, aborted: true, stderrTail: '' });
      return;
    }
    const child = spawn(options.command, [...options.args], {
      cwd: options.cwd,
      env: options.env,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // The command gets `stdin`, or no input at all; one that exits without reading it must not fail with EPIPE.
    child.stdin.on('error', () => undefined);
    child.stdin.end(options.stdin ?? '');
    let tail = '';
    const out = new LineChunker((text, partial) =>
      options.log('stdout', text, partial),
    );
    const err = new LineChunker((text, partial) => {
      tail = `${tail}\n${text}`.slice(-4000);
      options.log('stderr', text, partial);
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (text: string) => out.write(text));
    child.stderr.on('data', (text: string) => err.write(text));
    let aborted = false;
    const stop = (): void => {
      aborted = true;
      if (child.pid !== undefined)
        void killGroup(child.pid, options.killGraceMs ?? 5_000);
    };
    options.signal.addEventListener('abort', stop, { once: true });
    child.once('error', (error) => {
      options.signal.removeEventListener('abort', stop);
      options.onGroup?.(undefined);
      reject(error);
    });
    if (child.pid !== undefined) options.onGroup?.(child.pid);
    const closed = new Promise<void>((done) =>
      child.once('close', () => done()),
    );
    child.once('exit', (code, signal) => {
      options.signal.removeEventListener('abort', stop);
      // Whatever the command left running in its group goes with it; then its output ends.
      const pid = child.pid;
      void (pid === undefined ? Promise.resolve() : killGroup(pid, 0))
        .then(() =>
          Promise.race([
            closed,
            new Promise<void>((done) => setTimeout(done, 2_000).unref()),
          ]),
        )
        .finally(() => {
          out.flush();
          err.flush();
          options.onGroup?.(undefined);
          resolve({
            exitCode: code,
            signal,
            aborted,
            stderrTail: tail.trim(),
          });
        });
    });
  });
}
