import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { dirsStep } from '../src/agent/prepare/dirs.ts';
import { workspaceStep } from '../src/agent/prepare/workspace.ts';
import type { PrepareContext } from '../src/agent/prepare/types.ts';
import type { SpoolEvent } from '../src/core/events.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir } from './helpers.ts';

// Isolate phase reporting from Git transport while exercising workspace reuse and cleanup.
vi.mock('../src/core/checkout.ts', async (original) => ({
  ...(await original<typeof import('../src/core/checkout.ts')>()),
  prepareDirs: async (options: { workDir: string }) => {
    const dir = path.join(options.workDir, 'repo');
    mkdirSync(dir, { recursive: true });
    // A linked worktree's .git is a file, not a directory.
    writeFileSync(path.join(dir, '.git'), 'gitdir: /test/cache/worktrees/repo');
    return {
      dirs: [{ kind: 'repo', dir, fresh: true, primary: true }],
      release: async () => {},
    };
  },
}));

let root: string;
beforeEach(() => {
  root = tempDir('dirs-phase-');
});
afterEach(() => removeDir(root));

it('reports preparation for first checkout, another runner and lost or cleaned workspaces, but not reuse', async () => {
  const remote = 'https://example.test/repo.git';
  async function run(machine: string, clean = false) {
    const events: SpoolEvent[] = [];
    const releases: (() => Promise<void>)[] = [];
    const context = {
      payload: {
        run: { id: 'run', attempt: 1 },
        subject: { key: 'conversation' },
        workspace: {
          clean,
          dirs: [
            {
              kind: 'repo',
              path: 'repo',
              url: remote,
              branch: 'chat/conversation',
              defaultBranch: 'main',
            },
          ],
        },
      },
      paths: runnerPaths(
        path.join(root, machine, 'home'),
        path.join(root, machine, 'work'),
      ),
      registration: { key: 'app' },
      log: () => {},
      event: (event: SpoolEvent) => events.push(event),
      onRelease: (release: () => Promise<void>) => releases.push(release),
      dirs: [],
    } as unknown as PrepareContext;
    try {
      await workspaceStep.run(context);
      await dirsStep.run(context);
      return { events, workDir: context.workspace!.workDir };
    } finally {
      for (const release of releases.reverse()) await release();
    }
  }
  const first = await run('one');
  const preparing = {
    type: 'status',
    content: 'preparing',
    meta: { phase: 'dirs' },
  };
  expect(first.events).toMatchObject([preparing, { type: 'checkout' }]);
  // Initialization remains unconfirmed: checkout.fresh is still true on reuse.
  const reused = await run('one');
  expect(reused.events).toMatchObject([
    { type: 'checkout', meta: { fresh: true } },
  ]);
  expect((await run('two')).events).toMatchObject([
    preparing,
    { type: 'checkout' },
  ]);
  rmSync(first.workDir, { recursive: true, force: true });
  expect((await run('one')).events).toMatchObject([
    preparing,
    { type: 'checkout' },
  ]);
  expect((await run('one', true)).events).toMatchObject([
    preparing,
    { type: 'checkout' },
  ]);
});
