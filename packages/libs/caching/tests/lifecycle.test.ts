import { afterEach, describe, expect, it, vi } from 'vitest';
import { OperationScope } from '../src/internal/lifecycle.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('retained cleanup observers', () => {
  it('delivers a late cleanup rejection to replacement waiters after an earlier timeout', async () => {
    vi.useFakeTimers();
    const scope = new OperationScope();
    const backend = Promise.withResolvers<void>();
    const release = vi.fn(() => backend.promise);
    const initial = scope.close(release);
    void initial.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(initial).rejects.toThrow('timed out');
    const replacement = scope.close(release);
    expect(scope.close(release)).toBe(replacement);
    const observed = replacement.catch((error: unknown) => error);
    const failure = new Error('controlled late failure');
    backend.reject(failure);
    expect(await observed).toBe(failure);
    expect(() => scope.assertOpen()).toThrow('closed');
    await scope.close(() => Promise.resolve());
    expect(release).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retains work and observes cleanup when the close deadline timer cannot be registered', async () => {
    const scope = new OperationScope();
    const work = Promise.withResolvers<string>();
    const result = scope.run(() => work.promise);
    const release = vi.fn(() => Promise.resolve());
    const timer = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementationOnce(() => {
        throw new Error('controlled timer registration failure');
      });
    await expect(scope.close(release)).rejects.toThrow(
      'timer registration failure',
    );
    timer.mockRestore();
    expect(release).not.toHaveBeenCalled();
    const retry = scope.close(release);
    work.resolve('done');
    expect(await result).toBe('done');
    await retry;
    expect(release).toHaveBeenCalledOnce();
    await expect(scope.run(() => 'new')).rejects.toThrow('closed');
  });

  it('drains failed operations without hiding their rejection or skipping cleanup', async () => {
    const scope = new OperationScope();
    const failure = new Error('controlled loader failure');
    const result = scope.run(() => {
      throw failure;
    });
    const release = vi.fn(() => Promise.resolve());
    const closing = scope.close(release);
    await expect(result).rejects.toBe(failure);
    await closing;
    expect(release).toHaveBeenCalledOnce();
  });
});
