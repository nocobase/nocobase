// A run's repository credentials on demand (agent/git-credentials.ts): the broker against a scripted server, the
// helper against a real git, and the runner's own git against a git server over HTTP that refuses a credential once it
// is no longer valid, as GitHub does with an expired installation token.
import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAgentEnv } from '../src/agent/env.ts';
import {
  FORCED_REFRESH_INTERVAL_MS,
  GitCredentialBroker,
  installCredentialHelper,
  MAX_SOCKET_PATH_BYTES,
  REFRESH_MARGIN_MS,
  serveGitCredentials,
  type CredentialServer,
} from '../src/agent/git-credentials.ts';
import {
  checkout,
  RepoAccessFailure,
  reportRepos,
} from '../src/core/checkout.ts';
import type { SpoolEvent } from '../src/core/events.ts';
import { installGitHooks } from '../src/core/push-guard.ts';
import { runnerPaths, type RunnerPaths } from '../src/lib/home.ts';
import { ApiError, type ApiClient } from '../src/lib/http.ts';
import {
  makeServedRepo,
  startGitHttpServer,
  type GitHttpServer,
} from './git-http-server.ts';
import { git as hostGit, removeDir, tempDir } from './helpers.ts';

const APP = 'https://github.com/acme/app.git';
const LIB = 'https://github.com/acme/lib.git';
const HOUR = 3_600_000;

interface Asked {
  readonly route: string;
  readonly body: { attempt: number; url: string; refresh?: boolean };
}

/** A client whose `post` answers with `answer`, recording what it was asked. */
function scripted(answer: (asked: Asked, count: number) => unknown): {
  client: ApiClient;
  asked: Asked[];
} {
  const asked: Asked[] = [];
  const client = {
    post: async (route: string, body: Asked['body']) => {
      asked.push({ route, body });
      const result = answer({ route, body }, asked.length);
      if (result instanceof Error) throw result;
      return result;
    },
  } as unknown as ApiClient;
  return { client, asked };
}

