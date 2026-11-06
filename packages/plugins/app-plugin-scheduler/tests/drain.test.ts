import type { DatabaseManager } from '@nocobase/db';
import type { ScheduleEvent } from '@nocobase/jobs';
import { describe, expect, it, vi } from 'vitest';

import { ScheduleOccurrenceStore } from '../server/occurrences.js';
import { ScheduleTargetRegistry } from '../server/schedules/registry.js';
import { DefaultSchedulerService } from '../server/services/scheduler.js';
import type { ScheduleStore } from '../server/store.js';

function harness() {
  const occurrences = new ScheduleOccurrenceStore({} as DatabaseManager);
  const reconcile = vi.spyOn(occurrences, 'reconcile').mockResolvedValue(0);
  const complete = vi.spyOn(occurrences, 'complete').mockResolvedValue();
  const recordEvent = vi.fn(async () => undefined);
  const lifecycle = {
    stopReconciliation: vi.fn(),
    shutdownExecutor: vi.fn(async (): Promise<void> => undefined),
    unsubscribe: vi.fn(),
  };
  const service = new DefaultSchedulerService(
    { recordEvent } as unknown as ScheduleStore,
    occurrences,
    new ScheduleTargetRegistry(),
    lifecycle,
  );
  const handle = service.registerTarget({
    type: 'test',
    title: 'Test',
    validate: () => ({ valid: true }),
    start: async () => ({ state: 'completed', outcome: 'succeeded' }),
  });
  const report = () =>
    handle.reportCompletion(
      'occurrence',
      { type: 'test', id: 'run' },
      { status: 'succeeded' },
    );
  return { service, lifecycle, reconcile, complete, recordEvent, report };
}
const event: ScheduleEvent = {
  name: 'ScheduleEnd',
  jobId: 'occurrence',
  jobName: 'test',
  scheduledAt: new Date(),
  runAt: new Date(),
};

// Flush immediate promise continuations, without advancing clocks or releasing gates.
const turn = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('Scheduler drain', () => {
  it('shares one result and waits for overlapping inspections and executor work', async () => {
    const { service, lifecycle, reconcile } = harness();
    const first = Promise.withResolvers<number>();
    const second = Promise.withResolvers<number>();
    const execution = Promise.withResolvers<void>();
    reconcile
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    lifecycle.shutdownExecutor.mockReturnValue(execution.promise);
    const inspections = [
      service.reconcileOccurrences(),
      service.reconcileOccurrences(),
    ];
    const drain = service.drain();
    expect(service.drain()).toBe(drain);
    expect(lifecycle.stopReconciliation).toHaveBeenCalledOnce();
    await expect(service.reconcileOccurrences()).resolves.toBe(0);
    await turn();
    expect(reconcile).toHaveBeenCalledTimes(2);
    first.resolve(1);
    execution.resolve();
    await turn();
    expect(lifecycle.unsubscribe).not.toHaveBeenCalled();
    second.resolve(1);
    await Promise.all(inspections);
    await drain;
    expect(lifecycle.unsubscribe).toHaveBeenCalledOnce();
    expect(lifecycle.shutdownExecutor).toHaveBeenCalledOnce();
    expect(service.drain()).toBe(drain);
  });

  it('accepts reports while producers drain, then rejects late reports before storage', async () => {
    const { service, lifecycle, complete, report } = harness();
    const execution = Promise.withResolvers<void>();
    const write = Promise.withResolvers<void>();
    lifecycle.shutdownExecutor.mockReturnValue(execution.promise);
    complete.mockReturnValue(write.promise);
    const before = report();
    const drain = service.drain();
    const during = report();
    await turn();
    expect(complete).toHaveBeenCalledTimes(2);
    execution.resolve();
    await turn();
    await expect(report()).rejects.toThrow('has been drained');
    expect(complete).toHaveBeenCalledTimes(2);
    expect(lifecycle.unsubscribe).not.toHaveBeenCalled();
    write.resolve();
    await Promise.all([before, during, drain]);
    await expect(report()).rejects.toThrow('has been drained');
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('waits for remaining work after errors and preserves every original cause', async () => {
    const { service, lifecycle, reconcile, recordEvent, complete, report } =
      harness();
    const inspection = Promise.withResolvers<number>();
    const write = Promise.withResolvers<void>();
    const errors = [
      new Error('backend state'),
      new Error('observation write'),
      new Error('event write'),
      new Error('report write'),
    ];
    lifecycle.shutdownExecutor.mockRejectedValue(errors[0]);
    reconcile.mockReturnValue(inspection.promise);
    recordEvent.mockRejectedValue(errors[2]);
    complete.mockImplementation(async () => {
      await write.promise;
      throw errors[3];
    });
    const check = service.reconcileOccurrences();
    const drain = service.drain();
    const outcome = drain.catch((error) => error as AggregateError);
    const record = service.recordEvent(event).catch((error) => error);
    const completion = report().catch((error) => error);
    await turn();
    expect(lifecycle.unsubscribe).not.toHaveBeenCalled();
    inspection.reject(errors[1]);
    await expect(check).rejects.toBe(errors[1]);
    await turn();
    expect(lifecycle.unsubscribe).not.toHaveBeenCalled();
    write.resolve();
    expect(await record).toBe(errors[2]);
    expect(await completion).toBe(errors[3]);
    const result = await outcome;
    expect(result).toBeInstanceOf(AggregateError);
    expect(result).toHaveProperty('errors', expect.arrayContaining(errors));
    expect(result).toHaveProperty('errors.length', 4);
    expect(lifecycle.unsubscribe).toHaveBeenCalledOnce();
    expect(service.drain()).toBe(drain);
  });

  it('preserves a single error even when a caller consumes the record rejection', async () => {
    const { service, recordEvent } = harness();
    const error = new Error('record failed');
    recordEvent.mockRejectedValue(error);
    const record = service.recordEvent(event).catch(() => undefined);
    const drain = service.drain();
    await expect(drain).rejects.toBe(error);
    await record;
    expect(service.drain()).toBe(drain);
  });

  it('drains an unused service without querying persistent waiting work', async () => {
    const { service, lifecycle, reconcile, complete, recordEvent } = harness();
    await service.drain();
    expect(reconcile).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(recordEvent).not.toHaveBeenCalled();
    expect(lifecycle.unsubscribe).toHaveBeenCalledOnce();
  });
});
