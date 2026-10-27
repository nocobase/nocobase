import { AbortError } from '@anthropic-ai/claude-agent-sdk';
import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { RunWorker, GrowingRedactor } from '../../src/agent/worker.ts';
import { OutputWriter } from '../../src/agent/output-writer.ts';
import { ApiClient } from '../../src/lib/http.ts';
import { createRedactor } from '../../src/protocol/index.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

afterEach(() => vi.useRealTimers());

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

for (const tool of ['claude', 'codex'] as const) {
  for (const late of [false, true]) {
    it(`worker-cancel-regression: ${tool} ${late ? 'rejects late' : 'persists pending'} final output before cancellation`, async () => {
      vi.useFakeTimers();
      const received: { path: string; body: unknown }[] = [];
      const saved: Record<string, unknown>[] = [];
      const redactor = new GrowingRedactor(createRedactor());
      const output = new OutputWriter(
        (event) => saved.push(event),
        redactor,
        true,
        () => undefined,
      );
      const pending = deferred<IteratorResult<AdapterEvent>>();
      const stopped = deferred<void>();
      const result = deferred<{
        exit: 'aborted';
        usage: [];
        sessionId: string;
      }>();
      const worker: RunWorker = Object.create(RunWorker.prototype);
      const client = new ApiClient({
        server: 'http://worker-fixture/',
        headers: {},
        fetch: async (address, init) => {
          received.push({
            path: String(address),
            body: JSON.parse(String(init?.body)),
          });
          return Response.json({ data: {} });
        },
      });
      Object.assign(worker, {
        runId: 'cancel-fixture',
        ending: { kind: 'cancel' },
        timings: { killGraceMs: 100, reportTimeoutMs: 1000 },
        deps: { log: vi.fn() },
        usage: [],
        delivered: new Set(),
        redactor,
        output,
        client,
        saveLocal: vi.fn(async () => ''),
        updateRecord: vi.fn(async () => undefined),
        spool: {
          push: (event: Record<string, unknown>) => saved.push(event),
          drain: async () => {
            await client.post('/events', { events: saved }, z.object({}));
            return true;
          },
        },
        handle: {
          stop: async () => {
            await stopped.promise;
            if (tool === 'claude') throw new AbortError();
          },
          result: result.promise,
        },
      });
      worker['recordEvent']({
        type: 'text',
        at: new Date().toISOString(),
        content: 'Partial reply',
        meta: { output: { blockId: 'reply', phase: 'delta' } },
      });
      const next = vi.fn(async () => ({
        done: true as const,
        value: undefined,
      }));
      const stopping = worker['stopTool']({
        iterator: { next },
        pending: pending.promise,
      });
      if (late) await vi.advanceTimersByTimeAsync(100);
      pending.resolve({
        done: false,
        value: {
          type: 'text',
          at: new Date().toISOString(),
          content: 'Partial reply',
          meta: { output: { blockId: 'reply', phase: 'end' } },
        },
      });
      stopped.resolve();
      result.resolve({
        exit: 'aborted',
        usage: [],
        sessionId: `${tool}-confirmed`,
      });
      await stopping;
      await Promise.resolve();
      expect(next).toHaveBeenCalledTimes(late ? 0 : 1);
      expect(saved.filter((event) => event.type === 'text')).toHaveLength(
        late ? 0 : 1,
      );
      if (!late) expect(worker['confirmedSessionId']).toBe(`${tool}-confirmed`);
      expect(await worker['finishEnding']()).toBe('cancelled');
      expect(received.map((item) => item.path)).toEqual([
        'http://worker-fixture/events',
        'http://worker-fixture/api/agents/runners/runs/cancel-fixture/cancelAck',
      ]);
      const persisted = (received[0]!.body as { events: typeof saved }).events;
      expect(persisted.filter((event) => event.type === 'text')).toHaveLength(
        late ? 0 : 1,
      );
      expect(persisted.at(-1)).toMatchObject({
        type: 'status',
        meta: { status: 'cancelled' },
      });
    });
  }
}
