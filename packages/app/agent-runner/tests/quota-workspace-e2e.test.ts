// Real worker processes and Git; native adapters are separately covered by their protocol-shaped tests.
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

it('retains a large dirty workspace across quota failure, strict continuation and explicit tool handoff', async () => {
  const server = new FakeServer();
  await server.listen();
  const root = tempDir('quota-workspace-');
  const env = cliEnv(path.join(root, 'home'));
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
        branch: 'agent/quota',
        defaultBranch: 'main',
        path: 'repo',
      },
    ],
    env: [],
  };
  const subject = { key: 'quota-task', url: 'http://app.test/quota-task' };
  const first = server.enqueue({
    subject,
    workspace,
    prompt: {
      system: '{{runner.workspaceNotes}}',
      session: 'fresh',
      turn: `bash node -e "for(let i=0;i<250;i++)require('fs').writeFileSync('phase-'+i+'.txt','progress'.repeat(4000))"\nfail toolQuota quota exhausted`,
    },
  });
  const daemon = startDaemon(env);
  try {
    await waitFor(() => first.status === 'failed', 30_000);
    expect(first.fail?.reason).toBe('toolQuota');
    const original = String(first.start?.workDir);
    const repo = path.join(original, 'repo');
    expect(readFileSync(path.join(repo, 'phase-249.txt'), 'utf8')).toBe(
      'progress'.repeat(4000),
    );
    expect(git(['status', '--porcelain'], repo).split('\n')).toHaveLength(250);
    const resumed = server.enqueue({
      subject,
      workspace,
      session: { strict: true },
      prompt: {
        system: '{{runner.workspaceNotes}}',
        session: 'resume',
        resumeSessionId: first.fail!.sessionId!,
        turn: 'write continued.txt resumed',
      },
    });
    await waitFor(
      () => resumed.status === 'completed' || resumed.status === 'failed',
      30_000,
    );
    expect(resumed.fail).toBeUndefined();
    expect(resumed.start?.workDir).toBe(original);
    expect(resumed.complete?.sessionId).toBe(first.fail?.sessionId);
    expect(existsSync(path.join(repo, 'continued.txt'))).toBe(true);
    const replacement = server.enqueue({
      subject,
      workspace,
      tool: {
        kind: 'codex',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: [],
          deniedPatterns: [],
          idleTimeoutMs: 60_000,
        },
      },
      prompt: {
        system: '{{runner.workspaceNotes}}',
        session: 'fresh',
        turn: 'write handoff.txt continued',
      },
    });
    await waitFor(
      () =>
        replacement.status === 'completed' || replacement.status === 'failed',
      30_000,
    );
    expect(replacement.fail).toBeUndefined();
    expect(replacement.start?.workDir).toBe(original);
    expect(git(['branch', '--show-current'], repo)).toBe('agent/quota');
    expect(git(['status', '--porcelain'], repo).split('\n')).toHaveLength(252);
    expect(readFileSync(path.join(repo, 'phase-249.txt'), 'utf8')).toBe(
      'progress'.repeat(4000),
    );
  } finally {
    await stopDaemon(daemon);
    await server.close();
    removeDir(root);
  }
}, 90_000);
