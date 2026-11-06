// The real daemon and isolated workers, with a deterministic tool and local Git remote.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
    expect(existsSync(String(run.start?.workDir))).toBe(true);
    const caches = path.join(home, 'repos');
    const cache = path.join(
      caches,
      readdirSync(caches).find((name) => name.endsWith('.git'))!,
    );
    expect(
      readFileSync(
        path.join(String(run.start?.workDir), 'repo/pending.txt'),
        'utf8',
      ),
    ).toBe('saved-content');
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
    expect(existsSync(String(first.start?.workDir))).toBe(true);
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
