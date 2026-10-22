import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { PrepareError, stepFailure } from '../src/agent/prepare/index.ts';
import {
  acquireLock,
  CACHE_LOCK_WAIT_TIMEOUT_MS,
  lockCache,
  WorkspaceBusyError,
} from '../src/core/checkout.ts';
import {
  waitForWorkspaceCleanup,
  WORKSPACE_CLEANUP_WAIT_TIMEOUT_MS,
} from '../src/core/workspace-use.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir } from './helpers.ts';

const step = { failure: 'checkoutFailed' as const };

describe('stepFailure', () => {
  it('maps cleanup and cache lock timeouts to the retryable workspaceBusy reason', async () => {
    const root = tempDir('prepare-lock-timeout-');
    const paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const releases: Array<() => Promise<void>> = [];
    try {
      expect(WORKSPACE_CLEANUP_WAIT_TIMEOUT_MS).toBe(120_000);
      expect(CACHE_LOCK_WAIT_TIMEOUT_MS).toBe(120_000);

      const workDir = path.join(root, 'task');
      const cleanupLock = await acquireLock(`${workDir}.lock`);
      releases.push(() => cleanupLock.release());
      const cleanupFailure = await waitForWorkspaceCleanup(workDir, {
        timeoutMs: 0,
        pollMs: 0,
      }).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(cleanupFailure).toBeInstanceOf(WorkspaceBusyError);
      expect(stepFailure(step, cleanupFailure, ['workspaceBusy'])).toBe(
        'workspaceBusy',
      );

      const cache = path.join(paths.reposDir, 'project.git');
      const cacheLock = await acquireLock(`${cache}.lock`);
      releases.push(() => cacheLock.release());
      const cacheFailure = await lockCache(cache, {
        timeoutMs: 0,
        pollMs: 0,
      }).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(cacheFailure).toBeInstanceOf(WorkspaceBusyError);
      expect(stepFailure(step, cacheFailure, ['workspaceBusy'])).toBe(
        'workspaceBusy',
      );
    } finally {
      await Promise.all(releases.map((release) => release()));
      removeDir(root);
    }
  });
  it('reports a lock another process holds as workspaceBusy when the application accepts it', () => {
    const busy = new WorkspaceBusyError('/work/x.lock is held by process 42');
    expect(stepFailure(step, busy, ['workspaceBusy'])).toBe('workspaceBusy');
    expect(
      stepFailure({ failure: 'setupFailed' }, busy, ['workspaceBusy']),
    ).toBe('workspaceBusy');
  });

  it('falls back to the announced fallback for an application that does not accept it', () => {
    const busy = new WorkspaceBusyError('/work/x.lock is held by process 42');
    expect(stepFailure(step, busy, [])).not.toBe('workspaceBusy');
  });

  it("keeps a PrepareError's own reason and the step's failure otherwise", () => {
    expect(
      stepFailure(step, new PrepareError('repoAccessDenied', 'no'), []),
    ).toBe('repoAccessDenied');
    expect(stepFailure(step, new Error('boom'), ['workspaceBusy'])).toBe(
      'checkoutFailed',
    );
  });
});
