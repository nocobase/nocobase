// The real daemon and isolated workers, with a deterministic tool and local Git remote.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { runTempName, runTempRoot } from '../src/core/run-temp.ts';
import { runnerPaths } from '../src/lib/home.ts';
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

it('starts an unmarked writer alongside another, cancels, resumes one head and retains the parallel head for manual integration', async () => {
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
    git: { author: { name: 'Test', email: 'test@example.com' } },
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
    const cache = git(
      ['rev-parse', '--git-common-dir'],
      path.join(String(a.start?.workDir), 'repo'),
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
        turn: 'read parallel.txt\nsay resumed',
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
    expect(output).toContain('parallel');
    const savedRef = git(
      ['for-each-ref', '--format=%(refname)', 'refs/runner/saved/'],
      cache,
    );
    expect(savedRef).not.toBe('');
    expect(git(['show', `${savedRef}:cancelled.txt`], cache)).toBe('preserved');
    // The first completed parallel head owns resume. Cancelled changes remain reachable in saved.
    expect(b.complete?.repos?.[0]?.pushed).toBe(false);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/PM-300'],
        remote.replace('file://', ''),
      ),
    ).toBe('refs/heads/agent/PM-300');
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(root);
  }
}, 150_000);

it('reports missing identity in the cancellation result and retains uncommitted work', async () => {
  const server = new FakeServer();
  await server.listen();
  const root = tempDir('missing-save-identity-');
  const home = path.join(root, 'home');
  const env = cliEnv(home);
  const remote = makeRemote(root);
  await registerRunner(server.url, env, [
    '--cli',
    `appcli=${writeFakeCli(root)}`,
  ]);
  const run = server.enqueue({
    subject: { key: 'identity', url: 'http://app.test/identity' },
    workspace: {
      dirs: [
        {
          kind: 'repo',
          url: remote,
          path: 'repo',
          branch: 'agent/identity',
          defaultBranch: 'main',
        },
      ],
      env: [],
      git: { author: { name: 'Test', email: 'test@example.com' } },
    },
    prompt: {
      system: '',
      session: 'fresh',
      turn: 'bash git config --worktree user.email ""\nwrite pending.txt retained\nhang',
    },
  });
  const daemon = startDaemon(env);
  try {
    await waitFor(
      () =>
        existsSync(
          path.join(String(run.start?.workDir), 'repo', 'pending.txt'),
        ),
      30_000,
      'pending work',
    );
    const repo = path.join(String(run.start?.workDir), 'repo');
    const head = git(['rev-parse', 'HEAD'], repo);
    server.cancel(run.payload.run.id);
    await waitFor(
      () => run.status === 'cancelled',
      30_000,
      'cancellation report',
    );
    const cancellation = server
      .events(run.payload.run.id)
      .find(
        (event) =>
          event.type === 'status' && event.meta?.status === 'cancelled',
      );
    expect(JSON.stringify(cancellation)).toContain(
      'configure valid user.name and user.email',
    );
    expect(JSON.stringify(cancellation)).toContain('Recovery required');
    expect(git(['rev-parse', 'HEAD'], repo)).toBe(head);
    expect(existsSync(path.join(repo, 'pending.txt'))).toBe(true);
    expect(
      git(['for-each-ref', '--format=%(refname)', 'refs/runner/'], repo),
    ).toBe('');
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(root);
  }
}, 120_000);

