// The run's event stream: numbered, appended to an on-disk spool before anything is sent, and sent in batches of at
// most 200 every 500 ms. A failed send keeps the events and retries with backoff; nothing is dropped. The spool
// survives the worker, so orphan recovery can replay what a killed worker had not delivered. The server treats
// `(runId, seq)` as idempotent, so sending a batch twice is harmless.
//
//   <runsDir>/<runId>.events.ndjson   one RunEvent per line
//   <runsDir>/<runId>.events.ack      the highest seq the server acknowledged
//
// A job's log uses the same spool (`id` is then the job's record name, and `route` its events endpoint), with
// `JobEvent`s.
//
// With a `redactor`, every event is redacted as it is pushed, before it is written to the spool: its content, output,
// input and meta, so no secret reaches the disk or the server.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { safeName } from '../lib/home.ts';
import { backoff, delay, ApiError, type ApiClient } from '../lib/http.ts';
import {
  MAX_EVENT_CONTENT_BYTES,
  MAX_EVENTS_PER_BATCH,
  RUNNER_ROUTES,
  routePath,
  type Redactor,
  type RunEvent,
} from '../protocol/index.ts';

/** What the spool can carry: a run's events, or a job's. */
export interface SpooledEvent {
  readonly seq: number;
  readonly at: string;
  readonly type: string;
  readonly content?: string;
  readonly output?: string;
  readonly input?: unknown;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** An event before the spool numbers it; an adapter's own timestamp is kept. */
export type SpoolEvent<E extends SpooledEvent = RunEvent> = Omit<
  E,
  'seq' | 'at'
> & { at?: string };

export function spoolPaths(
  runsDir: string,
  runId: string,
): { spool: string; ack: string } {
  const base = path.join(runsDir, safeName(runId));
  return { spool: `${base}.events.ndjson`, ack: `${base}.events.ack` };
}

function truncate(value: string | undefined): {
  value: string | undefined;
  truncated: boolean;
} {
  if (value === undefined) return { value, truncated: false };
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= MAX_EVENT_CONTENT_BYTES)
    return { value, truncated: false };
  return {
    value: bytes.subarray(0, MAX_EVENT_CONTENT_BYTES).toString('utf8'),
    truncated: true,
  };
}

export interface EventSpoolOptions {
  runsDir: string;
  runId: string;
  /** Where events are sent; the run's events endpoint (`RUNNER_ROUTES.events`) by default. */
  route?: string;
  client: ApiClient;
  firstSeq: number;
  flushIntervalMs?: number;
  /** Redacts every event before it is spooled (see the top of this file). */
  redactor?: Redactor;
  /** A failure retrying will not fix, such as the run no longer being active. Sending stops. */
  onFatal?: (error: ApiError) => void;
  log?: (message: string) => void;
}

export class EventSpool<E extends SpooledEvent = RunEvent> {
  private readonly options: EventSpoolOptions;
  private readonly files: { spool: string; ack: string };
  private pending: E[] = [];
  private nextSeq: number;
  private timer: NodeJS.Timeout | undefined;
  private flushing: Promise<void> | undefined;
  private failures = 0;
  private retryAt = 0;
  private fatal: ApiError | undefined;
  private latestText: string | undefined;

  private constructor(
    options: EventSpoolOptions,
    pending: E[],
    nextSeq: number,
  ) {
    this.options = options;
    this.files = spoolPaths(options.runsDir, options.runId);
    this.pending = pending;
    this.nextSeq = nextSeq;
  }

  /** Opens the run's spool, picking up events an earlier process wrote and the server has not acknowledged. */
  static open<E extends SpooledEvent = RunEvent>(
    options: EventSpoolOptions,
  ): EventSpool<E> {
    const files = spoolPaths(options.runsDir, options.runId);
    mkdirSync(options.runsDir, { recursive: true, mode: 0o700 });
    const acked = existsSync(files.ack)
      ? Number(readFileSync(files.ack, 'utf8').trim()) || 0
      : 0;
    const pending: E[] = [];
    let last = options.firstSeq - 1;
    if (existsSync(files.spool)) {
      for (const line of readFileSync(files.spool, 'utf8').split('\n')) {
        if (line.trim() === '') continue;
        let event: E;
        try {
          event = JSON.parse(line) as E;
        } catch {
          // A line cut short by a crash mid-write; everything before it is intact.
          continue;
        }
        last = Math.max(last, event.seq);
        if (event.seq > acked) pending.push(event);
      }
    }
    return new EventSpool<E>(
      options,
      pending,
      Math.max(last + 1, options.firstSeq),
    );
  }

