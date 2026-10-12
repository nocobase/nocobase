import { afterEach, expect, it, vi } from 'vitest';
import { PasswordResetTasks } from '../../password-reset.js';

afterEach(() => vi.useRealTimers());

it('retains uncancellable work in its concurrency limit across deadlines and bounds shutdown', async () => {
  vi.useFakeTimers();
  const tasks = new PasswordResetTasks(undefined);
  const releases: Array<() => void> = [];
  const work = vi.fn(
    () => new Promise<void>((resolve) => releases.push(resolve)),
  );
  const pending = Array.from({ length: 200 }, () => tasks.submit(work));
  await vi.advanceTimersByTimeAsync(0);
  expect(work).toHaveBeenCalledTimes(4);
  await vi.advanceTimersByTimeAsync(60000);
  expect(work).toHaveBeenCalledTimes(4);
  releases.shift()!();
  await vi.advanceTimersByTimeAsync(0);
  expect(work).toHaveBeenCalledTimes(5);
  const closed = tasks.close();
  await vi.advanceTimersByTimeAsync(20000);
  await closed;
  for (const release of releases) release();
  await vi.advanceTimersByTimeAsync(0);
  await Promise.all(pending);
  expect(work).toHaveBeenCalledTimes(5);
  await tasks.submit(work);
  expect(work).toHaveBeenCalledTimes(5);
});
