import {
  createOutputRedactor,
  outputBlock,
  type Redactor,
} from '../protocol/index.ts';
import type { SpoolEvent } from '../core/events.ts';

type Event = SpoolEvent;
type Block = {
  event: Event;
  redactor: ReturnType<typeof createOutputRedactor>;
  ended: boolean;
  previewBytes: number;
};
/** Conversation previews never enter the durable spool. Completed snapshots retain one canonical event. */
export class OutputWriter {
  private readonly blocks = new Map<string, Block>();
  private readonly completed = new Set<string>();
  private pending?: { id: string; content: string };
  private timer?: ReturnType<typeof setTimeout>;
  private readonly emit: (event: Event) => void;
  private readonly preview: (event: Event) => void;
  private readonly redactor: Redactor;
  private readonly enabled: boolean;
  constructor(
    emit: (event: Event) => void,
    redactor: Redactor,
    enabled: boolean,
    preview: (event: Event) => void = () => {},
  ) {
    this.emit = emit;
    this.redactor = redactor;
    this.enabled = enabled;
    this.preview = (event) => preview(this.redactor.value(event));
  }
  write(event: Event): void {
    if (!this.enabled) {
      this.emit(event);
      return;
    }
    const output = outputBlock(event.meta);
    if (!output || (event.type !== 'text' && event.type !== 'thinking')) {
      this.flush();
      this.emit(event);
      return;
    }
    if (this.completed.has(output.blockId)) return;
    let block = this.blocks.get(output.blockId);
    if (!block) {
      if (this.blocks.size >= 64) {
        if (output.phase === 'end' && event.content !== undefined)
          this.save(event);
        return;
      }
      block = {
        event: { ...event, content: undefined },
        redactor: createOutputRedactor(() => this.redactor),
        ended: false,
        previewBytes: 0,
      };
      this.blocks.set(output.blockId, block);
    }
    if (block.ended) return;
    if (output.phase === 'delta')
      this.append(output.blockId, block.redactor.write(event.content ?? ''));
    else {
      this.append(
        output.blockId,
        block.redactor.end(event.content === undefined),
      );
      this.flush();
      block.ended = true;
      this.completed.add(output.blockId);
      this.blocks.delete(output.blockId);
      if (event.content === undefined)
        this.preview({ ...block.event, meta: { ...block.event.meta, output } });
      else {
        this.save(event);
      }
    }
  }
  private save(event: Event): void {
    const safe = this.redactor.text(event.content ?? '');
    const bytes = Buffer.from(safe, 'utf8');
    let cut = Math.min(64 * 1024, bytes.length);
    while (cut < bytes.length && (bytes[cut] & 0xc0) === 0x80) cut--;
    this.emit({
      ...event,
      content: bytes.subarray(0, cut).toString('utf8'),
      meta: {
        ...event.meta,
        ...(cut < bytes.length ? { truncated: true } : {}),
      },
    });
  }
  private append(id: string, content: string): void {
    if (!content) return;
    const block = this.blocks.get(id)!;
    const all = Buffer.from(content, 'utf8');
    let limit = Math.min(all.length, 64 * 1024 - block.previewBytes);
    while (limit < all.length && limit > 0 && (all[limit] & 0xc0) === 0x80)
      limit--;
    content = all.subarray(0, limit).toString('utf8');
    block.previewBytes += limit;
    if (!content) return;
    if (this.pending?.id !== id) this.flush();
    this.pending ??= { id, content: '' };
    // The redactor produces bounded pieces; split safe text without cutting a UTF-8 sequence.
    const bytes = Buffer.from(this.pending.content + content, 'utf8');
    let at = 0;
    while (bytes.length - at >= 4096) {
      let end = at + 4096;
      while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
      this.send(id, bytes.subarray(at, end).toString('utf8'));
      at = end;
    }
    this.pending.content = bytes.subarray(at).toString('utf8');
    if (this.pending.content)
      this.timer ??= setTimeout(() => this.flush(), 1000);
  }
  private send(id: string, content: string): void {
    const event = this.blocks.get(id)!.event;
    this.preview({
      ...event,
      content: this.redactor.text(content),
      meta: { ...event.meta, output: { blockId: id, phase: 'delta' } },
    });
  }
  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const pending = this.pending;
    this.pending = undefined;
    if (pending?.content) this.send(pending.id, pending.content);
  }
  end(): void {
    this.flush();
    for (const [id, block] of this.blocks)
      if (!block.ended) {
        const safe = block.redactor.end(true);
        if (safe) {
          this.append(id, safe);
          this.flush();
        }
        this.preview({
          ...block.event,
          meta: { ...block.event.meta, output: { blockId: id, phase: 'end' } },
        });
        this.completed.add(id);
        block.ended = true;
      }
    this.blocks.clear();
  }
}