it.each(['completed', 'failed', 'cancelled'] as const)(
  'resumes unpublished files after a %s run on the same machine',
  async (ending) => {
    const server = new FakeServer();
    await server.listen();
    const root = tempDir('ending-continuation-');
    const home = path.join(root, 'home');
    const config = path.join(root, 'host.gitconfig');
    writeFileSync(
      config,
      '[user]\nname = Host User\nemail = host@example.com\n',
    );
    const env = cliEnv(home, {
      GIT_CONFIG_GLOBAL: config,
      GIT_CONFIG_NOSYSTEM: '1',
    });
    const remote = makeRemote(root);
    await registerRunner(server.url, env, [
      '--cli',
      `appcli=${writeFakeCli(root)}`,
    ]);
    const workspace = {
      dirs: [
        {
          kind: 'repo' as const,
          url: remote,
          path: 'repo',
          branch: 'agent/continuation',
          defaultBranch: 'main',
        },
      ],
      env: [],
      git: { author: { name: 'Test', email: 'test@example.com' } },
    };
    const subject = {
      key: 'continuation',
      url: 'http://app.test/continuation',
    };
    const tail =
      ending === 'completed'
        ? 'say done'
        : ending === 'failed'
          ? 'fail toolProcess expected failure'
          : 'hang';
    const first = server.enqueue({
      subject,
      workspace,
      prompt: {
        system: '',
        session: 'fresh',
        turn: `write pending.txt ${ending}\n${tail}`,
      },
    });
    const daemon = startDaemon(env);
    try {
      await waitFor(
        () =>
          existsSync(
            path.join(String(first.start?.workDir), 'repo', 'pending.txt'),
          ),
        30_000,
        'uncommitted file',
      );
      if (ending === 'cancelled') server.cancel(first.payload.run.id);
      await waitFor(
        () =>
          first.status === ending && !existsSync(String(first.start?.workDir)),
        30_000,
        'saved and removed first attempt',
      );
      const tmp = path.join(
        await runTempRoot(runnerPaths(home)),
        runTempName(String(first.start?.workDir)),
      );
      await waitFor(
        () => !existsSync(tmp),
        5_000,
        'temporary directory removal',
      );
      expect(
        git(
          [
            'for-each-ref',
            '--format=%(refname)',
            'refs/heads/agent/continuation',
          ],
          remote.replace('file://', ''),
        ),
      ).toBe('');
      const next = server.enqueue({
        subject,
        workspace,
        prompt: {
          system: '',
          session: 'fresh',
          turn: 'read pending.txt\nwrite continued.txt resumed\nbash git add .\nbash git -c commit.gpgsign=false commit -m "Continue pending work"\nbash git push origin HEAD:refs/heads/agent/continuation\nsay resumed',
        },
      });
      await waitFor(
        () => next.status === 'completed' || next.status === 'failed',
        30_000,
        'resumed attempt',
      );
      expect(next.fail).toBeUndefined();
      expect(next.start?.workDir).not.toBe(first.start?.workDir);
      expect(
        server
          .events(next.payload.run.id)
          .filter((event) => event.type === 'toolResult')
          .map((event) => event.output)
          .join(' '),
      ).toContain(ending);
      const history = git(
        [
          'log',
          'refs/heads/agent/continuation',
          '--format=%an <%ae>|%cn <%ce>',
        ],
        remote.replace('file://', ''),
      );
      expect(history.split('\n')).toEqual(
        Array(3).fill('Test <test@example.com>|Test <test@example.com>'),
      );
      const messages = git(
        ['log', 'refs/heads/agent/continuation', '--format=%B'],
        remote.replace('file://', ''),
      );
      expect(messages).toContain('Update pending.txt');
      expect(messages).toContain('work in progress');
      expect(messages).not.toMatch(
        /runner@nocobase.local|co-authored-by:|signed-off-by:|save local continuation/iu,
      );
    } finally {
      await stopDaemon(daemon);
      await server.close();
      removeDir(home);
      removeDir(workRootOf(home));
      removeDir(root);
    }
  },
  90_000,
);