function issued(token: string, expiresAt: number) {
  return {
    username: 'x-access-token',
    password: token,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

describe('the credential broker', () => {
  let now = Date.parse('2026-10-01T00:00:00.000Z');
  const clock = () => now;
  beforeEach(() => {
    now = Date.parse('2026-10-01T00:00:00.000Z');
  });

  function broker(
    answer: (asked: Asked, count: number) => unknown,
    extra: Partial<ConstructorParameters<typeof GitCredentialBroker>[0]> = {},
  ) {
    const { client, asked } = scripted(answer);
    const secrets: string[] = [];
    const events: SpoolEvent[] = [];
    const lost: string[] = [];
    const instance = new GitCredentialBroker({
      client,
      runId: 'r1',
      attempt: 2,
      onDemand: [APP, LIB],
      onSecret: (secret) => secrets.push(secret),
      onLost: (code) => lost.push(code),
      event: (event) => events.push(event),
      now: clock,
      ...extra,
    });
    return { instance, asked, secrets, events, lost };
  }

  it('asks for a repository’s credential with the run’s attempt, and keeps it until it is about to expire', async () => {
    const { instance, asked, secrets } = broker((_, count) =>
      issued(`token-${count}`, now + HOUR),
    );
    expect(instance.urls).toEqual([APP, LIB]);
    expect(await instance.get(APP)).toEqual({
      username: 'x-access-token',
      token: 'token-1',
    });
    expect(asked).toEqual([
      {
        route: '/api/agents/runners/runs/r1/gitCredentials',
        body: { attempt: 2, url: APP },
      },
    ]);
    // Two git processes at once share one request.
    now += 30 * 60_000;
    const [a, b] = await Promise.all([instance.get(APP), instance.get(APP)]);
    expect([a.token, b.token]).toEqual(['token-1', 'token-1']);
    expect(asked).toHaveLength(1);
    // Within the margin of its expiry, and past it, a new one is asked for: the run outlives every credential.
    now += HOUR - 30 * 60_000 - REFRESH_MARGIN_MS + 1;
    expect((await instance.get(APP)).token).toBe('token-2');
    now += 3 * HOUR;
    expect((await instance.get(APP)).token).toBe('token-3');
    // Each repository has its own.
    expect((await instance.get(LIB)).token).toBe('token-4');
    expect(asked.map((each) => each.body.url)).toEqual([APP, APP, APP, LIB]);
    expect(secrets).toEqual(['token-1', 'token-2', 'token-3', 'token-4']);
  });

  it('forgets a refused credential only when it is the one it holds, and asks anew with refresh, at most once a minute', async () => {
    const { instance, asked } = broker((_, count) =>
      issued(`token-${count}`, now + HOUR),
    );
    await instance.get(APP);
    // A late erase from an older git process names another credential: nothing is forgotten.
    expect(instance.erase(APP, { token: 'token-0' })).toBe(false);
    expect((await instance.get(APP)).token).toBe('token-1');
    expect(instance.erase(APP, { token: 'token-1' })).toBe(true);
    expect((await instance.get(APP)).token).toBe('token-2');
    expect(asked[1]?.body).toEqual({ attempt: 2, url: APP, refresh: true });
    // Refused again within the minute: a new one is asked for, but the application is not made to issue one anew.
    expect(instance.erase(APP, { token: 'token-2' })).toBe(true);
    expect((await instance.get(APP)).token).toBe('token-3');
    expect(asked[2]?.body).toEqual({ attempt: 2, url: APP });
    now += FORCED_REFRESH_INTERVAL_MS;
    instance.erase(APP, { token: 'token-3' });
    await instance.get(APP);
    expect(asked[3]?.body.refresh).toBe(true);
  });

  it('says why there is no credential, and never answers with an older one', async () => {
    let next: unknown = issued('token-1', now + HOUR);
    const { instance, events } = broker(() => next);
    await instance.get(APP);
    instance.erase(APP, { token: 'token-1' });
    const failure = async (): Promise<RepoAccessFailure> => {
      try {
        await instance.get(APP);
      } catch (error) {
        return error as RepoAccessFailure;
      }
      throw new Error('A credential was given.');
    };
    next = new ApiError(
      503,
      'REPO_ACCESS_UNAVAILABLE',
      'GitHub is unavailable just now.',
    );
    expect(await failure()).toMatchObject({ kind: 'unavailable' });
    next = new ApiError(0, 'NETWORK', 'connect ECONNREFUSED');
    expect(await failure()).toMatchObject({ kind: 'unavailable' });
    next = new ApiError(
      403,
      'REPO_ACCESS_DENIED',
      'The GitHub App is not installed on acme/app.',
    );
    const denied = await failure();
    expect(denied.kind).toBe('denied');
    expect(denied.message).toContain(
      'The GitHub App is not installed on acme/app.',
    );
    next = new ApiError(400, 'INVALID_REQUEST', 'Not one of the run’s.');
    expect(await failure()).toMatchObject({ kind: 'denied' });
    expect(events.map((event) => event.meta)).toEqual([
      { kind: 'gitCredential', url: APP, reason: 'unavailable' },
      { kind: 'gitCredential', url: APP, reason: 'unavailable' },
      { kind: 'gitCredential', url: APP, reason: 'denied' },
      { kind: 'gitCredential', url: APP, reason: 'denied' },
    ]);
    expect(events[0]?.type).toBe('error');
  });

  it('stops once the run is no longer this runner’s, whatever it held', async () => {
    let lose = false;
    const { instance, asked, lost } = broker((_, count) =>
      lose
        ? new ApiError(
            409,
            'LEASE_LOST',
            'This runner no longer holds the run.',
          )
        : issued(`token-${count}`, now + HOUR),
    );
    await instance.get(APP);
    lose = true;
    await expect(instance.get(LIB)).rejects.toMatchObject({
      kind: 'leaseLost',
    });
    expect(lost).toEqual(['LEASE_LOST']);
    expect(instance.isClosed).toBe(true);
    // Not even the credential it still had for the other repository.
    await expect(instance.get(APP)).rejects.toMatchObject({
      kind: 'leaseLost',
    });
    expect(asked).toHaveLength(2);
  });

  it('answers a credential the claim handed out as it is, and nothing for another repository', async () => {
    const { instance, asked, secrets } = broker(() => issued('x', now), {
      onDemand: [],
      credentials: [
        {
          url: APP,
          username: 'x-access-token',
          password: 'claim-token',
          expiresAt: new Date(now + HOUR).toISOString(),
        },
      ],
    });
    expect(secrets).toEqual(['claim-token']);
    expect(instance.covers(APP)).toBe(true);
    expect(instance.covers(LIB)).toBe(false);
    expect((await instance.get(APP)).token).toBe('claim-token');
    expect(instance.erase(APP, { token: 'claim-token' })).toBe(false);
    await expect(instance.get(LIB)).rejects.toMatchObject({ kind: 'denied' });
    expect(asked).toEqual([]);
  });
});

describe('the agent’s git and the runner’s helper', () => {
  let root: string;
  let server: CredentialServer | undefined;
  afterEach(async () => {
    await server?.close();
    server = undefined;
    removeDir(root);
  });

  const run = (
    args: string[],
    cwd: string,
    env: NodeJS.ProcessEnv,
    input?: string,
  ) =>
    new Promise<{ stdout: string; stderr: string; failed: boolean }>(
      (resolve) => {
        const child = execFile(
          'git',
          args,
          { cwd, env },
          (error, stdout, stderr) =>
            resolve({ stdout, stderr, failed: error !== null }),
        );
        if (input !== undefined) child.stdin?.end(input);
      },
    );

  it('answers each repository on one host with its own credential, through the socket only, and keeps it out of the environment', async () => {
    root = tempDir('nocobase-runner-git-credentials-');
    // A runner home deep enough that a socket in it would not fit a Unix socket path.
    const home = path.join(root, 'h'.repeat(120));
    const tokens: Record<string, string> = {
      [APP]: 'ghs_app_token_synthetic',
      [LIB]: 'ghs_lib_token_synthetic',
    };
    const { client } = scripted(({ body }) =>
      issued(tokens[body.url]!, Date.now() + HOUR),
    );
    const broker = new GitCredentialBroker({
      client,
      runId: 'r1',
      attempt: 1,
      onDemand: [APP, LIB],
      onSecret: () => undefined,
      onLost: () => undefined,
    });
    server = await serveGitCredentials(broker, home);
    expect(Buffer.byteLength(server.socket)).toBeLessThanOrEqual(
      MAX_SOCKET_PATH_BYTES,
    );
    expect(server.socket.startsWith(home)).toBe(false);
    const hooks = path.join(root, 'hooks');
    await installGitHooks(hooks);
    const helper = await installCredentialHelper(path.join(root, 'helpers'));
    const env = {
      ...buildAgentEnv({
        source: { PATH: process.env.PATH ?? '' },
        hooksDir: hooks,
        home: root,
        credentialHelper: {
          helper,
          socket: server.socket,
          nonce: server.nonce,
          urls: broker.urls,
        },
      }),
      GIT_CONFIG_NOSYSTEM: '1',
    };
    const repo = path.join(root, 'repo');
    hostGit(['init', '--quiet', repo]);
    const fill = (url: string, environment = env) =>
      run(['credential', 'fill'], repo, environment, `url=${url}\n\n`);

    expect((await fill(APP)).stdout).toContain(
      'password=ghs_app_token_synthetic',
    );
    expect((await fill(LIB)).stdout).toContain(
      'password=ghs_lib_token_synthetic',
    );
    const other = await fill('https://github.com/acme/other.git');
    expect(other.failed).toBe(true);
    expect(other.stdout).not.toContain('ghs_');

    // The credential is in neither the environment nor any file git reads.
    expect(JSON.stringify(env)).not.toContain('ghs_');
    expect(
      await readFile(path.join(repo, '.git', 'config'), 'utf8'),
    ).not.toContain('ghs_');

    // A shell outside the run, or with another run's nonce, gets nothing, and git stops instead of prompting.
    const stranger = await fill(APP, {
      ...env,
      NOCOBASE_RUNNER_GIT_CREDENTIAL_NONCE: 'f'.repeat(48),
    });
    expect(stranger.failed).toBe(true);
    expect(stranger.stdout).not.toContain('ghs_');
    expect(stranger.stderr).toContain('does not belong to the run');

    // git's erase after a refusal discards the credential and tells the agent to run the command once more.
    const erased = await run(
      ['credential', 'reject'],
      repo,
      env,
      `url=${APP}\nusername=x-access-token\npassword=ghs_app_token_synthetic\n\n`,
    );
    expect(erased.stderr).toContain('Run the git command again once');

    // Once the run ends, the socket is gone and git is told so.
    await server.close();
    server = undefined;
    const ended = await fill(APP);
    expect(ended.failed).toBe(true);
    expect(ended.stderr).toContain('nocobase-runner:');
  });
});

describe('the runner’s own git with credentials on demand', () => {
  let root: string;
  let paths: RunnerPaths;
  let remote: GitHttpServer;
  /** The passwords the git server takes, by repository. */
  const valid = new Map<string, Set<string>>();
  /** The repository each password was issued for. */
  const issuedFor = new Map<string, string>();
  let issuedCount = 0;

  beforeEach(async () => {
    root = tempDir('nocobase-runner-git-http-');
    paths = runnerPaths(path.join(root, 'home'), path.join(root, 'work'));
    const served = path.join(root, 'served');
    makeServedRepo(served, 'app');
    makeServedRepo(served, 'lib');
    valid.clear();
    issuedFor.clear();
    issuedCount = 0;
    remote = await startGitHttpServer(
      served,
      (repo, password) => valid.get(repo)?.has(password) === true,
    );
    // A host credential helper that would answer with the host's own credential: never used for these repositories.
    const globalConfig = path.join(root, 'gitconfig');
    await writeFile(
      globalConfig,
      '[credential]\n\thelper = "!f() { echo username=host; echo password=host-own-secret; }; f"\n',
    );
    vi.stubEnv('GIT_CONFIG_GLOBAL', globalConfig);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await remote.close();
    removeDir(root);
  });

  /** A broker whose server issues a new credential for each request, which the git server then takes. */
  function brokerFor(
    urls: readonly string[],
    answer?: (url: string) => unknown,
  ) {
    const { client, asked } = scripted(({ body }) => {
      const custom = answer?.(body.url);
      if (custom !== undefined) return custom;
      issuedCount += 1;
      const token = `ghs_issued_${issuedCount}`;
      const repo = body.url.slice(body.url.lastIndexOf('/') + 1);
      valid.set(repo, new Set([...(valid.get(repo) ?? []), token]));
      issuedFor.set(token, repo);
      return issued(token, Date.now() + HOUR);
    });
    const broker = new GitCredentialBroker({
      client,
      runId: 'r1',
      attempt: 1,
      onDemand: urls,
      onSecret: () => undefined,
      onLost: () => undefined,
    });
    return { broker, asked };
  }

  const dirsOf = (...names: string[]) =>
    names.map((name) => ({
      kind: 'repo' as const,
      url: remote.url(name),
      defaultBranch: 'main',
      branch: 'agent/PM-1',
      path: name,
    }));

  const commit = (dir: string) =>
    hostGit(
      [
        '-c',
        'user.name=A',
        '-c',
        'user.email=a@example.com',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        'work',
      ],
      dir,
    );

  it('checks out and pushes two repositories of one host, each with its own credential, and once more with a fresh one after the remote refused', async () => {
    const { broker, asked } = brokerFor([remote.url('app'), remote.url('lib')]);
    const result = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-1',
      dirs: dirsOf('app', 'lib'),
      auth: broker,
    });
    try {
      for (const repo of result.repos) commit(repo.dir);
      // Every credential issued so far expires, as an installation token does after an hour.
      valid.clear();
      const reports = await reportRepos(result.repos, {
        push: true,
        auth: broker,
      });
      expect(reports.map((report) => [report.pushed, report.failure])).toEqual([
        [true, undefined],
        [true, undefined],
      ]);
      expect(asked.map((each) => [each.body.url, each.body.refresh])).toEqual([
        [remote.url('app'), undefined],
        [remote.url('lib'), undefined],
        [remote.url('app'), true],
        [remote.url('lib'), true],
      ]);
      // Each repository was only ever shown its own credentials, and the host's own was never sent.
      expect(remote.presented.length).toBeGreaterThan(0);
      for (const { repo, password } of remote.presented)
        expect(issuedFor.get(password)).toBe(repo);
    } finally {
      await result.release();
    }
  });

  it('says why a repository was not pushed, and never falls back to the host’s credential', async () => {
    let refuse: unknown;
    const { broker } = brokerFor([remote.url('app')], () => refuse);
    const result = await checkout({
      paths,
      appKey: 'app',
      subjectKey: 'PM-1',
      dirs: dirsOf('app'),
      auth: broker,
    });
    try {
      commit(result.repos[0]!.dir);
      valid.clear();
      const outcome = async () =>
        (await reportRepos(result.repos, { push: true, auth: broker }))[0]!;

      refuse = new ApiError(
        403,
        'REPO_ACCESS_DENIED',
        'The GitHub App is not installed on acme/app.',
      );
      expect(await outcome()).toMatchObject({
        pushed: false,
        failure: { reason: 'credentialDenied' },
      });
      refuse = new ApiError(
        503,
        'REPO_ACCESS_UNAVAILABLE',
        'GitHub is unavailable just now.',
      );
      expect((await outcome()).failure?.reason).toBe('credentialUnavailable');

      // Issued, but refused by the remote even when fresh.
      refuse = issued('ghs_never_valid', Date.now() + HOUR);
      const refused = await outcome();
      expect(refused.failure?.reason).toBe('authFailed');
      expect(refused.pushed).toBe(false);

      // Once the run is no longer this runner's, nothing is pushed at all.
      broker.close();
      const before = remote.presented.length;
      expect((await outcome()).failure?.reason).toBe('leaseLost');
      expect(remote.presented.length).toBe(before);
      expect(
        remote.presented.some((each) => each.password === 'host-own-secret'),
      ).toBe(false);
    } finally {
      await result.release();
    }
  });

  it('fails the checkout with the reason when the application issues no credential', async () => {
    const { broker } = brokerFor(
      [remote.url('app')],
      () =>
        new ApiError(
          403,
          'REPO_ACCESS_DENIED',
          'The GitHub App is not installed on acme/app.',
        ),
    );
    await expect(
      checkout({
        paths,
        appKey: 'app',
        subjectKey: 'PM-1',
        dirs: dirsOf('app'),
        auth: broker,
      }),
    ).rejects.toMatchObject({ kind: 'denied' });
    expect(remote.presented).toEqual([]);
  });
});
