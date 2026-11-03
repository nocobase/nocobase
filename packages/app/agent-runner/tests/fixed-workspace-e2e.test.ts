// Real daemon, worker processes and Git; deterministic adapters avoid external model credentials.
import { existsSync, readFileSync } from 'node:fs';
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
  writeFakeCli,
} from './helpers.ts';

it('shares a fixed directory across tools and read-only runs, isolates cancellation, and resumes Claude on the same path', async () => {
  const server = new FakeServer();
  server.capacity = { slots: 3, toolSlots: {} };
  await server.listen();
  const root = tempDir('fixed-workers-');
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
        branch: 'agent/shared',
        defaultBranch: 'main',
        path: 'repo',
        initPrompt: 'INITIALIZE_FIXED_WORKSPACE',
      },
    ],
    env: [],
  };
  const subject = { key: 'shared', url: 'http://app.test/shared' };
  const enqueue = (turn: string, extra = {}) =>
    server.enqueue({
      subject,
      workspace,
      prompt: {
        system: '{{runner.workspaceInit}}\n{{runner.workspaceNotes}}',
        session: 'fresh',
        turn,
      },
      ...extra,
    });
  const a = enqueue('write a.txt retained\nhang');
  const daemon = startDaemon(env);
  try {
    await waitFor(
      () =>
        a.status === 'running' &&
        existsSync(path.join(String(a.start?.workDir), 'repo/a.txt')),
      30_000,
    );
    const b = enqueue('write b.txt retained\nhang', {
      tool: {
        kind: 'codex',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: [],
          deniedPatterns: [],
          idleTimeoutMs: 60000,
        },
      },
    });
    await waitFor(
      () =>
        b.status === 'running' &&
        existsSync(path.join(String(b.start?.workDir), 'repo/b.txt')),
      30_000,
    );
    const reader = enqueue('read a.txt\nread b.txt\nsystem', {
      workspace: { ...workspace, readOnly: true },
    });
    await waitFor(
      () => reader.status === 'completed' || reader.status === 'failed',
      30_000,
    );
    expect(reader.fail).toBeUndefined();
    expect(a.start?.workDir).toBe(b.start?.workDir);
    expect(a.start?.workDir).toBe(reader.start?.workDir);
    server.cancel(a.payload.run.id);
    await waitFor(() => a.status === 'cancelled', 20_000);
    expect(b.status).toBe('running');
    server.cancel(b.payload.run.id);
    await waitFor(() => b.status === 'cancelled', 20_000);
    const repo = path.join(String(a.start?.workDir), 'repo');
    expect(readFileSync(path.join(repo, 'a.txt'), 'utf8')).toBe('retained');
    expect(readFileSync(path.join(repo, 'b.txt'), 'utf8')).toBe('retained');
    const resumed = enqueue('system\nsay resumed', {
      prompt: {
        system: '{{runner.workspaceInit}}\n{{runner.workspaceNotes}}',
        session: 'resume',
        resumeSessionId: 'claude-existing-session',
        turn: 'system\nsay resumed',
      },
    });
    await waitFor(
      () => resumed.status === 'completed' || resumed.status === 'failed',
      30_000,
    );
    expect(resumed.fail).toBeUndefined();
    expect(resumed.start?.workDir).toBe(a.start?.workDir);
    expect(resumed.start?.sessionId).toBe('claude-existing-session');
    expect(resumed.complete?.sessionId).toBe('claude-existing-session');
    expect(
      [...resumed.events.values()]
        .filter((event) => event.type === 'text')
        .map((event) => event.content)
        .join('\n'),
    ).not.toContain('INITIALIZE_FIXED_WORKSPACE');
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/runner/resume/'],
        git(['rev-parse', '--git-common-dir'], repo),
      ),
    ).toBe('');
    expect(
      git(
        ['for-each-ref', '--format=%(refname)', 'refs/heads/agent/shared'],
        remote.slice('file://'.length),
      ),
    ).toBe('');
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(root);
  }
}, 90_000);
