import { fork } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { Header } from 'tar';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { artifactWorker } from '../src/artifact-worker-client.js';
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, fork: vi.fn(actual.fork) };
});
const directories: string[] = [];
beforeEach(() => {
  vi.mocked(fork).mockClear();
});
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(
    directories
      .splice(0)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
async function archive(name: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'artifact-worker-'));
  directories.push(dir);
  const header = new Header({ path: name, size: 4, type: 'File', mode: 0o600 });
  header.encode();
  const bytes = gzipSync(
    Buffer.concat([
      header.block!,
      Buffer.from('test'),
      Buffer.alloc(508 + 1024),
    ]),
  );
  const file = path.join(dir, 'archive.tar.gz');
  await writeFile(file, bytes);
  const destination = path.join(dir, 'staging');
  await mkdir(destination);
  return { dir, file, bytes, destination };
}
it('hashes and extracts in a child and waits for its completed output', async () => {
  const fixture = await archive('file.txt');
  expect(await artifactWorker('hash', fixture.file)).toBe(
    createHash('sha256').update(fixture.bytes).digest('hex'),
  );
  await artifactWorker('extract', fixture.file, fixture.destination);
  expect(
    await readFile(path.join(fixture.destination, 'file.txt'), 'utf8'),
  ).toBe('test');
});
it.each(['../escape', '/absolute', '.nocobase-artifact.json'])(
  'rejects unsafe or reserved path %s without an uncaught stream error',
  async (name) => {
    const fixture = await archive(name);
    await expect(
      artifactWorker('extract', fixture.file, fixture.destination),
    ).rejects.toThrow(/unsafe|reserved/);
    await expect(
      readFile(path.join(fixture.dir, 'escape')),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  },
);
it('returns corruption and child failures to the caller', async () => {
  const fixture = await archive('file.txt');
  await writeFile(fixture.file, 'not gzip');
  await expect(
    artifactWorker('extract', fixture.file, fixture.destination),
  ).rejects.toThrow();
  await expect(
    artifactWorker('hash', fixture.file + '.missing'),
  ).rejects.toThrow(/ENOENT/);
});

it.each(['hash', 'extract'] as const)(
  'times out a stalled %s worker before advancing the archive queue',
  async (mode) => {
    const fixture = await archive('file.txt');
    const actual =
      await vi.importActual<typeof import('node:child_process')>(
        'node:child_process',
      );
    let child!: ReturnType<typeof fork>;
    const ready = Promise.withResolvers<void>();
    vi.mocked(fork).mockImplementationOnce((_worker, args, options) => {
      child = actual.fork(
        new URL('./fixtures/stalled-artifact-worker.mjs', import.meta.url),
        args,
        options,
      );
      child.once('message', () => ready.resolve());
      return child;
    });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const work = artifactWorker(mode, fixture.file, fixture.destination);
    const rejected = work.catch((error: unknown) => error);
    await ready.promise;
    const next = artifactWorker('hash', fixture.file);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(child.signalCode).toBeNull();
    expect(vi.mocked(fork)).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);
    vi.useRealTimers();
    expect(await rejected).toMatchObject({
      message: `Artifact worker ${mode} timed out after 120000 ms`,
    });
    expect(child.signalCode).toBe('SIGKILL');
    expect(() => process.kill(child.pid!, 0)).toThrow();
    expect(await next).toBe(
      createHash('sha256').update(fixture.bytes).digest('hex'),
    );
  },
);

it('cancels queued work without spawning it and waits for running cancellation to close', async () => {
  const fixture = await archive('file.txt');
  const actual =
    await vi.importActual<typeof import('node:child_process')>(
      'node:child_process',
    );
  let child!: ReturnType<typeof fork>;
  const ready = Promise.withResolvers<void>();
  vi.mocked(fork).mockImplementationOnce((_worker, args, options) => {
    child = actual.fork(
      new URL('./fixtures/stalled-artifact-worker.mjs', import.meta.url),
      args,
      options,
    );
    child.once('message', () => ready.resolve());
    return child;
  });
  const running = new AbortController();
  const work = artifactWorker('extract', fixture.file, fixture.destination, {
    signal: running.signal,
  });
  const failure = work.catch((error: unknown) => error);
  await ready.promise;
  const queued = new AbortController();
  const skipped = artifactWorker('hash', fixture.file, undefined, {
    signal: queued.signal,
  });
  const skippedFailure = skipped.catch((error: unknown) => error);
  queued.abort(new Error('cancel queued'));
  expect(await skippedFailure).toMatchObject({ message: 'cancel queued' });
  expect(vi.mocked(fork)).toHaveBeenCalledTimes(1);
  running.abort(new Error('cancel running'));
  expect(await failure).toMatchObject({ message: 'cancel running' });
  expect(child.signalCode).toBe('SIGKILL');
  expect(() => process.kill(child.pid!, 0)).toThrow();
  await artifactWorker('hash', fixture.file);
  expect(vi.mocked(fork)).toHaveBeenCalledTimes(2);
});

it('releases the queue after a spawn failure or abnormal exit without a result', async () => {
  const fixture = await archive('file.txt');
  const actual =
    await vi.importActual<typeof import('node:child_process')>(
      'node:child_process',
    );
  vi.mocked(fork).mockImplementationOnce((_worker, _args, options) =>
    actual.fork(
      new URL('./fixtures/stalled-artifact-worker.mjs', import.meta.url),
      [],
      { ...options, execPath: '/missing-artifact-node' },
    ),
  );
  await expect(artifactWorker('hash', fixture.file)).rejects.toThrow('ENOENT');
  vi.mocked(fork).mockImplementationOnce((_worker, _args, options) =>
    actual.fork(
      new URL('./fixtures/stalled-artifact-worker.mjs', import.meta.url),
      [],
      { ...options, execArgv: ['--eval', 'process.exit(7)'] },
    ),
  );
  await expect(artifactWorker('hash', fixture.file)).rejects.toThrow('code 7');
  await artifactWorker('hash', fixture.file);
});
