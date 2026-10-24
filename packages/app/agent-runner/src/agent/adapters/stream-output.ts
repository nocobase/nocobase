import { randomUUID } from 'node:crypto';
import type { AdapterEvent } from './types.ts';

type TextType = 'text' | 'thinking';
type OutputEvent = Omit<AdapterEvent, 'at'>;
type Block = {
  id: string;
  length: number;
  type: TextType;
  meta?: AdapterEvent['meta'];
  ended: boolean;
};

/** Normalize raw provider deltas before redaction. The worker owns redaction and throttling. */
export class StreamOutput {
  private readonly blocks = new Map<string, Block>();
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

  close(key: string, content?: string): void {
    const block = this.blocks.get(key);
    if (!block || block.ended) return;
    block.ended = true;
    this.emit({
      type: block.type,
      ...(content === undefined ? {} : { content }),
      meta: { ...block.meta, output: { blockId: block.id, phase: 'end' } },
    });
  }

  private block(
    key: string,
    type: TextType,
    meta?: AdapterEvent['meta'],
  ): Block {
    let block = this.blocks.get(key);
    if (!block) {
      block = { id: randomUUID(), length: 0, type, meta, ended: false };
      this.blocks.set(key, block);
    }
    return block;
  }

  end(): void {
    for (const key of this.blocks.keys()) this.close(key);
  }
  reset(): void {
    this.end();
    this.blocks.clear();
  }
}
