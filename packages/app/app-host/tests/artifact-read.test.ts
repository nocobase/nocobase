import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';

import type { NocoBaseDriveDisk } from '@nocobase/drive';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  downloadArtifact,
  resolveArtifactReadOptions,
} from '../dist/artifact-read.js';
import { withPreparationSignal } from '../dist/deployment-control.js';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'artifact-read-'));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(async () => {
  vi.useRealTimers();
  await rm(directory, { recursive: true, force: true });
});

const options = { idleTimeoutMs: 60, timeoutMs: 600 };
const diskWith = (getStream: unknown) => ({ getStream }) as NocoBaseDriveDisk;
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

it('defaults to one minute idle and ten minutes total and validates overrides', () => {
  expect(resolveArtifactReadOptions()).toEqual({
    idleTimeoutMs: 60_000,
    timeoutMs: 600_000,
  });
  expect(resolveArtifactReadOptions({ timeoutMs: 120 })).toEqual({
    idleTimeoutMs: 60_000,
    timeoutMs: 120,
  });
  for (const value of [0, -1, 1.5, NaN, Infinity, 2_147_483_648, '60', null])
    expect(() =>
      resolveArtifactReadOptions({ idleTimeoutMs: value as number }),
    ).toThrow('artifactRead.idleTimeoutMs');
});

it('retries one idle timeout with a fresh file and succeeds', async () => {
  const stalled = new PassThrough();
  const getStream = vi
    .fn()
    .mockResolvedValueOnce(stalled)
    .mockImplementation(() => Readable.from(['complete']));
  const destination = path.join(directory, 'archive');
  const result = downloadArtifact(
    diskWith(getStream),
    'key',
    destination,
    options,
  );
  await tick();
  stalled.write('partial');
  await vi.advanceTimersByTimeAsync(60);
  await result;
  expect(getStream).toHaveBeenCalledTimes(2);
  expect(stalled.destroyed).toBe(true);
  expect(await readFile(destination, 'utf8')).toBe('complete');
  expect(vi.getTimerCount()).toBe(0);
});

it('resets idle time on chunks but bounds an active transfer by the total deadline', async () => {
  const streams: PassThrough[] = [];
  const getStream = vi.fn().mockImplementation(() => {
    const stream = new PassThrough();
    streams.push(stream);
    return stream;
  });
  const result = downloadArtifact(
    diskWith(getStream),
    'key',
    path.join(directory, 'archive'),
    { idleTimeoutMs: 60, timeoutMs: 100 },
  ).catch((error: unknown) => error);
  while (!streams[0]?.readableFlowing) await tick();
  await vi.advanceTimersByTimeAsync(50);
  streams[0]!.write('still reading');
  await vi.advanceTimersByTimeAsync(50);
  while (!streams[1]?.readableFlowing) await tick();
  await vi.advanceTimersByTimeAsync(50);
  streams[1]!.write('still reading');
  await vi.advanceTimersByTimeAsync(50);
  expect(await result).toMatchObject({
    code: 'ARTIFACT_READ_TIMEOUT',
    kind: 'total',
    timeoutMs: 100,
  });
  expect(streams.every((stream) => stream.destroyed)).toBe(true);
  expect(await readdir(directory)).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it.each(['resolve', 'reject'] as const)(
  'times out a pending getStream and handles its late %s',
  async (ending) => {
    const pending = [
      Promise.withResolvers<Readable>(),
      Promise.withResolvers<Readable>(),
    ];
    const getStream = vi
      .fn()
      .mockImplementation(
        () => pending[getStream.mock.calls.length - 1]!.promise,
      );
    const result = downloadArtifact(
      diskWith(getStream),
      'key',
      path.join(directory, 'archive'),
      options,
    ).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(60);
    await vi.waitFor(() => expect(getStream).toHaveBeenCalledTimes(2));
    await vi.advanceTimersByTimeAsync(60);
    expect(await result).toMatchObject({
      code: 'ARTIFACT_READ_TIMEOUT',
      kind: 'idle',
      timeoutMs: 60,
    });
    for (const deferred of pending) {
      const stream = new PassThrough();
      if (ending === 'resolve') deferred.resolve(stream);
      else deferred.reject(new Error('late storage error'));
      await tick();
      if (ending === 'resolve') expect(stream.destroyed).toBe(true);
    }
    expect(await readdir(directory)).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  },
);

it('prefers cancellation when a read timeout and cancellation occur together', async () => {
  const controller = new AbortController();
  const getStream = vi.fn().mockImplementation(() => new Promise(() => {}));
  const cancelled = new Error('cancelled');
  setTimeout(() => controller.abort(cancelled), 60);
  const result = withPreparationSignal(controller.signal, () =>
    downloadArtifact(
      diskWith(getStream),
      'key',
      path.join(directory, 'archive'),
      options,
    ),
  ).catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(60);
  expect(await result).toBe(cancelled);
  expect(getStream).toHaveBeenCalledTimes(1);
  expect(await readdir(directory)).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it('does not retry a storage failure and clears timers', async () => {
  const failure = new Error('storage unavailable');
  const getStream = vi.fn().mockRejectedValue(failure);
  await expect(
    downloadArtifact(
      diskWith(getStream),
      'key',
      path.join(directory, 'archive'),
      options,
    ),
  ).rejects.toBe(failure);
  expect(getStream).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
