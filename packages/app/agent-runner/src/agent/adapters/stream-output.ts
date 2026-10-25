import { randomUUID } from 'node:crypto';
import { MAX_EVENT_TEXT_BYTES, type AdapterEvent } from './types.ts';

const MAX_PARTIAL_BLOCKS = 64;

export function boundedOutputText(
  text: string,
  limit: number = MAX_EVENT_TEXT_BYTES,
): string {
  const bytes = Buffer.from(text, 'utf8');
  let end = Math.min(bytes.length, limit);
  while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.subarray(0, end).toString('utf8');
}

type TextType = 'text' | 'thinking';
type OutputEvent = Omit<AdapterEvent, 'at'>;
type Block = {
  id: string;
  length: number;
  type: TextType;
  meta?: AdapterEvent['meta'];
  ended: boolean;
  partial?: string;
  bytes: number;
};

/** Normalize raw provider deltas before redaction. The worker owns redaction and throttling. */
export class StreamOutput {
  private readonly blocks = new Map<string, Block>();
  private buffered = 0;
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
    const block = this.block(key, type, meta);
    if (block.ended) return;
    const content = (block.length ? '' : prefix) + text;
    block.length += text.length;
    if (block.partial !== undefined && block.bytes < MAX_EVENT_TEXT_BYTES) {
      const bytes = Buffer.from(content, 'utf8');
      let end = Math.min(bytes.length, MAX_EVENT_TEXT_BYTES - block.bytes);
      while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
      block.partial += bytes.subarray(0, end).toString('utf8');
      block.bytes += end;
      // Once a piece is cut, keep a prefix rather than appending later smaller pieces.
      if (end < bytes.length) block.bytes = MAX_EVENT_TEXT_BYTES;
    }
    this.emit({
      type,
      content,
      meta: { ...meta, output: { blockId: block.id, phase: 'delta' } },
    });
  }

  complete(
    key: string,
    type: TextType,
    text: string,
    meta?: AdapterEvent['meta'],
    prefix = '',
  ): void {
    const block = this.blocks.get(key);
    if (block?.ended) return;
    const suffix = text.slice(block?.length ?? 0);
    if (suffix) this.delta(key, type, suffix, meta, prefix);
    this.close(key, text);
  }

  close(key: string, content?: string, partial = false): void {
    const block = this.blocks.get(key);
    if (!block || block.ended) return;
    block.ended = true;
    this.emit({
      type: block.type,
      ...(content === undefined ? {} : { content }),
      meta: {
        ...block.meta,
        ...(partial && content !== undefined ? { truncated: true } : {}),
        output: { blockId: block.id, phase: 'end' },
      },
    });
    if (block.partial !== undefined) this.buffered--;
    block.partial = undefined;
  }

  /** Only a native terminal acknowledgement may turn an unfinished preview into history. */
  finishPartial(key: string): void {
    this.close(key, this.blocks.get(key)?.partial, true);
  }

  private block(
    key: string,
    type: TextType,
    meta?: AdapterEvent['meta'],
  ): Block {
    let block = this.blocks.get(key);
    if (!block) {
      block = {
        id: randomUUID(),
        length: 0,
        type,
        meta,
        ended: false,
        bytes: 0,
      };
      if (this.buffered < MAX_PARTIAL_BLOCKS) {
        block.partial = '';
        this.buffered++;
      }
      this.blocks.set(key, block);
    }
    return block;
  }

  end(partial = false): void {
    for (const key of this.blocks.keys()) {
      if (partial) this.finishPartial(key);
      else this.close(key);
    }
  }
  reset(): void {
    this.end();
    this.blocks.clear();
  }
}