  get size(): number {
    return this.pending.length;
  }

  /** The content of the last text event pushed by this process. */
  get lastText(): string | undefined {
    return this.latestText;
  }

  get failure(): ApiError | undefined {
    return this.fatal;
  }

  /** Numbers the event, writes it to the spool, and queues it for sending. */
  push(original: SpoolEvent<E>): E {
    const event = this.redact(original);
    const content = truncate(event.content);
    const output = truncate(event.output);
    const truncated = content.truncated || output.truncated;
    const numbered = {
      ...event,
      seq: this.nextSeq,
      at: event.at ?? new Date().toISOString(),
      ...(content.value === undefined ? {} : { content: content.value }),
      ...(output.value === undefined ? {} : { output: output.value }),
      ...(truncated ? { meta: { ...event.meta, truncated: true } } : {}),
    } as unknown as E;
    this.nextSeq += 1;
    if (numbered.type === 'text' && numbered.content !== undefined)
      this.latestText = numbered.content;
    appendFileSync(this.files.spool, `${JSON.stringify(numbered)}\n`, {
      mode: 0o600,
    });
    this.pending.push(numbered);
    return numbered;
  }

  private redact(event: SpoolEvent<E>): SpoolEvent<E> {
    const redactor = this.options.redactor;
    if (redactor === undefined) return event;
    return {
      ...event,
      ...(event.content === undefined
        ? {}
        : { content: redactor.text(event.content) }),
      ...(event.output === undefined
        ? {}
        : { output: redactor.text(event.output) }),
      ...(event.input === undefined
        ? {}
        : { input: redactor.value(event.input) }),
      ...(event.meta === undefined ? {} : { meta: redactor.value(event.meta) }),
    };
  }

  start(): void {
    if (this.timer !== undefined) return;
    this.timer = setInterval(() => {
      void this.flush();
    }, this.options.flushIntervalMs ?? 500);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Sends what is pending, one batch after another, until the spool is empty or a send fails. */
  flush(): Promise<void> {
    this.flushing ??= this.sendPending().finally(() => {
      this.flushing = undefined;
    });
    return this.flushing;
  }

  private async sendPending(): Promise<void> {
    while (this.pending.length > 0 && this.fatal === undefined) {
      if (Date.now() < this.retryAt) return;
      const batch = this.pending.slice(0, MAX_EVENTS_PER_BATCH);
      try {
        await this.options.client.request(
          'POST',
          this.options.route ??
            routePath(RUNNER_ROUTES.events, { runId: this.options.runId }),
          { events: batch },
        );
      } catch (error) {
        if (error instanceof ApiError && !error.transient) {
          this.fatal = error;
          this.options.log?.(
            `events: giving up on run ${this.options.runId}: ${error.reason}`,
          );
          this.options.onFatal?.(error);
          return;
        }
        this.failures += 1;
        this.retryAt = Date.now() + backoff(this.failures, 250, 10_000);
        this.options.log?.(
          `events: send failed (${error instanceof Error ? error.message : String(error)}); ${this.pending.length} kept`,
        );
        return;
      }
      this.failures = 0;
      this.retryAt = 0;
      const last = batch[batch.length - 1];
      this.pending = this.pending.slice(batch.length);
      if (last !== undefined)
        await writeFile(this.files.ack, String(last.seq), { mode: 0o600 });
    }
  }

  /** Flushes until the spool is empty, a fatal failure, or the deadline. True when everything was delivered. */
  async drain(timeoutMs: number, signal?: AbortSignal): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (
      this.pending.length > 0 &&
      this.fatal === undefined &&
      Date.now() < deadline
    ) {
      if (signal?.aborted === true) break;
      await this.flush();
      if (this.pending.length === 0) break;
      await delay(
        Math.max(
          50,
          Math.min(this.retryAt - Date.now(), deadline - Date.now(), 1000),
        ),
        signal,
      );
    }
    return this.pending.length === 0;
  }

  /** Deletes the spool. Only once everything was delivered, or the run is over and nothing can be. */
  async remove(): Promise<void> {
    this.stop();
    await rm(this.files.spool, { force: true });
    await rm(this.files.ack, { force: true });
  }
}
