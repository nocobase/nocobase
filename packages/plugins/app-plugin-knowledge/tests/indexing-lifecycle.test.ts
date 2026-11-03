// @vitest-environment node
import { Job } from '@nocobase/jobs';
import { afterEach, expect, it, vi } from 'vitest';
import { indexingFixture, type IndexingFixture } from './indexing-fixture.js';
import { sqliteVecIndexingExtension } from '../server/extension/sqlite-vec/index.js';
import type { KnowledgeIndexingExtension } from '../server/indexing/types.js';

let fixture: IndexingFixture | undefined;
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
});
function latch() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
it('waits for the real host handler before closing storage, closes once, and leaves the host and other scope usable', async () => {
  const entered = latch();
  const gate = latch();
  const aborted = latch();
  let active = false;
  const close = vi.fn();
  const extension: KnowledgeIndexingExtension = {
    ...sqliteVecIndexingExtension,
    create(context) {
      const backend = sqliteVecIndexingExtension.create(context);
      return {
        ...backend,
        async replaceDocument(...args) {
          active = true;
          args[3].addEventListener('abort', aborted.release, { once: true });
          entered.release();
          try {
            await gate.promise;
            return await backend.replaceDocument(...args);
          } finally {
            active = false;
          }
        },
        async close() {
          expect(active).toBe(false);
          close();
          await backend.close();
        },
      };
    },
  };
  const f = (fixture = await indexingFixture({ extension }));
  const otherExecutor = f.service.getJobExecutor('unrelated-owner');
  const ran = latch();
  class OtherJob extends Job<{ version: 1 }> {
    public static readonly jobName = 'unrelated.work';
    public async execute(): Promise<void> {
      ran.release();
    }
  }
  otherExecutor.registerJob(OtherJob);
  await otherExecutor.setup();
  const hostShutdown = vi.spyOn(f.service, 'shutdown');
  const remove = vi.spyOn(f.schedule, 'removeJob');
  await f.create();
  await f.enable();
  await entered.promise;
  let stopped = false;
  const stopping = f.runtime.close().then(() => {
    stopped = true;
  });
  try {
    await aborted.promise;
    expect(stopped).toBe(false);
    expect(close).not.toHaveBeenCalled();
    gate.release();
    await stopping;
    expect(close).toHaveBeenCalledTimes(1);
    await Promise.all([f.runtime.close(), f.runtime.close()]);
    expect(close).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    expect(hostShutdown).not.toHaveBeenCalled();
    await otherExecutor.addJob(new OtherJob({ version: 1 }));
    await ran.promise;
    const add = vi.spyOn(f.executor, 'addJob');
    await f.tick();
    await f.cleanup();
    expect(add).not.toHaveBeenCalled();
  } finally {
    gate.release();
    await stopping;
  }
});
it('registers exactly the owned rules before schedule setup and does not remove host rules on shutdown', async () => {
  const f = (fixture = await indexingFixture());
  expect([...f.rules.keys()]).toEqual([
    'knowledge.indexing.reconcile',
    'knowledge.indexing.cleanup',
  ]);
  expect(f.rules.get('knowledge.indexing.reconcile')?.options).toEqual({
    every: 30000,
  });
  expect(f.rules.get('knowledge.indexing.cleanup')?.options).toEqual({
    every: 3600000,
  });
  expect(f.jobRegistration.mock.calls).toHaveLength(3);
  expect(Math.max(...f.jobRegistration.mock.invocationCallOrder)).toBeLessThan(
    f.jobSetup.mock.invocationCallOrder[0]!,
  );
  expect(
    Math.max(...vi.mocked(f.schedule.addJob).mock.invocationCallOrder),
  ).toBeLessThan(f.scheduleSetup.mock.invocationCallOrder[0]!);
  const setup = vi.spyOn(f.schedule, 'removeJob');
  await f.runtime.close();
  expect(setup).not.toHaveBeenCalled();
});
