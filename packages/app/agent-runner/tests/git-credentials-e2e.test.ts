// Repository credentials on demand end to end: the real daemon and worker, the echo adapter running the agent's git, and
// a git server over HTTP that refuses a credential once it expired, as GitHub does with an installation token.
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FakeServer, waitFor } from './fake-server.ts';
import {
  makeServedRepo,
  startGitHttpServer,
  type GitHttpServer,
} from './git-http-server.ts';
import {
  cliEnv,
  git,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  writeFakeCli,
  type Daemon,
} from './helpers.ts';

const COMMIT =
  'git -c user.name=Agent -c user.email=agent@example.com -c commit.gpgsign=false';

describe('repository credentials on demand', () => {
  let server: FakeServer;
  let remote: GitHttpServer;
  let home: string;
  let scratch: string;
  let served: string;
  let env: NodeJS.ProcessEnv;
  const daemons: Daemon[] = [];
  /** The passwords the git server takes, by repository, and the repository each was issued for. */
  const valid = new Map<string, Set<string>>();
  const issuedFor = new Map<string, string>();
  /** A file the agent writes to make every credential issued so far expire. */
  let expireMarker = '';

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-home-');
    scratch = tempDir('nocobase-runner-scratch-');
    served = path.join(scratch, 'served');
    makeServedRepo(served, 'app');
    makeServedRepo(served, 'lib');
    valid.clear();
    issuedFor.clear();
    remote = await startGitHttpServer(served, (repo, password) => {
      if (expireMarker !== '' && existsSync(expireMarker)) {
        valid.clear();
        rmSync(expireMarker);
      }
      return valid.get(repo)?.has(password) === true;
    });
    let count = 0;
    server.gitCredential = ({ url }) => {
      count += 1;
      const repo = url.slice(url.lastIndexOf('/') + 1);
      // Not shaped like a GitHub token, so only redaction by value can remove it.
      const password = `issued-credential-${count}-synthetic`;
      valid.set(repo, new Set([...(valid.get(repo) ?? []), password]));
      issuedFor.set(password, repo);
      return {
        username: 'x-access-token',
        password,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    };
    env = cliEnv(home);
    await registerRunner(server.url, env, [
      '--cli',
      `appcli=${writeFakeCli(scratch)}`,
    ]);
  });

  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    await server.close();
    await remote.close();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(scratch);
  });

  const daemon = (): Daemon => {
    const started = startDaemon(env);
    daemons.push(started);
    return started;
  };

  const repoDir = (name: string) => ({
    kind: 'repo' as const,
    url: remote.url(name),
    defaultBranch: 'main',
    branch: 'agent/PM-9',
    path: name,
  });

  it('announces the feature', async () => {
    const runner = [...server.runners.values()][0];
    expect(runner?.register.features).toContain('gitCredentials');
  });

  it('pushes past an expired credential, for the agent and at the end, with each repository’s own, never showing one', async () => {
    const workDir = path.join(workRootOf(home), 'test-app', 'PM-9');
    expireMarker = path.join(workDir, 'app', 'expire-now');
    const run = server.enqueue({
      subject: { key: 'PM-9', url: 'http://app.test/PM-9' },
      workspace: {
        dirs: [repoDir('app'), repoDir('lib')],
        env: [],
        git: { onDemand: [remote.url('app'), remote.url('lib')] },
      },
      prompt: {
        system: 'System rules.',
        session: 'fresh',
        turn: [
          'bash env',
          `bash printf 'url=${remote.url('app')}\\n\\n' | git credential fill`,
          `bash ${COMMIT} commit -q --allow-empty -m app-work`,
          `bash ${COMMIT} -C ../lib commit -q --allow-empty -m lib-work`,
          // Every credential issued so far expires; the agent's push is refused once, then goes through.
          'write expire-now x',
          'bash git push origin HEAD:refs/heads/agent/PM-9',
          'bash git push origin HEAD:refs/heads/agent/PM-9',
          // And again before the runner pushes the other repository at the end.
          'write expire-now x',
          'say done',
        ].join('\n'),
      },
    });
    daemon();
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      30_000,
      'the run to end',
    );
    expect(run.fail).toBeUndefined();
    expect(run.complete?.repos).toEqual([
      expect.objectContaining({ url: remote.url('app'), pushed: true }),
      expect.objectContaining({ url: remote.url('lib'), pushed: true }),
    ]);
    for (const name of ['app', 'lib'])
      expect(
        git(
          ['rev-parse', '--verify', 'refs/heads/agent/PM-9'],
          path.join(served, `${name}.git`),
        ),
      ).toMatch(/^[0-9a-f]{40}$/u);

    // Asked again with refresh for each repository once its credential was refused.
    const asked = server.gitCredentialRequests.map((request) => [
      request.url.endsWith('app.git') ? 'app' : 'lib',
      request.refresh,
      request.attempt,
    ]);
    expect(asked).toContainEqual(['app', true, 1]);
    expect(asked).toContainEqual(['lib', true, 1]);
    // Each repository was shown its own credentials only.
    expect(remote.presented.length).toBeGreaterThan(0);
    for (const { repo, password } of remote.presented)
      expect(issuedFor.get(password)).toBe(repo);

    const events = server.events(run.payload.run.id);
    const transcript = JSON.stringify(events);
    expect(transcript).not.toMatch(/issued-credential-\d+-synthetic/u);
    // The agent read a credential through git, and the transcript has it redacted.
    expect(transcript).toContain('password=[REDACTED]');
    // The refused push told the agent what happened and what to do.
    expect(transcript).toContain('Run the git command again once');
    const envOutput = events.find(
      (event) => event.type === 'toolResult' && event.output?.includes('PATH='),
    )?.output;
    expect(envOutput).toContain('NOCOBASE_RUNNER_GIT_CREDENTIAL_SOCKET=');
    expect(envOutput).not.toMatch(/PASSWORD/u);
  });

  it('fails the run with the reason when the application will not issue a credential, using no other', async () => {
    server.gitCredential = () => ({
      status: 403,
      reason: 'REPO_ACCESS_DENIED',
      message: 'The GitHub App is not installed on acme/app.',
    });
    const run = server.enqueue({
      workspace: {
        dirs: [repoDir('app')],
        env: [],
        git: { onDemand: [remote.url('app')] },
      },
    });
    daemon();
    await waitFor(() => run.status === 'failed', 20_000, 'the run to fail');
    expect(run.fail?.reason).toBe('repoAccessDenied');
    expect(run.fail?.detail).toContain(
      'The GitHub App is not installed on acme/app.',
    );
    expect(run.start).toBeUndefined();
    expect(remote.presented).toEqual([]);
  });

  it('fails the run as retryable when the application cannot issue one just now', async () => {
    server.gitCredential = () => ({
      status: 503,
      reason: 'REPO_ACCESS_UNAVAILABLE',
      message: 'GitHub is unavailable just now.',
    });
    const run = server.enqueue({
      workspace: {
        dirs: [repoDir('app')],
        env: [],
        git: { onDemand: [remote.url('app')] },
      },
    });
    daemon();
    await waitFor(() => run.status === 'failed', 20_000, 'the run to fail');
    expect(run.fail?.reason).toBe('repoAccessUnavailable');
    expect(run.fail?.detail).toContain('GitHub is unavailable just now.');
  });
});
