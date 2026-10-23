import type { AdapterEvent } from './types.ts';

type OutputEvent = Omit<AdapterEvent, 'at'>;
type TextType = 'text' | 'thinking';

/** Coalesces consecutive chunks with ACP's one-second / 4 KiB cadence. */
export class StreamOutput {
  private pending?: { key: string; event: OutputEvent };
  private timer?: ReturnType<typeof setTimeout>;
  private readonly lengths = new Map<string, number>();
  private readonly emit: (event: OutputEvent) => void;

  constructor(emit: (event: OutputEvent) => void) {
    this.emit = emit;
  }

  delta(
    key: string,
    type: TextType,
    text: string,
    meta?: AdapterEvent['meta'],
    prefix = '',
  ): void {
    if (!text) return;
    const length = this.lengths.get(key) ?? 0;
    this.lengths.set(key, length + text.length);
    this.append(key, type, (length ? '' : prefix) + text, meta);
  }

  /** A completed snapshot supplies only the suffix not already streamed. */
  complete(
    key: string,
    type: TextType,
    text: string,
    meta?: AdapterEvent['meta'],
    prefix = '',
  ): void {
    const length = this.lengths.get(key) ?? 0;
    const suffix = text.slice(length);
    if (suffix) this.append(key, type, (length ? '' : prefix) + suffix, meta);
    this.lengths.delete(key);
    this.flush();
  }

  private append(
    key: string,
    type: TextType,
    content: string,
    meta?: AdapterEvent['meta'],
  ): void {
    if (this.pending?.key !== key || this.pending.event.type !== type)
      this.flush();
    if (this.pending) this.pending.event.content += content;
    else
      this.pending = {
        key,
        event: { type, content, ...(meta ? { meta } : {}) },
      };
    if (this.pending.event.content!.length >= 4 * 1024) this.flush();
    else this.timer ??= setTimeout(() => this.flush(), 1000);
  }

  reset(): void {
    this.flush();
    this.lengths.clear();
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const pending = this.pending;
    this.pending = undefined;
    if (pending) this.emit(pending.event);
  }
}
