import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailExecutions } from '../src/execution.js';

afterEach(() => vi.useRealTimers());

describe('mail execution capacity', () => {
  it('keeps four uncooperative operations across repeated timeout windows and bounded shutdown', async () => {
    vi.useFakeTimers();
    const executions = new MailExecutions(4, 20);
    const release: Array<() => void> = [];
    const submit = () =>
      executions.submit(
        () => new Promise<void>((resolve) => release.push(resolve)),
      );
    for (let i = 0; i < 4; i++) expect(submit()).toBeDefined();
    await vi.advanceTimersByTimeAsync(21);
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 4; i++) expect(submit()).toBeUndefined();
      await vi.advanceTimersByTimeAsync(21);
      expect(executions.inFlight).toBe(4);
    }
    const close = executions.close(5);
    await vi.advanceTimersByTimeAsync(6);
    await close;
    expect(executions.inFlight).toBe(4);
    release.forEach((finish) => finish());
    await vi.advanceTimersByTimeAsync(0);
    expect(executions.inFlight).toBe(0);
    expect(submit()).toBeUndefined();
  });

  it('reclaims capacity on late rejection without an unhandled rejection', async () => {
    const executions = new MailExecutions(1, 10);
    let reject!: (error: Error) => void;
    const first = executions.submit(
      () =>
        new Promise<void>((_resolve, fail) => {
          reject = fail;
        }),
    )!;
    await Promise.resolve();
    reject(new Error('Synthetic failure'));
    await expect(first.completion).rejects.toThrow('Synthetic failure');
    expect(executions.inFlight).toBe(0);
    expect(executions.submit(async () => 'accepted')).toBeDefined();
    await executions.close();
  });
});

it('drains original work after the cancellation budget expires without releasing its slot', async () => {
  vi.useFakeTimers();
  const executions = new MailExecutions(1);
  const completion = Promise.withResolvers<void>();
  executions.submit(() => completion.promise);
  try {
    const close = executions.close();
    await vi.advanceTimersByTimeAsync(5001);
    await close;
    expect(executions.inFlight).toBe(1);
    let drained = false;
    const drain = executions.drain().then(() => {
      drained = true;
    });
    await Promise.resolve();
    expect(drained).toBe(false);
    completion.resolve();
    await drain;
    expect(executions.inFlight).toBe(0);
  } finally {
    completion.resolve();
    vi.useRealTimers();
  }
});
