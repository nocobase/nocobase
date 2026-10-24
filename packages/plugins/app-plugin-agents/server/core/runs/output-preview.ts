import {
  createOutputRedactor,
  outputBlock,
  type Redactor,
  type RunEvent,
} from '@nocobase/agent-protocol';

/** No history or recovery cache: retain only bounded redaction tails and transport deduplication. */
export class OutputPreview {
  private readonly runs = new Map<
    string,
    {
      at: number;
      seq: number;
      interrupted: boolean;
      blocks: Map<
        string,
        { seq: number; redactor: ReturnType<typeof createOutputRedactor> }
      >;
      closed: Set<string>;
    }
  >();
  accept(
    runId: string,
    events: readonly RunEvent[],
    current: () => Redactor,
    emit: (event: RunEvent) => void,
  ): void {
    const now = Date.now();
    for (const [id, run] of this.runs)
      if (now - run.at > 5 * 60_000) this.runs.delete(id);
    let run = this.runs.get(runId);
    if (!run) {
      // Never resume a suffix after state expiry, capacity pressure or a lost first request.
      if (
        this.runs.size >= 1024 ||
        !events.some(
          (event) =>
            (event.seq === 1 && outputBlock(event.meta)?.phase === 'delta') ||
            (outputBlock(event.meta)?.phase === 'end' &&
              event.content !== undefined),
        )
      )
        return;
      run = {
        at: now,
        seq: 0,
        interrupted: false,
        blocks: new Map(),
        closed: new Set(),
      };
      this.runs.set(runId, run);
    }
    run.at = now;
    for (const original of events) {
      const event = { ...original, meta: current().value(original.meta) };
      const output = outputBlock(event.meta)!;
      if (output.phase === 'delta' || event.content === undefined) {
        if (event.seq <= run.seq) continue;
        if (run.interrupted || event.seq !== run.seq + 1) {
          // A missing segment loses credential context. Wait for canonical snapshots.
          run.interrupted = true;
          continue;
        }
        run.seq = event.seq;
      }
      if (run.closed.has(output.blockId)) continue;
      let block = run.blocks.get(output.blockId);
      if (!block) {
        if (run.blocks.size >= 64 || run.closed.size >= 1024) continue;
        block = { seq: 0, redactor: createOutputRedactor(current) };
        run.blocks.set(output.blockId, block);
      }
      if (output.phase === 'delta') {
        if (event.seq <= block.seq) continue;
        block.seq = event.seq;
        const content = block.redactor.write(event.content ?? '');
        if (content) emit({ ...event, content });
      } else {
        // A durable full snapshot is authoritative. Abort markers have no content and are realtime-only.
        if (event.content === undefined || event.type === 'thinking') {
          const content = block.redactor.end(event.content === undefined);
          if (content)
            emit({
              ...event,
              content,
              meta: { ...event.meta, output: { ...output, phase: 'delta' } },
            });
          emit({ ...event, content: undefined });
        }
        run.blocks.delete(output.blockId);
        run.closed.add(output.blockId);
      }
    }
  }
}
