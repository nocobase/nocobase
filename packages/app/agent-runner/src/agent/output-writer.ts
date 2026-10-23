import {
  createStreamRedactor,
  outputBlock,
  type Redactor,
  type StreamRedactor,
} from '../protocol/index.ts';
import type { SpoolEvent } from '../core/events.ts';

type Event = SpoolEvent;
type Block = {
  event: Event;
  redactor: StreamRedactor;
  complete: string;
  ended: boolean;
};
/** Raw blocks are independently redacted before either the timer or size boundary can persist a fragment. */
export class OutputWriter {
  private readonly blocks = new Map<string, Block>();
  private pending?: { id: string; content: string };
  private timer?: ReturnType<typeof setTimeout>;
  private failure: Error | undefined;
  private readonly emit: (event: Event) => void;
  private readonly redactor: Redactor;
  private readonly enabled: boolean;

  constructor(
    emit: (event: Event) => void,
    redactor: Redactor,
    enabled: boolean,
  ) {
    this.emit = emit;
    this.redactor = redactor;
    this.enabled = enabled;
  }

  write(event: Event): void {
    if (this.failure !== undefined) throw this.failure;
    const output = outputBlock(event.meta);
    if (!output || (event.type !== 'text' && event.type !== 'thinking')) {
      this.flush();
      this.emit(event);
      return;
    }
    let block = this.blocks.get(output.blockId);
    if (!block) {
      block = {
        event: { ...event, content: undefined },
        redactor: createStreamRedactor(this.redactor),
        complete: '',
        ended: false,
      };
      this.blocks.set(output.blockId, block);
    }
    if (block.ended) return;
    const safe = block.redactor.write(event.content ?? '', { partial: true });
    this.append(output.blockId, safe);
    if (output.phase === 'end') this.finish(output.blockId, block);
  }

  private append(id: string, content: string): void {
    if (!content) return;
    const block = this.blocks.get(id)!;
    if (!this.enabled) {
      block.complete += content;
      return;
    }
    if (this.pending?.id !== id) this.flush();
    this.pending ??= { id, content: '' };
    this.pending.content += content;
    // Split at UTF-8 boundaries, after redaction, so a large provider delta cannot skip the size limit.
    while (Buffer.byteLength(this.pending.content, 'utf8') >= 4096) {
      const bytes = Buffer.from(this.pending.content, 'utf8');
      let cut = 4096;
      while (cut < bytes.length && (bytes[cut] & 0xc0) === 0x80) cut--;
      this.send(id, bytes.subarray(0, cut).toString('utf8'), 'delta');
      this.pending.content = bytes.subarray(cut).toString('utf8');
    }
    if (this.pending.content)
      this.timer ??= setTimeout(() => {
        try {
          this.flush();
        } catch (error) {
          this.failure =
            error instanceof Error ? error : new Error(String(error));
        }
      }, 1000);
  }

  private send(id: string, content: string, phase: 'delta' | 'end'): void {
    const event = this.blocks.get(id)!.event;
    this.emit({
      ...event,
      content,
      meta: { ...event.meta, output: { blockId: id, phase } },
    });
  }

  private finish(id: string, block: Block): void {
    if (block.ended) return;
    this.append(id, block.redactor.end());
    block.ended = true;
    if (!this.enabled) {
      const { output: _output, ...meta } = block.event.meta ?? {};
      this.emit({ ...block.event, content: block.complete, meta });
      block.complete = '';
    } else {
      if (this.pending?.id !== id) this.flush();
      const content = this.pending?.content ?? '';
      this.pending = undefined;
      if (this.timer) clearTimeout(this.timer);
      this.timer = undefined;
      this.send(id, content, 'end');
    }
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const pending = this.pending;
    this.pending = undefined;
    if (pending?.content) this.send(pending.id, pending.content, 'delta');
  }

  /** Also used before cancellation/failure reports: never expose an unfinished sensitive tail. */
  end(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    if (this.failure !== undefined) throw this.failure;
    for (const [id, block] of this.blocks)
      if (!block.ended) this.finish(id, block);
    this.flush();
  }
}
