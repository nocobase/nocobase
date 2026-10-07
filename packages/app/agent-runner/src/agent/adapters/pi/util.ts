/**
 * Plumbing the Pi adapter needs: an async event channel, text and input
 * capping, strict LF JSONL framing, PATH lookup and version comparison.
 */
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';

import { MAX_EVENT_TEXT_BYTES } from '../types.ts';

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

/**
 * Splits a byte stream into JSONL records the way Pi's RPC protocol requires:
 * only on LF (an optional preceding CR is stripped), never on U+2028/U+2029,
 * which Node's readline would also treat as line breaks.
 */
export class JsonlSplitter {
  private readonly decoder = new StringDecoder('utf8');
  private buffer = '';
  private readonly onLine: (line: string) => void;

  constructor(onLine: (line: string) => void) {
    this.onLine = onLine;
  }

  write(chunk: Buffer | string): void {
    this.buffer +=
      typeof chunk === 'string' ? chunk : this.decoder.write(chunk);
    let index = this.buffer.indexOf('\n');
    while (index !== -1) {
      let line = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.length > 0) this.onLine(line);
      index = this.buffer.indexOf('\n');
    }
  }

  end(): void {
    this.buffer += this.decoder.end();
    const rest = this.buffer.endsWith('\r')
      ? this.buffer.slice(0, -1)
      : this.buffer;
    this.buffer = '';
    if (rest.length > 0) this.onLine(rest);
  }
}

export async function findOnPath(
  name: string,
  searchPath: string,
): Promise<string | undefined> {
  for (const dir of searchPath.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, name);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // not here
    }
  }
  return undefined;
}

export function parseVersion(text: string): string | undefined {
  return /(\d+\.\d+\.\d+)/.exec(text)?.[1];
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
