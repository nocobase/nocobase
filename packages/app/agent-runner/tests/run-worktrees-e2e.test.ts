// The real daemon and isolated workers, with a deterministic tool and local Git remote.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  git,
  makeRemote,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  writeFakeCli,
} from './helpers.ts';

it('starts an unmarked writer alongside another, cancels and restores both unpublished changes', async () => {
  const server = new FakeServer();
  await server.listen();
  const root = tempDir('parallel-worktrees-');
  const home = path.join(root, 'home');
  const env = cliEnv(home);
  const remote = makeRemote(root);
  const fakeCli = writeFakeCli(root);
  await registerRunner(server.url, env, [
    '--slots',
    '2',
    '--cli',
    `appcli=${fakeCli}`,
  ]);
  const workspace = {
    dirs: [
      {
        kind: 'repo' as const,
        url: remote,
        defaultBranch: 'main',
        branch: 'agent/PM-300',
        path: 'repo',
      },
    ],
    env: [],
  };
  const subject = { key: 'PM-300', url: 'http://app.test/PM-300' };
  const a = server.enqueue({
    subject,
    workspace,
    prompt: {
      system: '',
      session: 'fresh',
      turn: 'write cancelled.txt preserved\nhang',
    },
  });
  const daemon = startDaemon(env);
  try {
    await waitFor(
      () =>
        a.status === 'running' &&
        existsSync(
          path.join(String(a.start?.workDir), 'repo', 'cancelled.txt'),
        ),
      30_000,
      'first writer',
    );
    const b = server.enqueue({
      subject,
      workspace,
      prompt: {
        system: '',
        session: 'fresh',
        turn: 'write parallel.txt parallel\nsay second finished',
      },
    });
    await waitFor(
      () => b.status === 'completed' || b.status === 'failed',
      30_000,
      'unmarked concurrent writer',
    );
    expect(b.fail).toBeUndefined();
    expect(b.status).toBe('completed');
    expect(a.status).toBe('running');
    expect(a.start?.workDir).not.toBe(b.start?.workDir);
    server.cancel(a.payload.run.id);
    await waitFor(
      () => a.status === 'cancelled',
      20_000,
      'cancellation acknowledgement',
    );
    await waitFor(
      () => !existsSync(String(a.start?.workDir)),
      15_000,
      'cancelled worktree removal',
    );
    const c = server.enqueue({
      subject,
      workspace,
      prompt: {
        system: '',
        session: 'fresh',
        turn: 'read cancelled.txt\nread parallel.txt\nsay resumed',
      },
    });
    await waitFor(
      () => c.status === 'completed' || c.status === 'failed',
      30_000,
      'continuation',
    );
    expect(c.fail).toBeUndefined();
    const output = server
      .events(c.payload.run.id)
      .filter((event) => event.type === 'toolResult')
      .map((event) => event.output)
      .join(' ');
    expect(output).toContain('preserved');
    expect(output).toContain('parallel');
    // Auto-save itself never pushed. The third successful run may ordinarily publish continuation commits.
    expect(b.complete?.repos?.[0]?.pushed).toBe(false);
    expect(
      git(
        ['show', 'refs/heads/agent/PM-300:cancelled.txt'],
        remote.replace('file://', ''),
      ),
    ).toBe('preserved');
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(root);
  }
}, 150_000);
