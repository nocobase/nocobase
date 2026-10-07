/** Small helpers of the Codex adapter. */
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

/** Splits a POSIX shell word list, honoring single and double quotes. */
export function shellWords(line: string): string[] | undefined {
  const words: string[] = [];
  let current = '';
  let started = false;
  let quote: '"' | "'" | undefined;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote === "'") {
      if (char === "'") quote = undefined;
      else current += char;
      continue;
    }
    if (quote === '"') {
      if (char === '"') quote = undefined;
      else if (char === '\\' && /["\\$`\n]/.test(line[index + 1] ?? '')) {
        current += line[index + 1];
        index += 1;
      } else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      started = true;
    } else if (char === '\\') {
      current += line[index + 1] ?? '';
      started = true;
      index += 1;
    } else if (/\s/.test(char)) {
      if (started) words.push(current);
      current = '';
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (quote) return undefined;
  if (started) words.push(current);
  return words;
}

const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash']);

/**
 * The script of a `<shell> -c|-lc <script>` command line, which is how Codex
 * reports the commands it runs; other command lines are returned unchanged.
 */
export function unwrapShell(command: string): string {
  const words = shellWords(command.trim());
  if (!words || words.length !== 3) return command;
  const [shell, flag, script] = words as [string, string, string];
  const name = shell.split('/').pop() ?? shell;
  if (!SHELLS.has(name) || !/^-l?c$/.test(flag)) return command;
  return script;
}
