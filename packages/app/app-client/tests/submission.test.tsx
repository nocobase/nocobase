import { describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/api-client';
import {
  SubmissionController,
  deriveSubmissionKey,
  PendingSubmissionError,
  SubmissionTimeoutError,
} from '../src/submission.js';

describe('shared form submission', () => {
  it('takes the lock before asynchronous validation and releases it only after completion', async () => {
    const controller = new SubmissionController();
    let finish!: () => void;
    const waiting = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const execute = vi.fn(async () => {
      await waiting;
      return 'saved';
    });
    const first = controller.run({ name: 'sample' }, execute);
    expect(controller.getSnapshot()).toBe(true);
    expect(await controller.run({ name: 'sample' }, execute)).toBeUndefined();
    finish();
    expect(await first).toBe('saved');
    expect(execute).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toBe(false);
  });
  it('releases a timed-out foreground wait and retries with the original operation', async () => {
    vi.useFakeTimers();
    try {
      const controller = new SubmissionController({ timeoutMs: 10 });
      let original = '';
      let signal: AbortSignal | undefined;
      const pending = controller.run({ value: 'one' }, (key, abort) => {
        original = key;
        signal = abort;
        return new Promise(() => {});
      });
      const rejected = pending.catch((error: unknown) => error);
      expect(original).not.toBe('');
      await vi.advanceTimersByTimeAsync(10);
      expect(await rejected).toBeInstanceOf(SubmissionTimeoutError);
      expect(signal?.aborted).toBe(true);
      expect(controller.getSnapshot()).toBe(false);
      await controller.run({ value: 'one' }, async (key) => {
        expect(key).toBe(original);
        return 'confirmed';
      });
    } finally {
      vi.useRealTimers();
    }
  });
  it('keeps the operation across lost responses and reloads without persisting the form', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    let original = '';
    const controller = new SubmissionController({
      scope: 'alice:create:one',
      storage,
    });
    await expect(
      controller.run({ secret: 'private input' }, async (key) => {
        original = key;
        throw new TypeError('Connection lost');
      }),
    ).rejects.toThrow('Connection lost');
    expect([...values.values()].join()).not.toContain('private input');
    const reloaded = new SubmissionController({
      scope: 'alice:create:one',
      storage,
    });
    await expect(
      reloaded.run({ secret: 'changed' }, async () => 'bad'),
    ).rejects.toBeInstanceOf(PendingSubmissionError);
    await reloaded.run({ secret: 'private input' }, async (key) => {
      expect(key).toBe(original);
      return 'saved';
    });
    await reloaded.run({ secret: 'private input' }, async (key) => {
      expect(key).not.toBe(original);
      return 'new record';
    });
    expect(values.size).toBe(0);
  });
  it('requires explicit reconciliation before starting a new operation after an unknown result', async () => {
    const controller = new SubmissionController();
    let original = '';
    await expect(
      controller.run({ value: 'one' }, async (key) => {
        original = key;
        throw new TypeError('Lost');
      }),
    ).rejects.toThrow('Lost');
    await expect(
      controller.run({ value: 'two' }, async () => 'bad'),
    ).rejects.toBeInstanceOf(PendingSubmissionError);
    controller.acknowledgeOutcome('not-committed');
    await controller.run({ value: 'two' }, async (key) => {
      expect(key).not.toBe(original);
      return 'saved';
    });
  });
  it('allows corrected input after a definite rollback and preserves it after an opaque failure', async () => {
    const controller = new SubmissionController();
    await expect(
      controller.run({ value: 'bad' }, async () => {
        throw new ApiClientError('Rejected', {
          status: 400,
          reason: 'INVALID_INPUT',
          method: 'POST',
          url: '/',
        });
      }),
    ).rejects.toThrow();
    await expect(
      controller.run({ value: 'good' }, async () => 'saved'),
    ).resolves.toBe('saved');
    await expect(
      controller.run({ value: 'uncertain' }, async () => {
        throw new ApiClientError('Unknown', {
          status: 500,
          method: 'POST',
          url: '/',
        });
      }),
    ).rejects.toThrow();
    await expect(
      controller.run({ value: 'changed' }, async () => 'bad'),
    ).rejects.toBeInstanceOf(PendingSubmissionError);
  });
});

it('retains an isolated memory snapshot and deterministic group keys without storing sensitive inputs', async () => {
  const controller = new SubmissionController();
  const input = { nested: { value: 'original' } };
  let originalKey = '';
  await expect(
    controller.run(input, async (key, _signal, snapshot) => {
      originalKey = key;
      snapshot.nested.value = 'changed by execution';
      expect(input.nested.value).toBe('original');
      throw new TypeError('Response lost');
    }),
  ).rejects.toThrow('Response lost');
  await controller.run(input, async (key, _signal, snapshot) => {
    expect(key).toBe(originalKey);
    expect(snapshot).toEqual(input);
    expect(deriveSubmissionKey(key, 'step-1')).toBe(
      deriveSubmissionKey(originalKey, 'step-1'),
    );
    expect(deriveSubmissionKey(key, 'step-1')).not.toBe(
      deriveSubmissionKey(key, 'step-2'),
    );
    expect(deriveSubmissionKey(key, 'step-1')).toMatch(
      /^\d{13}\.[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/,
    );
  });
});
