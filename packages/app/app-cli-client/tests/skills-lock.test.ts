import { fork, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { mkdir, rmdir, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { withSkillLock } from '../src/skills-lock.ts';
import { removeDir, tempDir } from './helpers.ts';

vi.mock('node:fs/promises', async (original) => {
  const fs = await original<typeof import('node:fs/promises')>();
  return {
    ...fs,
    mkdir: vi.fn(fs.mkdir),
    rmdir: vi.fn(fs.rmdir),
    unlink: vi.fn(fs.unlink),
  };
});
const scratch = tempDir('skill-lock-');
let sequence = 0;
const children = new Set<ChildProcess>();
afterAll(() => removeDir(scratch));
afterEach(async () => {
  vi.mocked(mkdir).mockReset();
  vi.mocked(rmdir).mockReset();
  vi.mocked(unlink).mockReset();
  vi.restoreAllMocks();
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGKILL');
      await exited;
    }
  }
  children.clear();
});
function fixture(): string {
  return path.join(scratch, String(sequence++), '.skills.lock');
}
function gate(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function owner(file: string, pid: number, hostname = os.hostname()): string {
  mkdirSync(file, { recursive: true });
  const marker = path.join(file, `owner-${randomUUID()}.json`);
  writeFileSync(
    marker,
    JSON.stringify({ pid, hostname, startedAt: new Date().toISOString() }),
  );
  return marker;
}
async function holder(file: string): Promise<ChildProcess> {
  const child = fork(
    fileURLToPath(new URL('./fixtures/skill-lock-holder.mjs', import.meta.url)),
    [file],
    { execArgv: [], stdio: ['ignore', 'ignore', 'inherit', 'ipc'] },
  );
  children.add(child);
  await once(child, 'message');
  return child;
}
async function deadPid(): Promise<number> {
  const file = fixture();
  const child = await holder(file);
  const exited = once(child, 'exit');
  child.send('release');
  await exited;
  return child.pid!;
}

describe('Skill lock ownership and recovery', () => {
  it('serializes simultaneous and rapidly consecutive operations', async () => {
    const file = fixture();
    let active = 0;
    let peak = 0;
    let completed = 0;
    const work = () =>
      withSkillLock(file, async () => {
        peak = Math.max(peak, ++active);
        await Promise.resolve();
        completed++;
        active--;
      });
    await Promise.all(Array.from({ length: 5 }, work));
    for (let i = 0; i < 5; i++) await work();
    expect(peak).toBe(1);
    expect(completed).toBe(10);
    expect(existsSync(file)).toBe(false);
  });

  it('waits for a live process to release its lock', async () => {
    const file = fixture();
    const child = await holder(file);
    const inspected = gate();
    const signal = vi.spyOn(process, 'kill');
    signal.mockImplementation((pid, value) => {
      inspected.resolve();
      return Reflect.apply(originalKill, process, [pid, value]);
    });
    const pending = withSkillLock(file, async () => 'ready');
    await inspected.promise;
    expect(existsSync(file)).toBe(true);
    const exited = once(child, 'exit');
    child.send('release');
    await exited;
    await expect(pending).resolves.toBe('ready');
  });

  it('recovers an interrupted child process without a manual directory removal', async () => {
    const file = fixture();
    const child = await holder(file);
    const exited = once(child, 'exit');
    child.kill('SIGKILL');
    await exited;
    await expect(withSkillLock(file, async () => 'recovered')).resolves.toBe(
      'recovered',
    );
    expect(existsSync(file)).toBe(false);
  });

  it('times out with the live owner and a recovery action while preserving the record', async () => {
    const file = fixture();
    const marker = owner(file, process.pid);
    const before = readFileSync(marker, 'utf8');
    await expect(
      withSkillLock(file, async () => undefined, 0),
    ).rejects.toMatchObject({
      code: 'SKILLS_BUSY',
      exit: 6,
      message: expect.stringContaining(`Process ${process.pid}`),
    });
    expect(readFileSync(marker, 'utf8')).toBe(before);
  });

  it.each(['foreign', 'invalid', 'permission'])(
    'preserves an unverifiable %s owner',
    async (kind) => {
      const file = fixture();
      const marker = owner(
        file,
        process.pid,
        kind === 'foreign' ? 'another-host' : os.hostname(),
      );
      if (kind === 'invalid') writeFileSync(marker, '{');
      if (kind === 'permission')
        vi.spyOn(process, 'kill').mockImplementation(() => {
          throw Object.assign(new Error('Permission denied'), {
            code: 'EPERM',
          });
        });
      await expect(
        withSkillLock(file, async () => undefined, 0),
      ).rejects.toMatchObject({ code: 'SKILLS_BUSY' });
      expect(existsSync(marker)).toBe(true);
    },
  );

  it.each([0, 11 * 60_000])(
    'preserves an unowned directory aged %s ms with actionable recovery',
    async (age) => {
      const file = fixture();
      mkdirSync(file, { recursive: true });
      const time = new Date(Date.now() - age);
      utimesSync(file, time, time);
      await expect(
        withSkillLock(file, async () => undefined, 0),
      ).rejects.toMatchObject({
        code: 'SKILLS_BUSY',
        message: expect.stringContaining('file manager'),
      });
      expect(existsSync(file)).toBe(true);
      expect(readdirSync(file)).toEqual([]);
    },
  );

  it('propagates work errors once and releases the lock', async () => {
    const file = fixture();
    const error = Object.assign(new Error('Missing target'), {
      code: 'ENOENT',
    });
    const work = vi.fn().mockRejectedValue(error);
    await expect(withSkillLock(file, work)).rejects.toBe(error);
    expect(work).toHaveBeenCalledTimes(1);
    expect(existsSync(file)).toBe(false);
  });

  it('does not let a delayed second reaper remove a new owner', async () => {
    const file = fixture();
    owner(file, await deadPid());
    const paused = gate();
    const resume = gate();
    const held = gate();
    const release = gate();
    const fs =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    let first = true;
    vi.mocked(unlink).mockImplementation(async (marker) => {
      if (first && String(marker).startsWith(file)) {
        first = false;
        paused.resolve();
        await resume.promise;
      }
      return fs.unlink(marker);
    });
    const slow = withSkillLock(file, async () => undefined);
    await paused.promise;
    const fresh = withSkillLock(file, async () => {
      held.resolve();
      await release.promise;
    });
    await held.promise;
    const records = readdirSync(file);
    resume.resolve();
    // The stale unlink completes before the next retry and must not remove
    // the differently named current record.
    await vi.waitFor(() =>
      expect(
        vi
          .mocked(unlink)
          .mock.settledResults.some((result) => result.type === 'rejected'),
      ).toBe(true),
    );
    expect(readdirSync(file)).toEqual(records);
    release.resolve();
    await Promise.all([slow, fresh]);
  });

  it('a delayed empty-directory removal cannot delete a published active owner', async () => {
    const file = fixture();
    const pid = await deadPid();
    owner(file, pid);
    owner(file, pid);
    const paused = gate();
    const resume = gate();
    const held = gate();
    const release = gate();
    const fs =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    let first = true;
    vi.mocked(rmdir).mockImplementation(async (...args) => {
      if (first && args[0] === file) {
        first = false;
        paused.resolve();
        await resume.promise;
      }
      return fs.rmdir(...args);
    });
    const slow = withSkillLock(file, async () => undefined);
    await paused.promise;
    const fresh = withSkillLock(file, async () => {
      held.resolve();
      await release.promise;
    });
    await held.promise;
    const records = readdirSync(file);
    resume.resolve();
    await vi.waitFor(() =>
      expect(
        vi
          .mocked(rmdir)
          .mock.settledResults.some(
            (result) =>
              result.type === 'rejected' &&
              (result.value as NodeJS.ErrnoException).code === 'ENOTEMPTY',
          ),
      ).toBe(true),
    );
    expect(readdirSync(file)).toEqual(records);
    release.resolve();
    await Promise.all([slow, fresh]);
  });

  it('withdraws a delayed initializer that published into a later active directory', async () => {
    const file = fixture();
    const paused = gate();
    const resume = gate();
    const held = gate();
    const release = gate();
    const fs =
      await vi.importActual<typeof import('node:fs/promises')>(
        'node:fs/promises',
      );
    let first = true;
    vi.mocked(mkdir).mockImplementation(
      async (...args: Parameters<typeof mkdir>) => {
        const result = await fs.mkdir(...args);
        if (first && args[0] === file) {
          first = false;
          paused.resolve();
          await resume.promise;
        }
        return result;
      },
    );
    let active = false;
    const slow = withSkillLock(file, async () => {
      expect(active).toBe(false);
    });
    await paused.promise;
    // Model a previously scheduled rmdir completing in the publication gap.
    rmdirSync(file);
    const fresh = withSkillLock(file, async () => {
      active = true;
      held.resolve();
      await release.promise;
      active = false;
    });
    await held.promise;
    const records = readdirSync(file);
    resume.resolve();
    await vi.waitFor(() => expect(vi.mocked(unlink)).toHaveBeenCalled());
    expect(readdirSync(file)).toEqual(records);
    release.resolve();
    await Promise.all([slow, fresh]);
  });
});

const originalKill = process.kill;
