/**
 * Small plumbing shared by the OpenCode adapter's modules: an async event
 * queue, event text caps and the policy decision shape.
 */
import { MAX_EVENT_TEXT_BYTES } from '../types.ts';
import type { PermissionDecision } from '../types.ts';

/** An unbounded async queue that one consumer iterates. */
export class Channel<T> implements AsyncIterable<T> {
  private items: T[] = [];
  private waiters: ((r: IteratorResult<T>) => void)[] = [];
  private closed = false;

  push(item: T): boolean {
    if (this.closed) return false;
    const waiter = this.waiters.shift();
    if (waiter) waiter({ value: item, done: false });
    else this.items.push(item);
    return true;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const waiter of this.waiters.splice(0))
      waiter({ value: undefined, done: true });
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        if (this.items.length > 0)
          return Promise.resolve({ value: this.items.shift()!, done: false });
        if (this.closed)
          return Promise.resolve({ value: undefined, done: true });
        return new Promise((resolve) => this.waiters.push(resolve));
      },
      return: () => {
        this.close();
        return Promise.resolve({ value: undefined, done: true });
      },
    };
  }
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms).unref());
}

export function capText(text: string): { text: string; truncated: boolean } {
  if (Buffer.byteLength(text, 'utf8') <= MAX_EVENT_TEXT_BYTES)
    return { text, truncated: false };
  return {
    text: Buffer.from(text, 'utf8')
      .subarray(0, MAX_EVENT_TEXT_BYTES)
      .toString('utf8'),
    truncated: true,
  };
}

export function capInput(input: unknown): {
  input: unknown;
  truncated: boolean;
} {
  let json: string;
  try {
    json = JSON.stringify(input) ?? '';
  } catch {
    return { input: String(input), truncated: false };
  }
  if (Buffer.byteLength(json, 'utf8') <= MAX_EVENT_TEXT_BYTES)
    return { input, truncated: false };
  return { input: { preview: capText(json).text }, truncated: true };
}

export interface Decision {
  allow: boolean;
  reason?: string;
}

export function normalizeDecision(decision: PermissionDecision): Decision {
  if (decision === 'allow') return { allow: true };
  if (decision === 'deny')
    return { allow: false, reason: 'Denied by the runner policy' };
  return { allow: false, reason: decision.deny };
}

/** What the model reads when the policy denies a tool call. */
export function denialMessage(reason: string | undefined): string {
  return `The runner policy denied this tool call${reason ? `: ${reason}` : ''}. This decision is final and nobody can grant it during this run, so do not ask for permission. Continue the task without this call, or use an allowed alternative.`;
}

export function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error === undefined || error === null) return '';
  try {
    return JSON.stringify(error);
  } catch {
    return Object.prototype.toString.call(error);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