it('preserves a switched branch and stash across real worker completion and a second run', async () => {
  const server = new FakeServer();
  await server.listen();
  const root = tempDir('switched-worktree-');
  const home = path.join(root, 'home');
  const env = cliEnv(home);
  const remote = makeRemote(root);
  await registerRunner(server.url, env, [
    '--cli',
    `appcli=${writeFakeCli(root)}`,
  ]);
  const workspace = {
    dirs: [
      {
        kind: 'repo' as const,
        url: remote,
        path: 'repo',
        branch: 'agent/start',
        defaultBranch: 'main',
      },
    ],
    env: [],
    git: { author: { name: 'Test', email: 'test@example.com' } },
  };
  const subject = { key: 'PM-SWITCH', url: 'http://app.test/PM-SWITCH' };
  const run = server.enqueue({
    subject,
    workspace,
    prompt: {
      system: '',
      session: 'fresh',
      turn: 'bash git checkout -b fix/worker-branch\nwrite committed.txt branch-content\nbash git add .\nbash git -c user.name=A -c user.email=a@example.com commit -m work\nwrite stash.txt stash-content\nbash git -c user.name=A -c user.email=a@example.com stash push --include-untracked\nwrite pending.txt saved-content\nsay finished',
    },
  });
  const daemon = startDaemon(env);
  try {
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      30_000,
      'switched branch completion',
    );
    expect(run.fail).toBeUndefined();
    expect(run.status).toBe('completed');
    await waitFor(
      () => !existsSync(String(run.start?.workDir)),
      15_000,
      'switched worktree removal',
    );
    const caches = path.join(home, 'repos');
    const cache = path.join(
      caches,
      readdirSync(caches).find((name) => name.endsWith('.git'))!,
    );
    expect(git(['show', 'fix/worker-branch:pending.txt'], cache)).toBe(
      'saved-content',
    );
    const stash = git(['rev-parse', 'refs/stash'], cache);
    const next = server.enqueue({
      subject,
      workspace,
      prompt: {
        system: '',
        session: 'fresh',
        turn: 'bash git checkout fix/worker-branch\nread committed.txt\nread pending.txt\nbash git stash apply\nread stash.txt\nsay finished',
      },
    });
    await waitFor(
      () => next.status === 'completed' || next.status === 'failed',
      30_000,
      'second branch run',
    );
    expect(next.fail).toBeUndefined();
    expect(next.status).toBe('completed');
    const output = server
      .events(next.payload.run.id)
      .filter((event) => event.type === 'toolResult')
      .map((event) => event.output)
      .join(' ');
    expect(output).toContain('branch-content');
    expect(output).toContain('saved-content');
    expect(output).toContain('stash-content');
    expect(git(['rev-parse', 'refs/stash'], cache)).toBe(stash);
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/start'],
        remote.replace('file://', ''),
      ),
    ).toBe('');
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(root);
  }
}, 90_000);

it('keeps a failed directory and includes its path in the existing failure detail', async () => {
  const server = new FakeServer();
  await server.listen();
  const root = tempDir('failed-directory-');
  const home = path.join(root, 'home');
  const env = cliEnv(home);
  const remote = makeRemote(root);
  await registerRunner(server.url, env, [
    '--cli',
    `appcli=${writeFakeCli(root)}`,
  ]);
  const run = server.enqueue({
    workspace: {
      dirs: [
        {
          kind: 'repo',
          url: remote,
          path: 'repo',
          branch: 'agent/retention',
          defaultBranch: 'main',
        },
      ],
      env: [],
      git: { author: { name: 'Test', email: 'test@example.com' } },
    },
    prompt: {
      system: '',
      session: 'fresh',
      turn: 'bash git checkout --detach\nbash git update-ref refs/runner/saved HEAD\nwrite pending.txt retained\nfail toolProcess expected failure',
    },
  });
  const daemon = startDaemon(env);
  try {
    await waitFor(() => run.status === 'failed', 30_000, 'failed run');
    const workDir = String(run.start?.workDir);
    const repo = path.join(workDir, 'repo');
    expect(run.fail?.detail).toContain(repo);
    expect(run.fail?.detail).toContain('cannot lock ref');
    expect(existsSync(path.join(repo, 'pending.txt'))).toBe(true);
    expect(git(['rev-parse', '--abbrev-ref', 'HEAD'], repo)).toBe('HEAD');
    // Final cleanup and daemon exit must also keep the failed directory.
    await stopDaemon(daemon);
    expect(existsSync(repo)).toBe(true);
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(root);
  }
}, 60_000);

