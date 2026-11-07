import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailExecutions } from '../src/execution.js';

afterEach(() => vi.useRealTimers());

describe('mail execution capacity', () => {
  it('keeps four uncooperative operations across repeated timeout windows and stop', async () => {
    vi.useFakeTimers();
    const executions = new MailExecutions(4, 20);
    const release: Array<() => void> = [];
    const signals: AbortSignal[] = [];
    const submit = () =>
      executions.submit((signal) => {
        signals.push(signal);
        return new Promise<void>((resolve) => release.push(resolve));
      });
    for (let i = 0; i < 4; i++) expect(submit()).toBeDefined();
    await vi.advanceTimersByTimeAsync(21);
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < 4; i++) expect(submit()).toBeUndefined();
      await vi.advanceTimersByTimeAsync(21);
      expect(executions.inFlight).toBe(4);
    }
    executions.stop();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(executions.inFlight).toBe(4);
    expect(submit()).toBeUndefined();
    let finished = false;
    const waiting = executions.wait().then(() => {
      finished = true;
    });
    await vi.advanceTimersByTimeAsync(5_001);
    expect(finished).toBe(false);
    expect(executions.inFlight).toBe(4);
    release.forEach((finish) => finish());
    await vi.advanceTimersByTimeAsync(0);
    await waiting;
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
    const next = executions.submit(async () => 'accepted');
    expect(next).toBeDefined();
    await expect(next!.completion).resolves.toBe('accepted');
    executions.stop();
  });
});

it('waits for original work after stop without releasing its slot', async () => {
  const executions = new MailExecutions(1);
  const completion = Promise.withResolvers<void>();
  const execution = executions.submit((signal) => {
    expect(signal.aborted).toBe(false);
    return completion.promise;
  })!;
  await Promise.resolve();
  executions.stop();
  expect(execution.signal.aborted).toBe(true);
  expect(executions.submit(async () => undefined)).toBeUndefined();
  let waited = false;
  const waiting = executions.wait().then(() => {
    waited = true;
  });
  await Promise.resolve();
  expect(waited).toBe(false);
  expect(executions.inFlight).toBe(1);
  completion.resolve();
  await Promise.all([execution.completion, waiting]);
  expect(executions.inFlight).toBe(0);
});