it('keeps Codex HOME outside attempt worktrees and isolates thread homes', async () => {
  const server = new FakeServer();
  await server.listen();
  const root = tempDir('codex-home-worktree-');
  const home = path.join(root, 'home');
  const env = cliEnv(home, {
    CODEX_HOME: path.join(root, 'synthetic-host-codex'),
  });
  const remote = makeRemote(root);
  await registerRunner(server.url, env, [
    '--cli',
    `appcli=${writeFakeCli(root)}`,
  ]);
  const dirs = [
    {
      kind: 'repo' as const,
      url: remote,
      path: 'repo',
      branch: 'agent/codex-state',
      defaultBranch: 'main',
    },
  ];
  const subject = { key: 'codex-state', url: 'http://app.test/codex-state' };
  const enqueue = (scope: string, turn: string, resumeSessionId?: string) =>
    server.enqueue({
      tool: {
        kind: 'codex',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: [],
          deniedPatterns: [],
          idleTimeoutMs: 30_000,
        },
      },
      subject,
      workspace: { dirs, env: [], sessionScope: scope },
      prompt: {
        system: '',
        session: resumeSessionId ? 'resume' : 'fresh',
        ...(resumeSessionId ? { resumeSessionId } : {}),
        turn,
      },
    });
  const output = (id: string) =>
    server
      .events(id)
      .filter((event) => event.type === 'toolResult')
      .map((event) => String(event.output))
      .join('\n');
  const first = enqueue(
    'thread-a',
    'bash printf remembered > "$CODEX_HOME/marker"\nbash printf "home:%s" "$CODEX_HOME"\nbash pwd',
  );
  const daemon = startDaemon(env);
  try {
    await waitFor(
      () => first.status === 'completed' || first.status === 'failed',
      30_000,
      'first Codex attempt',
    );
    expect(first.fail).toBeUndefined();
    expect(first.status).toBe('completed');
    await waitFor(
      () => !existsSync(String(first.start?.workDir)),
      10_000,
      'removed first worktree',
    );
    const externalHome = /home:([^\n]+)/u.exec(
      output(first.payload.run.id),
    )?.[1];
    expect(externalHome).toBeDefined();
    expect(externalHome!.startsWith(`${first.start?.workDir}/`)).toBe(false);
    expect(existsSync(path.join(externalHome!, 'marker'))).toBe(true);
    expect(output(first.payload.run.id)).toContain(
      path.join(String(first.start?.workDir), 'repo'),
    );
    const second = enqueue(
      'thread-a',
      'bash cat "$CODEX_HOME/marker"\nbash printf "home:%s" "$CODEX_HOME"',
      first.complete?.sessionId,
    );
    await waitFor(
      () => second.status === 'completed',
      30_000,
      'same-thread Codex attempt',
    );
    expect(output(second.payload.run.id)).toContain('remembered');
    expect(output(second.payload.run.id)).toContain(`home:${externalHome}`);
    expect(second.complete?.sessionId).toBe(first.complete?.sessionId);
    const other = enqueue(
      'thread-b',
      'bash test ! -f "$CODEX_HOME/marker" && printf isolated\nbash printf "home:%s" "$CODEX_HOME"',
    );
    await waitFor(
      () => other.status === 'completed',
      30_000,
      'different-thread Codex attempt',
    );
    expect(output(other.payload.run.id)).toContain('isolated');
    expect(output(other.payload.run.id)).not.toContain(`home:${externalHome}`);
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(root);
  }
}, 120_000);
